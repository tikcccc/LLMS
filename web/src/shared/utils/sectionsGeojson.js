const SECTIONS_GEOJSON_SCHEMA = "llms.sections.geojson.v1";
const SECTIONS_GEOJSON_CRS = "EPSG:2326";
const DEFAULT_FILENAME = "sections.geojson";

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const ensureGeojsonFilename = (filename = DEFAULT_FILENAME) => {
  const normalized = normalizeText(filename) || DEFAULT_FILENAME;
  if (/\.(geojson|json)$/i.test(normalized)) return normalized;
  return `${normalized}.geojson`;
};

const cloneJson = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

const isGeojsonFeature = (feature) =>
  !!feature &&
  typeof feature === "object" &&
  feature.type === "Feature" &&
  !!feature.geometry &&
  typeof feature.geometry === "object";

const normalizeFeatures = (features = []) =>
  (Array.isArray(features) ? features : []).filter(isGeojsonFeature).map((feature) =>
    cloneJson(feature)
  );

const buildMetadata = (metadata = {}, count = 0) => {
  const normalized =
    metadata && typeof metadata === "object" ? cloneJson(metadata) : {};
  return {
    ...normalized,
    schema: SECTIONS_GEOJSON_SCHEMA,
    crs: SECTIONS_GEOJSON_CRS,
    count,
    exportedAt: normalizeText(normalized.exportedAt) || new Date().toISOString(),
  };
};

export const buildSectionsGeojson = (features = [], metadata = {}) => {
  const normalizedFeatures = normalizeFeatures(features);
  return {
    type: "FeatureCollection",
    metadata: buildMetadata(metadata, normalizedFeatures.length),
    features: normalizedFeatures,
  };
};

export const normalizeSectionsGeojson = (payload) => {
  if (
    !payload ||
    typeof payload !== "object" ||
    payload.type !== "FeatureCollection" ||
    !Array.isArray(payload.features)
  ) {
    return null;
  }
  return buildSectionsGeojson(payload.features, payload.metadata || {});
};

export const downloadSectionsGeojson = (
  featureCollection,
  filename = DEFAULT_FILENAME
) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("GeoJSON download is only available in browser context.");
  }
  const normalized = normalizeSectionsGeojson(featureCollection);
  if (!normalized) {
    throw new Error("Invalid Sections GeoJSON payload.");
  }
  const blob = new Blob([JSON.stringify(normalized, null, 2)], {
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
  return normalized;
};
