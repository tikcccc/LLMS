import { todayHongKong } from "./time";
import { WORK_LOT_STATUS, workLotCategoryCode } from "./worklot";
import { generateLandId, isLandId, LAND_ID_PREFIX } from "./id";

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeDateText = (value) => {
  const text = normalizeText(value);
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeGeometry = (geometry) => {
  if (!geometry || typeof geometry !== "object") return null;
  const { type, coordinates } = geometry;
  if (!type || !Array.isArray(coordinates)) return null;
  if (type !== "Polygon" && type !== "MultiPolygon") return null;
  return {
    type,
    coordinates,
  };
};

const ringArea = (ring = []) => {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
};

const polygonArea = (geometry = {}) => {
  if (!geometry || !geometry.type || !Array.isArray(geometry.coordinates)) return 0;
  if (geometry.type === "Polygon") {
    return ringArea(geometry.coordinates[0] || []);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.reduce(
      (total, polygonCoords) => total + ringArea((polygonCoords || [])[0] || []),
      0
    );
  }
  return 0;
};

const geometryAreaSqm = (geometry = {}) => {
  if (!geometry || !geometry.type || !Array.isArray(geometry.coordinates)) return 0;
  if (geometry.type === "Polygon") {
    return ringArea(geometry.coordinates[0] || []);
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.reduce(
      (total, polygonCoords) => total + ringArea((polygonCoords || [])[0] || []),
      0
    );
  }
  return 0;
};

export const normalizeFeatureId = (value) => {
  const text = normalizeText(value);
  return text || null;
};

const collectExistingIdSet = (existingIds) => {
  const set = new Set();
  if (!existingIds || typeof existingIds[Symbol.iterator] !== "function") {
    return set;
  }
  for (const value of existingIds) {
    const normalized = normalizeText(value).toLowerCase();
    if (normalized) {
      set.add(normalized);
    }
  }
  return set;
};

const ensureMutableIdSet = (existingIds) =>
  existingIds instanceof Set ? existingIds : collectExistingIdSet(existingIds);

const reserveId = (candidate, existingIds) => {
  const used = ensureMutableIdSet(existingIds);
  const normalized = normalizeText(candidate).toLowerCase();
  if (normalized && !used.has(normalized)) {
    used.add(normalized);
    return candidate;
  }
  const generated = generateLandId(used);
  used.add(generated.toLowerCase());
  return generated;
};

const normalizeLandId = (value) => {
  const text = normalizeFeatureId(value);
  if (!text || !isLandId(text)) return "";
  const suffix = text.slice(text.lastIndexOf("_") + 1).toUpperCase();
  return `${LAND_ID_PREFIX}_${suffix}`;
};

export const buildSiteBoundarySourceRef = (boundary = {}, index = 0) => {
  const explicit = normalizeFeatureId(boundary.sourceRef ?? boundary.source_ref);
  if (explicit) return explicit;
  const handle = normalizeFeatureId(boundary.handle);
  if (handle) return `handle:${handle}`;
  const rawId = normalizeFeatureId(
    boundary.rawId ?? boundary.raw_id ?? boundary.featureId ?? boundary.feature_id ?? boundary.id
  );
  if (rawId) return `feature:${rawId}`;
  const layer = normalizeText(boundary.layer) || "layer";
  const entity = normalizeText(boundary.entity) || "entity";
  return `index:${index + 1}:${layer}:${entity}`;
};

export const normalizeSiteBoundary = (boundary = {}, index = 0, options = {}) => {
  const existingIds = options.existingIds || new Set();
  const preservedLandId = normalizeLandId(boundary.id ?? boundary.landId ?? boundary.land_id);
  const id = reserveId(preservedLandId, existingIds);
  const geometry = normalizeGeometry(boundary.geometry);
  const areaFromPayload = Number.isFinite(boundary.area) ? boundary.area : null;
  const area = areaFromPayload !== null ? areaFromPayload : geometryAreaSqm(geometry);
  const hectare = area > 0 ? area / 10000 : 0;
  return {
    id,
    sourceRef: buildSiteBoundarySourceRef(boundary, index),
    name: normalizeText(boundary.name),
    layer: normalizeText(boundary.layer) || "—",
    entity: normalizeText(boundary.entity) || "Polygon",
    area,
    hectare,
    contractNo: normalizeText(boundary.contractNo),
    futureUse: normalizeText(boundary.futureUse),
    assessDate: normalizeDateText(boundary.assessDate),
    plannedHandoverDate: normalizeDateText(
      boundary.plannedHandoverDate ?? boundary.handoverDate
    ),
    completionDate: normalizeDateText(boundary.completionDate),
    others: normalizeText(boundary.others ?? boundary.remark),
    geometry,
  };
};

export const parseSiteBoundaryGeojson = (geojson = {}) => {
  const features = Array.isArray(geojson.features) ? geojson.features : [];
  const existingIds = new Set();
  return features.map((feature, index) => {
    const properties = feature?.properties || {};
    const area = polygonArea(feature?.geometry);
    const rawId =
      normalizeFeatureId(feature?.id) ||
      normalizeFeatureId(properties.id) ||
      normalizeFeatureId(properties.handle) ||
      null;
    return normalizeSiteBoundary(
      {
        id: normalizeFeatureId(properties.landId ?? properties.land_id ?? feature?.id),
        rawId,
        sourceRef: buildSiteBoundarySourceRef(
          {
            sourceRef: properties.sourceRef ?? properties.source_ref,
            handle: properties.handle,
            rawId,
            layer: properties.layer,
            entity: properties.entity,
          },
          index
        ),
        handle: properties.handle,
        name: properties.name,
        layer: properties.layer,
        entity: properties.entity,
        area,
        contractNo: properties.contractNo ?? properties.contract_no,
        futureUse: properties.futureUse ?? properties.future_use,
        assessDate: properties.assessDate ?? properties.assess_date,
        plannedHandoverDate:
          properties.plannedHandoverDate ??
          properties.planned_handover_date ??
          properties.handoverDate ??
          properties.handover_date,
        completionDate: properties.completionDate ?? properties.completion_date,
        others: properties.others ?? properties.remark,
      },
      index,
      { existingIds }
    );
  });
};

export const buildWorkLotsByBoundary = (workLots = []) =>
  workLots.reduce((map, lot) => {
    const boundaryIds = Array.isArray(lot?.relatedSiteBoundaryIds)
      ? lot.relatedSiteBoundaryIds
      : [lot?.siteBoundaryId];
    boundaryIds
      .map((value) => normalizeText(value))
      .filter(Boolean)
      .forEach((boundaryId) => {
        if (!map.has(boundaryId)) {
          map.set(boundaryId, []);
        }
        map.get(boundaryId).push(lot);
      });
    return map;
  }, new Map());

export const summarizeSiteBoundary = (
  boundary,
  workLots = [],
  { floatThresholdMonths = 3, today = todayHongKong() } = {}
) => {
  const relatedLots = Array.isArray(workLots) ? workLots : [];
  const totalOperators = relatedLots.length;
  const completedOperators = relatedLots.filter(
    (lot) => lot.status === WORK_LOT_STATUS.CLEARED_COMPLETED
  ).length;
  const handoverReady = totalOperators > 0 && completedOperators === totalOperators;
  const handedOverDate = normalizeDateText(boundary?.completionDate);
  const handedOver = !!handedOverDate;
  const handoverCompleted = handoverReady || handedOver;
  const progressPercent =
    totalOperators > 0 ? Math.round((completedOperators / totalOperators) * 100) : 0;

  const requiresForceEviction = relatedLots.some((lot) => !!lot.forceEviction);
  const floatCandidates = relatedLots
    .map((lot) => normalizeNumber(lot.floatMonths))
    .filter((value) => value !== null);
  const minFloatMonths =
    floatCandidates.length > 0 ? Math.min(...floatCandidates) : null;
  const hasLowFloat =
    minFloatMonths !== null &&
    Number.isFinite(floatThresholdMonths) &&
    minFloatMonths < floatThresholdMonths;

  const plannedHandoverDate = normalizeDateText(boundary?.plannedHandoverDate);
  const overdue =
    !!plannedHandoverDate &&
    plannedHandoverDate < today &&
    !handedOver;

  const categoryCounts = relatedLots.reduce(
    (acc, lot) => {
      const code = workLotCategoryCode(lot.category);
      if (code === "BU") acc.BU += 1;
      if (code === "HH") acc.HH += 1;
      if (code === "GL") acc.GL += 1;
      return acc;
    },
    { BU: 0, HH: 0, GL: 0 }
  );

  const categoryAreasSqm = relatedLots.reduce(
    (acc, lot) => {
      const code = workLotCategoryCode(lot.category);
      const area = geometryAreaSqm(lot.geometry);
      if (code === "BU") acc.BU += area;
      if (code === "HH") acc.HH += area;
      if (code === "GL") acc.GL += area;
      return acc;
    },
    { BU: 0, HH: 0, GL: 0 }
  );

  const hasInProgress = relatedLots.some(
    (lot) => lot.status !== WORK_LOT_STATUS.WAITING_ASSESSMENT
  );

  let status = "Pending Clearance";
  let statusKey = "PENDING_CLEARANCE";
  if (handedOver || handoverReady) {
    status = "Handed Over";
    statusKey = "HANDED_OVER";
  } else if (requiresForceEviction || hasLowFloat) {
    status = "Critical / Risk";
    statusKey = "CRITICAL_RISK";
  } else if (hasInProgress) {
    status = "In Progress";
    statusKey = "IN_PROGRESS";
  }

  return {
    totalOperators,
    completedOperators,
    handoverReady,
    handedOver,
    handoverCompleted,
    progressPercent,
    overdue,
    requiresForceEviction,
    minFloatMonths,
    hasLowFloat,
    status,
    statusKey,
    categoryCounts,
    categoryAreasSqm,
    categoryAreasHectare: {
      BU: categoryAreasSqm.BU / 10000,
      HH: categoryAreasSqm.HH / 10000,
      GL: categoryAreasSqm.GL / 10000,
    },
  };
};
