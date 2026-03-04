const toNormalizedId = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const toAlphaNumToken = (value, fallback) =>
  toNormalizedId(value)?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || fallback;

export const featureKey = (value) => String(value || "").trim().toLowerCase();

export const normalizeFeatureId = toNormalizedId;

export const normalizePartOfSitesId = (value) => {
  const normalized = toNormalizedId(value);
  if (!normalized) return null;
  if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
  return normalized;
};

export const normalizeSectionId = (value) => {
  const normalized = toNormalizedId(value);
  if (!normalized) return null;
  if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
  return normalized;
};

export const normalizeDateValue = (value) => {
  const normalized = toNormalizedId(value);
  if (!normalized) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

export const normalizePositiveNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

export const normalizeIdList = (value) => {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [value];
  const dedupe = new Set();
  list.forEach((item) => {
    if (item === null || item === undefined) return;
    const normalized = String(item).trim();
    if (!normalized) return;
    dedupe.add(normalized);
  });
  return Array.from(dedupe);
};

export const buildPartOfSitesSystemId = ({ groupLabel = "", partId = "", featureIndex = 0 } = {}) => {
  const groupToken = toAlphaNumToken(groupLabel, "PART");
  const partToken = toAlphaNumToken(normalizePartOfSitesId(partId), "UNK");
  const seq = String(Math.max(0, Number(featureIndex) || 0) + 1).padStart(3, "0");
  return `POS-${groupToken}-${partToken}-${seq}`;
};

export const buildSectionSystemId = ({ groupLabel = "", sectionId = "", featureIndex = 0 } = {}) => {
  const groupToken = toAlphaNumToken(groupLabel, "SEC");
  const sectionToken = toAlphaNumToken(normalizeSectionId(sectionId), "UNK");
  const seq = String(Math.max(0, Number(featureIndex) || 0) + 1).padStart(3, "0");
  return `SOW-${groupToken}-${sectionToken}-${seq}`;
};

export const isFeatureSelectedInFilter = (mode, selectedIds = [], id) => {
  if (mode !== "custom") return true;
  const normalized = toNormalizedId(id);
  if (!normalized) return false;
  const normalizedLower = normalized.toLowerCase();
  return selectedIds.some(
    (item) => String(item || "").trim().toLowerCase() === normalizedLower
  );
};

export const getPartOfSitesLotId = (feature, index = 0) =>
  normalizePartOfSitesId(feature?.get("partId")) ||
  normalizePartOfSitesId(feature?.get("part_id")) ||
  normalizePartOfSitesId(feature?.get("partOfSitesLotId")) ||
  toNormalizedId(feature?.get("refId")) ||
  toNormalizedId(feature?.getId?.()) ||
  toNormalizedId(feature?.get("id")) ||
  toNormalizedId(feature?.get("handle")) ||
  `part_of_site_${String(index + 1).padStart(5, "0")}`;

export const getSectionLotId = (feature, index = 0) =>
  normalizeSectionId(feature?.get("sectionId")) ||
  normalizeSectionId(feature?.get("section_id")) ||
  normalizeSectionId(feature?.get("sectionLotId")) ||
  normalizeSectionId(feature?.get("refId")) ||
  normalizeSectionId(feature?.getId?.()) ||
  normalizeSectionId(feature?.get("id")) ||
  normalizeSectionId(feature?.get("handle")) ||
  `section_${String(index + 1).padStart(5, "0")}`;

export const isPolygonalFeature = (feature) => {
  const geometryType = feature?.getGeometry?.()?.getType?.();
  return geometryType === "Polygon" || geometryType === "MultiPolygon";
};
