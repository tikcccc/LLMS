import {
  getArea as getExtentArea,
  getCenter,
  getIntersection,
  isEmpty as isEmptyExtent,
} from "ol/extent";

const EPSILON = 1e-7;

const normalizeId = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const readFeatureId = (feature) =>
  normalizeId(feature?.getId?.() ?? feature?.get?.("refId"));

const isFiniteCoordinate = (value) =>
  Array.isArray(value) && value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]);

const toCoordinate2D = (value) => (isFiniteCoordinate(value) ? [value[0], value[1]] : null);

const coordinatesEqual = (left, right) =>
  Math.abs(left[0] - right[0]) <= EPSILON && Math.abs(left[1] - right[1]) <= EPSILON;

const forEachRingSegment = (ring, visitor) => {
  if (!Array.isArray(ring)) return;
  const points = ring.map(toCoordinate2D).filter(Boolean);
  if (points.length < 2) return;
  const closed = coordinatesEqual(points[0], points[points.length - 1]);
  const segmentCount = closed ? points.length - 1 : points.length;
  for (let index = 0; index < segmentCount; index += 1) {
    const start = points[index];
    const end = points[(index + 1) % points.length];
    visitor(start, end);
  }
};

const cross = (a, b, c) =>
  (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);

const orientation = (a, b, c) => {
  const value = cross(a, b, c);
  if (value > EPSILON) return 1;
  if (value < -EPSILON) return -1;
  return 0;
};

const pointOnSegment = (point, start, end) => {
  if (orientation(start, end, point) !== 0) return false;
  const minX = Math.min(start[0], end[0]) - EPSILON;
  const maxX = Math.max(start[0], end[0]) + EPSILON;
  const minY = Math.min(start[1], end[1]) - EPSILON;
  const maxY = Math.max(start[1], end[1]) + EPSILON;
  return point[0] >= minX && point[0] <= maxX && point[1] >= minY && point[1] <= maxY;
};

const segmentsIntersect = (a1, a2, b1, b2) => {
  const o1 = orientation(a1, a2, b1);
  const o2 = orientation(a1, a2, b2);
  const o3 = orientation(b1, b2, a1);
  const o4 = orientation(b1, b2, a2);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && pointOnSegment(b1, a1, a2)) return true;
  if (o2 === 0 && pointOnSegment(b2, a1, a2)) return true;
  if (o3 === 0 && pointOnSegment(a1, b1, b2)) return true;
  if (o4 === 0 && pointOnSegment(a2, b1, b2)) return true;
  return false;
};

const ringIntersectsRing = (ringA, ringB) => {
  let found = false;
  forEachRingSegment(ringA, (a1, a2) => {
    if (found) return;
    forEachRingSegment(ringB, (b1, b2) => {
      if (found) return;
      if (segmentsIntersect(a1, a2, b1, b2)) {
        found = true;
      }
    });
  });
  return found;
};

const pointInRing = (point, ring) => {
  const vertices = Array.isArray(ring) ? ring.map(toCoordinate2D).filter(Boolean) : [];
  if (vertices.length < 3) return false;
  let inside = false;
  const closed = coordinatesEqual(vertices[0], vertices[vertices.length - 1]);
  const segmentCount = closed ? vertices.length - 1 : vertices.length;

  for (let index = 0; index < segmentCount; index += 1) {
    const current = vertices[index];
    const next = vertices[(index + 1) % vertices.length];

    if (pointOnSegment(point, current, next)) return true;

    const intersects =
      (current[1] > point[1]) !== (next[1] > point[1]) &&
      point[0] <
        ((next[0] - current[0]) * (point[1] - current[1])) /
          (next[1] - current[1]) +
          current[0];
    if (intersects) inside = !inside;
  }

  return inside;
};

const pointInPolygon = (point, polygonCoordinates) => {
  if (!Array.isArray(polygonCoordinates) || polygonCoordinates.length === 0) return false;
  const [outerRing, ...holes] = polygonCoordinates;
  if (!pointInRing(point, outerRing)) return false;
  if (!holes.length) return true;
  return !holes.some((ring) => pointInRing(point, ring));
};

const firstPolygonPoint = (polygonCoordinates) => {
  const outerRing = Array.isArray(polygonCoordinates) ? polygonCoordinates[0] : null;
  if (!Array.isArray(outerRing)) return null;
  for (const vertex of outerRing) {
    const coordinate = toCoordinate2D(vertex);
    if (coordinate) return coordinate;
  }
  return null;
};

const toPolygonCoordinates = (geometry) => {
  if (!geometry || typeof geometry.getType !== "function") return [];
  const type = geometry.getType();
  if (type === "Polygon") {
    const coordinates = geometry.getCoordinates?.();
    return Array.isArray(coordinates) ? [coordinates] : [];
  }
  if (type === "MultiPolygon") {
    const coordinates = geometry.getCoordinates?.();
    return Array.isArray(coordinates) ? coordinates : [];
  }
  return [];
};

const toRepresentativeCoordinate = (geometry) => {
  if (!geometry) return null;
  if (typeof geometry.getInteriorPoint === "function") {
    const point = geometry.getInteriorPoint();
    const coordinate = toCoordinate2D(point?.getCoordinates?.());
    if (coordinate) return coordinate;
  }
  if (typeof geometry.getInteriorPoints === "function") {
    const points = geometry.getInteriorPoints();
    const coordinate = toCoordinate2D(points?.getCoordinates?.()?.[0]);
    if (coordinate) return coordinate;
  }
  const extent = geometry.getExtent?.();
  if (!extent || isEmptyExtent(extent)) return null;
  return getCenter(extent);
};

