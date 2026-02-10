import {
  getArea as getExtentArea,
  getCenter,
  getIntersection,
  isEmpty as isEmptyExtent,
} from "ol/extent";

const normalizeId = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const readFeatureId = (feature) =>
  normalizeId(feature?.getId?.() ?? feature?.get?.("refId"));

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
  const lotCenter = getCenter(lotExtent);

  const matches = [];

  siteBoundarySource.getFeatures().forEach((feature) => {
    const id = readFeatureId(feature);
    if (!id) return;

    const boundaryGeometry = feature.getGeometry?.();
    if (!boundaryGeometry) return;
    const boundaryExtent = boundaryGeometry.getExtent?.();
    if (!boundaryExtent || isEmptyExtent(boundaryExtent)) return;

    const centerContained = !!boundaryGeometry.intersectsCoordinate?.(lotCenter);

    if (
      !geometry.intersectsExtent?.(boundaryExtent) ||
      !boundaryGeometry.intersectsExtent?.(lotExtent)
    ) {
      if (!centerContained) return;
    }

    const overlapArea = toIntersectionArea(geometry, boundaryGeometry);
    const lotContainsBoundaryCenter = !!geometry.intersectsCoordinate?.(
      getCenter(boundaryExtent)
    );
    const boundaryArea = toBoundaryArea(boundaryGeometry);

    if (!centerContained && !lotContainsBoundaryCenter && overlapArea <= 0) return;

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
