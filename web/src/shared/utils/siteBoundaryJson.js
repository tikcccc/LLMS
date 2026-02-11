import { normalizeSiteBoundary } from "./siteBoundary";

const SITE_BOUNDARY_JSON_SCHEMA = "llms.site-boundaries.json.v1";
const DEFAULT_FILENAME = "site-boundaries.json";

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const ensureJsonFilename = (filename = DEFAULT_FILENAME) => {
  const normalized = normalizeText(filename) || DEFAULT_FILENAME;
  if (/\.json$/i.test(normalized)) return normalized;
  return `${normalized}.json`;
};

const cloneValue = (value) => {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
};

const toExportBoundary = (boundary = {}) => ({
  id: normalizeText(boundary.id),
  sourceRef: normalizeText(boundary.sourceRef),
  name: normalizeText(boundary.name),
  layer: normalizeText(boundary.layer),
  entity: normalizeText(boundary.entity),
  area: Number.isFinite(Number(boundary.area)) ? Number(boundary.area) : 0,
  contractNo: normalizeText(boundary.contractNo),
  futureUse: normalizeText(boundary.futureUse),
  assessDate: normalizeText(boundary.assessDate),
  plannedHandoverDate: normalizeText(boundary.plannedHandoverDate),
  completionDate: normalizeText(boundary.completionDate),
  others: normalizeText(boundary.others),
});

export const buildSiteBoundaryJson = (siteBoundaries = []) => {
  const records = (Array.isArray(siteBoundaries) ? siteBoundaries : []).map(
    toExportBoundary
  );
  return {
    schema: SITE_BOUNDARY_JSON_SCHEMA,
    exportedAt: new Date().toISOString(),
    count: records.length,
    siteBoundaries: records,
  };
};

export const parseSiteBoundaryJson = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid JSON payload.");
  }

  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.siteBoundaries)
      ? payload.siteBoundaries
      : null;
  if (!rawList) {
    throw new Error("Unsupported format. Expected array or { siteBoundaries: [] }.");
  }

  const existingIds = new Set();
  return rawList.map((item, index) =>
    normalizeSiteBoundary(
      {
        ...cloneValue(item),
      },
      index,
      { existingIds }
    )
  );
};

export const downloadSiteBoundaryJson = (
  siteBoundaries = [],
  filename = DEFAULT_FILENAME
) => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("JSON download is only available in browser context.");
  }
  const content = buildSiteBoundaryJson(siteBoundaries);
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = ensureJsonFilename(filename);
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return content;
};