const polygonsContact = (leftPolygon, rightPolygon) => {
  const leftRings = Array.isArray(leftPolygon) ? leftPolygon : [];
  const rightRings = Array.isArray(rightPolygon) ? rightPolygon : [];
  if (!leftRings.length || !rightRings.length) return false;

  for (const leftRing of leftRings) {
    for (const rightRing of rightRings) {
      if (ringIntersectsRing(leftRing, rightRing)) return true;
    }
  }

  const leftPoint = firstPolygonPoint(leftPolygon);
  if (leftPoint && pointInPolygon(leftPoint, rightPolygon)) return true;

  const rightPoint = firstPolygonPoint(rightPolygon);
  if (rightPoint && pointInPolygon(rightPoint, leftPolygon)) return true;

  return false;
};

const geometriesContact = (leftGeometry, rightGeometry) => {
  if (!leftGeometry || !rightGeometry) return false;

  const leftExtent = leftGeometry.getExtent?.();
  const rightExtent = rightGeometry.getExtent?.();
  if (
    !leftExtent ||
    !rightExtent ||
    isEmptyExtent(leftExtent) ||
    isEmptyExtent(rightExtent) ||
    !leftGeometry.intersectsExtent?.(rightExtent) ||
    !rightGeometry.intersectsExtent?.(leftExtent)
  ) {
    return false;
  }

  const leftPolygons = toPolygonCoordinates(leftGeometry);
  const rightPolygons = toPolygonCoordinates(rightGeometry);
  if (leftPolygons.length > 0 && rightPolygons.length > 0) {
    for (const leftPolygon of leftPolygons) {
      for (const rightPolygon of rightPolygons) {
        if (polygonsContact(leftPolygon, rightPolygon)) {
          return true;
        }
      }
    }
    return false;
  }

  const leftPoint = toRepresentativeCoordinate(leftGeometry);
  const rightPoint = toRepresentativeCoordinate(rightGeometry);
  return (
    (leftPoint ? !!rightGeometry.intersectsCoordinate?.(leftPoint) : false) ||
    (rightPoint ? !!leftGeometry.intersectsCoordinate?.(rightPoint) : false)
  );
};

const toIntersectionArea = (geometry, boundaryGeometry) => {
  const lotExtent = geometry?.getExtent?.();
  const boundaryExtent = boundaryGeometry?.getExtent?.();
  if (!lotExtent || !boundaryExtent || isEmptyExtent(lotExtent) || isEmptyExtent(boundaryExtent)) {
    return 0;
  }
  const overlapExtent = getIntersection(lotExtent, boundaryExtent);
  if (!overlapExtent || isEmptyExtent(overlapExtent)) return 0;
  const overlapArea = getExtentArea(overlapExtent);
  return Number.isFinite(overlapArea) && overlapArea > 0 ? overlapArea : 0;
};

const toBoundaryArea = (boundaryGeometry) => {
  if (!boundaryGeometry) return 0;
  if (typeof boundaryGeometry.getArea === "function") {
    const area = Math.abs(boundaryGeometry.getArea());
    if (Number.isFinite(area) && area > 0) return area;
  }
  const extent = boundaryGeometry.getExtent?.();
  if (!extent || isEmptyExtent(extent)) return 0;
  return getExtentArea(extent);
};

export const findSiteBoundaryIdsForGeometry = (geometry, siteBoundarySource) => {
  if (!geometry || !siteBoundarySource) return [];

  const lotExtent = geometry.getExtent?.();
  if (!lotExtent || isEmptyExtent(lotExtent)) return [];
  const lotCenter = toRepresentativeCoordinate(geometry) || getCenter(lotExtent);

  const matches = [];

  siteBoundarySource.getFeatures().forEach((feature) => {
    const id = readFeatureId(feature);
    if (!id) return;

    const boundaryGeometry = feature.getGeometry?.();
    if (!boundaryGeometry) return;
    const boundaryExtent = boundaryGeometry.getExtent?.();
    if (!boundaryExtent || isEmptyExtent(boundaryExtent)) return;

    if (!geometriesContact(geometry, boundaryGeometry)) return;

    const boundaryCenter =
      toRepresentativeCoordinate(boundaryGeometry) || getCenter(boundaryExtent);
    const centerContained = !!boundaryGeometry.intersectsCoordinate?.(lotCenter);
    const overlapArea = toIntersectionArea(geometry, boundaryGeometry);
    const lotContainsBoundaryCenter = !!geometry.intersectsCoordinate?.(boundaryCenter);
    const boundaryArea = toBoundaryArea(boundaryGeometry);

    matches.push({
      id,
      centerContained,
      lotContainsBoundaryCenter,
      overlapArea,
      boundaryArea,
    });
  });

  matches.sort((a, b) => {
    const centerPriority = Number(b.centerContained) - Number(a.centerContained);
    if (centerPriority !== 0) return centerPriority;
    const overlapPriority = b.overlapArea - a.overlapArea;
    if (overlapPriority !== 0) return overlapPriority;
    const lotCenterPriority =
      Number(b.lotContainsBoundaryCenter) - Number(a.lotContainsBoundaryCenter);
    if (lotCenterPriority !== 0) return lotCenterPriority;
    const areaPriority = a.boundaryArea - b.boundaryArea;
    if (areaPriority !== 0) return areaPriority;
    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  });

  return Array.from(new Set(matches.map((item) => item.id)));
};

export const findSiteBoundaryIdForGeometry = (geometry, siteBoundarySource) => {
  const relatedIds = findSiteBoundaryIdsForGeometry(geometry, siteBoundarySource);
  return relatedIds[0] || "";
};
