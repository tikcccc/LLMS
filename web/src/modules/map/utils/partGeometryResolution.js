import { intersects as intersectsExtent, isEmpty as isEmptyExtent } from "ol/extent";
import MultiPolygon from "ol/geom/MultiPolygon";
import Polygon from "ol/geom/Polygon";
import polygonClipping from "polygon-clipping";

const EPSILON = 1e-7;
const AREA_RESOLUTION_EPSILON = 0.01;
const CONTAINMENT_COVERAGE_THRESHOLD = 0.995;

const compareNatural = (left, right) =>
  String(left || "").localeCompare(String(right || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });

const normalizePartKey = (value) => String(value || "").trim().toLowerCase();

const toFiniteCoordinate = (value) => {
  if (!Array.isArray(value) || value.length < 2) return null;
  const x = Number(value[0]);
  const y = Number(value[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return [x, y];
};

const coordinatesEqual = (left, right) =>
  Math.abs(left[0] - right[0]) <= EPSILON && Math.abs(left[1] - right[1]) <= EPSILON;

const sanitizeRing = (ring) => {
  if (!Array.isArray(ring)) return null;
  const points = [];
  ring.forEach((coordinate) => {
    const point = toFiniteCoordinate(coordinate);
    if (!point) return;
    const previous = points[points.length - 1];
    if (previous && coordinatesEqual(previous, point)) return;
    points.push(point);
  });
  if (points.length < 3) return null;
  const first = points[0];
  const last = points[points.length - 1];
  if (!coordinatesEqual(first, last)) {
    points.push([first[0], first[1]]);
  }
  if (points.length < 4) return null;
  return points;
};

const sanitizePolygon = (polygon) => {
  if (!Array.isArray(polygon) || polygon.length === 0) return null;
  const rings = polygon.map((ring) => sanitizeRing(ring)).filter(Boolean);
  if (!rings.length) return null;
  return rings;
};

const sanitizeMultiPolygon = (multiPolygon) => {
  if (!Array.isArray(multiPolygon)) return [];
  return multiPolygon.map((polygon) => sanitizePolygon(polygon)).filter(Boolean);
};

const geometryToMultiPolygon = (geometry) => {
  if (!geometry || typeof geometry.getType !== "function") return [];
  const type = geometry.getType();
  if (type === "Polygon") {
    const coordinates = geometry.getCoordinates?.();
    return sanitizeMultiPolygon([coordinates]);
  }
  if (type === "MultiPolygon") {
    const coordinates = geometry.getCoordinates?.();
    return sanitizeMultiPolygon(coordinates);
  }
  return [];
};

const multiPolygonToGeometry = (coordinates) => {
  const sanitized = sanitizeMultiPolygon(coordinates);
  if (!sanitized.length) return null;
  if (sanitized.length === 1) {
    return new Polygon(sanitized[0]);
  }
  return new MultiPolygon(sanitized);
};

const getCoordinatesArea = (coordinates) =>
  Math.abs(multiPolygonToGeometry(coordinates)?.getArea?.() || 0);

const intersectsByArea = (leftCoordinates, rightCoordinates) => {
  const left = sanitizeMultiPolygon(leftCoordinates);
  const right = sanitizeMultiPolygon(rightCoordinates);
  if (!left.length || !right.length) return false;
  try {
    const intersection = polygonClipping.intersection(left, right);
    return getCoordinatesArea(intersection) > EPSILON;
  } catch (error) {
    return false;
  }
};

const unionCoordinates = (coordinatesList) => {
  const candidates = (Array.isArray(coordinatesList) ? coordinatesList : [])
    .map((coordinates) => sanitizeMultiPolygon(coordinates))
    .filter((coordinates) => coordinates.length > 0);
  if (!candidates.length) return [];
  if (candidates.length === 1) return candidates[0];
  try {
    const merged = polygonClipping.union(candidates[0], ...candidates.slice(1));
    return sanitizeMultiPolygon(merged);
  } catch (error) {
    // Fallback for invalid topology from source drawings:
    // keep all polygons instead of collapsing to only the first fragment.
    return sanitizeMultiPolygon(candidates.flat());
  }
};

const resolveEffectiveSubtractor = (sourceCoordinates, subtractorCoordinates) => {
  const source = sanitizeMultiPolygon(sourceCoordinates);
  const subtractor = sanitizeMultiPolygon(subtractorCoordinates);
  if (!source.length || !subtractor.length) return [];
  try {
    const clipped = sanitizeMultiPolygon(polygonClipping.intersection(source, subtractor));
    if (clipped.length > 0) return clipped;
  } catch (error) {
    // Ignore topology failures and keep original subtractor.
  }
  return subtractor;
};

const subtractCoordinates = (sourceCoordinates, subtractorCoordinates) => {
  const source = sanitizeMultiPolygon(sourceCoordinates);
  const subtractor = resolveEffectiveSubtractor(source, subtractorCoordinates);
  if (!source.length || !subtractor.length) return source;
  try {
    const difference = polygonClipping.difference(source, subtractor);
    return sanitizeMultiPolygon(difference);
  } catch (error) {
    // Fallback for dirty topology: attempt subtractor polygon-by-polygon.
    // This avoids returning full source geometry when one complex difference call fails.
    let remaining = source;
    let changed = false;
    for (const polygon of subtractor) {
      if (!remaining.length) break;
      const single = sanitizeMultiPolygon([polygon]);
      if (!single.length) continue;
      try {
        const next = sanitizeMultiPolygon(polygonClipping.difference(remaining, single));
        const areaBefore = getCoordinatesArea(remaining);
        const areaAfter = getCoordinatesArea(next);
        if (areaAfter + EPSILON < areaBefore) {
          remaining = next;
          changed = true;
          continue;
        }
        // Keep empty result when there is measurable overlap.
        if (!next.length && intersectsByArea(remaining, single)) {
          remaining = next;
          changed = true;
        }
      } catch (singleError) {
        // Ignore one bad subtractor polygon and continue best-effort subtraction.
      }
    }
    return changed ? remaining : source;
  }
};

const intersectsRecordExtent = (leftExtent, rightExtent) => {
  if (!leftExtent || !rightExtent) return false;
  if (isEmptyExtent(leftExtent) || isEmptyExtent(rightExtent)) return false;
  return intersectsExtent(leftExtent, rightExtent);
};

const areAreasNearlyEqual = (leftArea, rightArea) => {
  const left = Math.abs(Number(leftArea) || 0);
  const right = Math.abs(Number(rightArea) || 0);
  const scale = Math.max(left, right, 1);
  const delta = Math.abs(left - right);
  return delta <= Math.max(AREA_RESOLUTION_EPSILON, scale * 1e-6);
};

const getIntersectionArea = (leftCoordinates, rightCoordinates) => {
  const left = sanitizeMultiPolygon(leftCoordinates);
  const right = sanitizeMultiPolygon(rightCoordinates);
  if (!left.length || !right.length) return 0;
  try {
    const intersection = polygonClipping.intersection(left, right);
    return getCoordinatesArea(intersection);
  } catch (error) {
    return 0;
  }
};

const buildPairKey = (leftKey, rightKey) => {
  const left = String(leftKey || "");
  const right = String(rightKey || "");
  return left < right ? `${left}::${right}` : `${right}::${left}`;
};

const getAreaCoverage = (intersectionArea, rawArea) => {
  const base = Math.abs(Number(rawArea) || 0);
  if (!(intersectionArea > EPSILON) || !(base > EPSILON)) return 0;
  return intersectionArea / base;
};

const resolvePairWinner = (leftRecord, rightRecord) => {
  if (!leftRecord || !rightRecord) return null;
  if (!intersectsRecordExtent(leftRecord.extent, rightRecord.extent)) return null;
  const intersectionArea = getIntersectionArea(leftRecord.rawCoordinates, rightRecord.rawCoordinates);
  if (!(intersectionArea > EPSILON)) return null;

  const leftInsideRight =
    intersectionArea > AREA_RESOLUTION_EPSILON &&
    areAreasNearlyEqual(intersectionArea, leftRecord.rawArea);
  const rightInsideLeft =
    intersectionArea > AREA_RESOLUTION_EPSILON &&
    areAreasNearlyEqual(intersectionArea, rightRecord.rawArea);
  const leftCoverage = getAreaCoverage(intersectionArea, leftRecord.rawArea);
  const rightCoverage = getAreaCoverage(intersectionArea, rightRecord.rawArea);
  const leftMostlyCovered = leftCoverage >= CONTAINMENT_COVERAGE_THRESHOLD;
  const rightMostlyCovered = rightCoverage >= CONTAINMENT_COVERAGE_THRESHOLD;

  // Contained part always keeps the overlap footprint.
  if ((leftInsideRight || leftMostlyCovered) && !(rightInsideLeft || rightMostlyCovered)) {
    return leftRecord.key;
  }
  if ((rightInsideLeft || rightMostlyCovered) && !(leftInsideRight || leftMostlyCovered)) {
    return rightRecord.key;
  }

  // Fallback: keep overlap on the smaller geometry (more specific footprint).
  const areaDelta = Math.abs(leftRecord.rawArea) - Math.abs(rightRecord.rawArea);
  if (Math.abs(areaDelta) > AREA_RESOLUTION_EPSILON) {
    return areaDelta <= 0 ? leftRecord.key : rightRecord.key;
  }

  // Final tie-breaker keeps deterministic result across runs.
  return compareNatural(leftRecord.partId, rightRecord.partId) <= 0
    ? leftRecord.key
    : rightRecord.key;
};

const hasOverlapPriority = ({
  candidate,
  current,
  recordsByKey,
  pairWinnerByKey,
}) => {
  if (!candidate || !current) return false;
  if (candidate.key === current.key) return false;

  const candidateRecord = recordsByKey.get(candidate.key);
  const currentRecord = recordsByKey.get(current.key);
  if (!candidateRecord || !currentRecord) return false;

  const pairKey = buildPairKey(candidateRecord.key, currentRecord.key);
  let winnerKey = pairWinnerByKey.get(pairKey);
  if (winnerKey === undefined) {
    winnerKey = resolvePairWinner(candidateRecord, currentRecord);
    pairWinnerByKey.set(pairKey, winnerKey);
  }
  return winnerKey === candidateRecord.key;
};

const hasPolygonIntersectionArea = (leftCoordinates, rightCoordinates) => {
  return intersectsByArea(leftCoordinates, rightCoordinates);
};

export const buildResolvedPartGeometryStats = ({
  features = [],
  resolvePartId = () => "",
} = {}) => {
  const grouped = new Map();
  features.forEach((feature, index) => {
    const partId = String(resolvePartId(feature, index) || "").trim();
    if (!partId) return;
    const geometry = feature?.getGeometry?.();
    const coordinates = geometryToMultiPolygon(geometry);
    if (!coordinates.length) return;
    const key = normalizePartKey(partId);
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        partId,
        coordinatesList: [],
      });
    }
    grouped.get(key).coordinatesList.push(coordinates);
  });

  const partRecords = Array.from(grouped.values())
    .map((record) => {
      const rawCoordinates = unionCoordinates(record.coordinatesList);
      const rawGeometry = multiPolygonToGeometry(rawCoordinates);
      return {
        key: record.key,
        partId: record.partId,
        rawCoordinates,
        rawGeometry,
        rawArea: Math.abs(rawGeometry?.getArea?.() || 0),
        extent: rawGeometry?.getExtent?.(),
      };
    })
    .filter((record) => record.rawCoordinates.length > 0)
    .sort((left, right) => compareNatural(left.partId, right.partId));

  const partRecordByKey = new Map(partRecords.map((record) => [record.key, record]));
  const pairWinnerByKey = new Map();

  const statsByKey = new Map();
  partRecords.forEach((record) => {
    let resolvedCoordinates = record.rawCoordinates;
    for (const candidate of partRecords) {
      if (!resolvedCoordinates.length) break;
      if (candidate.key === record.key) continue;
      if (!intersectsRecordExtent(record.extent, candidate.extent)) continue;
      if (
        !hasOverlapPriority({
          candidate,
          current: record,
          recordsByKey: partRecordByKey,
          pairWinnerByKey,
        })
      ) {
        continue;
      }
      resolvedCoordinates = subtractCoordinates(resolvedCoordinates, candidate.rawCoordinates);
    }

    const resolvedGeometry = multiPolygonToGeometry(resolvedCoordinates);
    const resolvedArea = Math.abs(resolvedGeometry?.getArea?.() || 0);
    const overlapArea = Math.max(0, record.rawArea - resolvedArea);
    statsByKey.set(record.key, {
      key: record.key,
      partId: record.partId,
      rawGeometry: record.rawGeometry,
      rawArea: record.rawArea,
      geometry: resolvedGeometry,
      area: resolvedArea,
      overlapArea,
      wasAdjusted: overlapArea > AREA_RESOLUTION_EPSILON,
    });
  });

  return statsByKey;
};

export const getResolvedPartGeometryStat = (statsByKey, partId) => {
  if (!(statsByKey instanceof Map)) return null;
  const key = normalizePartKey(partId);
  if (!key) return null;
  return statsByKey.get(key) || null;
};

export const geometriesOverlapByArea = (leftGeometry, rightGeometry) => {
  return getGeometriesIntersectionArea(leftGeometry, rightGeometry) > EPSILON;
};

export const getGeometriesIntersectionArea = (leftGeometry, rightGeometry) => {
  if (!leftGeometry || !rightGeometry) return 0;
  const leftExtent = leftGeometry.getExtent?.();
  const rightExtent = rightGeometry.getExtent?.();
  if (!intersectsRecordExtent(leftExtent, rightExtent)) return 0;
  const leftCoordinates = geometryToMultiPolygon(leftGeometry);
  const rightCoordinates = geometryToMultiPolygon(rightGeometry);
  if (!leftCoordinates.length || !rightCoordinates.length) return 0;
  return getIntersectionArea(leftCoordinates, rightCoordinates);
};
