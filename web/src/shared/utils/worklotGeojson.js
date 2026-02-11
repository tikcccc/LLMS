const WORK_LOT_GEOJSON_SCHEMA = "llms.worklots.geojson.v1";
const WORK_LOT_GEOJSON_CRS = "EPSG:2326";
const DEFAULT_FILENAME = "work-lots.geojson";

const SUPPORTED_GEOMETRY_TYPES = new Set(["Polygon", "MultiPolygon"]);

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeIdList = (value) => {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  return Array.from(
    new Set(
      values
        .map((item) => normalizeText(item))
        .filter(Boolean)
    )
  );
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = normalizeText(value).toLowerCase();
  if (!text) return false;
  return ["true", "1", "yes", "y", "required"].includes(text);
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const ensureGeojsonFilename = (filename = DEFAULT_FILENAME) => {
  const normalized = normalizeText(filename) || DEFAULT_FILENAME;
  if (/\.(geojson|json)$/i.test(normalized)) return normalized;
  return `${normalized}.geojson`;
};

const cloneValue = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

const isPolygonGeometry = (geometry) =>
  !!geometry &&
  typeof geometry === "object" &&
  SUPPORTED_GEOMETRY_TYPES.has(geometry.type) &&
  Array.isArray(geometry.coordinates);

const buildFeatureProperties = (lot = {}) => ({
  id: normalizeText(lot.id),
  operatorName: normalizeText(lot.operatorName),
  category: normalizeText(lot.category),
  status: normalizeText(lot.status),
  relatedSiteBoundaryIds: normalizeIdList(lot.relatedSiteBoundaryIds),
  responsiblePerson: normalizeText(lot.responsiblePerson),
  assessDate: normalizeText(lot.assessDate),
  dueDate: normalizeText(lot.dueDate),
  completionDate: normalizeText(lot.completionDate),
  floatMonths: lot.floatMonths ?? null,
  forceEviction: !!lot.forceEviction,
  description: normalizeText(lot.description),
  remark: normalizeText(lot.remark),
  updatedBy: normalizeText(lot.updatedBy),
  updatedAt: normalizeText(lot.updatedAt),
  area: normalizeNumber(lot.area),
});

const toWorkLotFeature = (lot = {}) => {
  if (!isPolygonGeometry(lot.geometry)) return null;
  const id = normalizeText(lot.id);
  const feature = {
    type: "Feature",
    properties: buildFeatureProperties(lot),
    geometry: cloneValue(lot.geometry),
  };
  if (id) feature.id = id;
  return feature;
};

const featureToWorkLot = (feature = {}, index = 0) => {
  if (!feature || feature.type !== "Feature") {
    throw new Error(`Feature #${index + 1} is not a GeoJSON Feature.`);
  }
  if (!isPolygonGeometry(feature.geometry)) {
    throw new Error(
      `Feature #${index + 1} geometry must be Polygon or MultiPolygon.`
    );
  }
  const properties =
    feature.properties && typeof feature.properties === "object"
      ? feature.properties
      : {};

  return {
    id: normalizeText(properties.id ?? feature.id),
    operatorName: normalizeText(properties.operatorName ?? properties.name),
    category: normalizeText(properties.category ?? properties.type),
    status: normalizeText(properties.status),
    relatedSiteBoundaryIds: normalizeIdList(
      properties.relatedSiteBoundaryIds ??
        properties.related_site_boundary_ids ??
        properties.siteBoundaryIds ??
        properties.site_boundary_ids ??
        properties.landIds ??
        properties.land_ids ??
        properties.siteBoundaryId ??
        properties.site_boundary_id ??
        properties.landId
    ),
    responsiblePerson: normalizeText(
      properties.responsiblePerson ?? properties.assignee ?? properties.updatedBy
    ),
    assessDate: normalizeText(properties.assessDate ?? properties.assessmentDate),
    dueDate: normalizeText(properties.dueDate),
    completionDate: normalizeText(properties.completionDate),
    floatMonths: normalizeNumber(properties.floatMonths ?? properties.float),
    forceEviction: normalizeBoolean(
      properties.forceEviction ??
      properties.forceEvictionFlag ??
      false
    ),
    description: normalizeText(properties.description),
    remark: normalizeText(properties.remark),
    updatedBy: normalizeText(properties.updatedBy),
    updatedAt: normalizeText(properties.updatedAt),
    area: normalizeNumber(properties.area),
    geometry: cloneValue(feature.geometry),
  };
};

export const buildWorkLotGeojson = (workLots = []) => {
  const features = (Array.isArray(workLots) ? workLots : [])
    .map(toWorkLotFeature)
    .filter(Boolean);
  return {
    type: "FeatureCollection",
    metadata: {
      schema: WORK_LOT_GEOJSON_SCHEMA,
      crs: WORK_LOT_GEOJSON_CRS,
      exportedAt: new Date().toISOString(),
      count: features.length,
    },
    features,
  };
};

export const parseWorkLotGeojson = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid JSON payload.");
  }
  if (payload.type === "FeatureCollection" && Array.isArray(payload.features)) {
    return payload.features.map((feature, index) => featureToWorkLot(feature, index));
  }
  throw new Error("Unsupported format. Expected a GeoJSON FeatureCollection.");
};

export const downloadWorkLotGeojson = (
  workLots = [],
  filename = DEFAULT_FILENAME
) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("GeoJSON download is only available in browser context.");
  }
  const content = buildWorkLotGeojson(workLots);
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/geo+json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = ensureGeojsonFilename(filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return content;
};
