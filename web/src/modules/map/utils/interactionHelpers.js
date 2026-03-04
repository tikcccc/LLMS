export const isScopeTool = (tool) => tool === "DRAW" || tool === "DRAW_CIRCLE";
export const isMeasureTool = (tool) => tool === "MEASURE";
export const isPolygonTool = (tool) => tool === "POLYGON" || tool === "POLYGON_CIRCLE";
export const isEditOnlyTool = (tool) =>
  tool === "POLYGON" || tool === "POLYGON_CIRCLE" || tool === "MODIFY" || tool === "DELETE";

export const defaultScopeTool = () => "DRAW_CIRCLE";
export const defaultEditTool = () => "POLYGON";

export const normalizeValue = (value) => String(value || "").trim();

export const normalizePartId = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return "";
  if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
  return normalized;
};

export const normalizeSectionId = (value) => {
  const normalized = normalizeValue(value);
  if (!normalized) return "";
  if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
  return normalized;
};

export const getPartOfSitesIdFromFeature = (feature) =>
  normalizePartId(feature?.get?.("partOfSitesLotId")) ||
  normalizePartId(feature?.get?.("partId")) ||
  normalizePartId(feature?.get?.("part_id")) ||
  normalizePartId(feature?.get?.("refId")) ||
  normalizePartId(feature?.getId?.()) ||
  "";

export const getSectionIdFromFeature = (feature) =>
  normalizeSectionId(feature?.get?.("sectionLotId")) ||
  normalizeSectionId(feature?.get?.("sectionId")) ||
  normalizeSectionId(feature?.get?.("section_id")) ||
  normalizeSectionId(feature?.get?.("refId")) ||
  normalizeSectionId(feature?.getId?.()) ||
  "";

export const getFeatureBySystemId = (source, systemId) => {
  const normalized = normalizeValue(systemId).toLowerCase();
  if (!normalized || !source || typeof source.getFeatures !== "function") return null;
  return (
    source
      .getFeatures()
      .find((feature) => normalizeValue(feature.getId?.()).toLowerCase() === normalized) || null
  );
};

export const buildManualPartOfSitesId = (partOfSitesSource) => {
  const usedIds = new Set(
    (partOfSitesSource?.getFeatures?.() || [])
      .map((feature) => getPartOfSitesIdFromFeature(feature).toLowerCase())
      .filter(Boolean)
  );
  let sequence = 1;
  let candidate = "";
  do {
    candidate = `DRAW-${String(sequence).padStart(3, "0")}`;
    sequence += 1;
  } while (usedIds.has(candidate.toLowerCase()));
  return candidate;
};

export const buildManualPartOfSitesSystemId = (partOfSitesSource, partId) => {
  const token = normalizePartId(partId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "UNK";
  const usedSystemIds = new Set(
    (partOfSitesSource?.getFeatures?.() || [])
      .map((feature) =>
        normalizeValue(feature.get("partOfSitesSystemId") || feature.getId()).toUpperCase()
      )
      .filter(Boolean)
  );
  let sequence = 1;
  let candidate = "";
  do {
    candidate = `POS-MANUAL-${token}-${String(sequence).padStart(3, "0")}`;
    sequence += 1;
  } while (usedSystemIds.has(candidate));
  return candidate;
};

export const buildManualSectionId = (sectionsSource) => {
  const usedIds = new Set(
    (sectionsSource?.getFeatures?.() || [])
      .map((feature) => getSectionIdFromFeature(feature).toLowerCase())
      .filter(Boolean)
  );
  let sequence = 1;
  let candidate = "";
  do {
    candidate = `SEC-${String(sequence).padStart(3, "0")}`;
    sequence += 1;
  } while (usedIds.has(candidate.toLowerCase()));
  return candidate;
};

export const buildManualSectionSystemId = (sectionsSource, sectionId) => {
  const token = normalizeSectionId(sectionId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "UNK";
  const usedSystemIds = new Set(
    (sectionsSource?.getFeatures?.() || [])
      .map((feature) =>
        normalizeValue(feature.get("sectionSystemId") || feature.getId()).toUpperCase()
      )
      .filter(Boolean)
  );
  let sequence = 1;
  let candidate = "";
  do {
    candidate = `SOW-MANUAL-${token}-${String(sequence).padStart(3, "0")}`;
    sequence += 1;
  } while (usedSystemIds.has(candidate));
  return candidate;
};
