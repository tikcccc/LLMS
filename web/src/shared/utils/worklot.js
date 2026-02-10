import { todayHongKong } from "./time";

export const WORK_LOT_CATEGORY = {
  BU: "BU_BUSINESS_UNDERTAKING",
  HH: "HH_HOUSEHOLD",
  GL: "GL_GOVERNMENT_LAND",
  // Legacy alias for backward compatibility.
  DOMESTIC: "HH_HOUSEHOLD",
};

export const WORK_LOT_CATEGORIES = [
  { value: WORK_LOT_CATEGORY.BU, label: "Business Undertaking (BU)" },
  { value: WORK_LOT_CATEGORY.HH, label: "Household (HH)" },
  { value: WORK_LOT_CATEGORY.GL, label: "Government Land (GL)" },
];

export const WORK_LOT_STATUS = {
  WAITING_ASSESSMENT: "Waiting for Assessment",
  EGA_APPROVED: "EGA Approved",
  WAITING_CLEARANCE: "Waiting for Clearance",
  CLEARED_COMPLETED: "Cleared / Completed",
};

export const WORK_LOT_STATUSES = [
  WORK_LOT_STATUS.WAITING_ASSESSMENT,
  WORK_LOT_STATUS.EGA_APPROVED,
  WORK_LOT_STATUS.WAITING_CLEARANCE,
  WORK_LOT_STATUS.CLEARED_COMPLETED,
];

const CATEGORY_ALIASES = {
  [WORK_LOT_CATEGORY.BU]: WORK_LOT_CATEGORY.BU,
  BU: WORK_LOT_CATEGORY.BU,
  BUSINESS: WORK_LOT_CATEGORY.BU,
  BUSINESS_UNDERTAKING: WORK_LOT_CATEGORY.BU,
  HH: WORK_LOT_CATEGORY.HH,
  HOUSEHOLD: WORK_LOT_CATEGORY.HH,
  [WORK_LOT_CATEGORY.HH]: WORK_LOT_CATEGORY.HH,
  DOMESTIC: WORK_LOT_CATEGORY.HH,
  [WORK_LOT_CATEGORY.DOMESTIC]: WORK_LOT_CATEGORY.HH,
  GL: WORK_LOT_CATEGORY.GL,
  GOVERNMENT: WORK_LOT_CATEGORY.GL,
  GOVERNMENT_LAND: WORK_LOT_CATEGORY.GL,
  GOV_LAND: WORK_LOT_CATEGORY.GL,
  [WORK_LOT_CATEGORY.GL]: WORK_LOT_CATEGORY.GL,
};

const STATUS_ALIASES = {
  WAITING_FOR_ASSESSMENT: WORK_LOT_STATUS.WAITING_ASSESSMENT,
  WAITING_ASSESSMENT: WORK_LOT_STATUS.WAITING_ASSESSMENT,
  [WORK_LOT_STATUS.WAITING_ASSESSMENT]: WORK_LOT_STATUS.WAITING_ASSESSMENT,
  "INITIAL_STUDY": WORK_LOT_STATUS.WAITING_ASSESSMENT,
  "INITIAL": WORK_LOT_STATUS.WAITING_ASSESSMENT,
  "ASSESSMENT": WORK_LOT_STATUS.WAITING_ASSESSMENT,
  EGA_APPROVED: WORK_LOT_STATUS.EGA_APPROVED,
  [WORK_LOT_STATUS.EGA_APPROVED]: WORK_LOT_STATUS.EGA_APPROVED,
  "EGA": WORK_LOT_STATUS.EGA_APPROVED,
  "APPROVED": WORK_LOT_STATUS.EGA_APPROVED,
  WAITING_FOR_CLEARANCE: WORK_LOT_STATUS.WAITING_CLEARANCE,
  WAITING_CLEARANCE: WORK_LOT_STATUS.WAITING_CLEARANCE,
  [WORK_LOT_STATUS.WAITING_CLEARANCE]: WORK_LOT_STATUS.WAITING_CLEARANCE,
  "WAITING": WORK_LOT_STATUS.WAITING_CLEARANCE,
  "IN-PROGRESS": WORK_LOT_STATUS.WAITING_CLEARANCE,
  "IN_PROGRESS": WORK_LOT_STATUS.WAITING_CLEARANCE,
  "PENDING": WORK_LOT_STATUS.WAITING_CLEARANCE,
  CLEARED_COMPLETED: WORK_LOT_STATUS.CLEARED_COMPLETED,
  [WORK_LOT_STATUS.CLEARED_COMPLETED]: WORK_LOT_STATUS.CLEARED_COMPLETED,
  "CLEARED": WORK_LOT_STATUS.CLEARED_COMPLETED,
  "COMPLETED": WORK_LOT_STATUS.CLEARED_COMPLETED,
  "HANDOVER": WORK_LOT_STATUS.CLEARED_COMPLETED,
  "DONE": WORK_LOT_STATUS.CLEARED_COMPLETED,
};

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

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  const text = normalizeText(value).toLowerCase();
  if (!text) return false;
  return ["true", "1", "yes", "y", "required"].includes(text);
};

const normalizeDateText = (value) => {
  const text = normalizeText(value);
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return "";
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

const normalizeKey = (value) =>
  normalizeText(value)
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();

export const normalizeWorkLotCategory = (value) => {
  const key = normalizeKey(value);
  if (!key) return WORK_LOT_CATEGORY.BU;
  return CATEGORY_ALIASES[key] || WORK_LOT_CATEGORY.BU;
};

export const normalizeWorkLotStatus = (value) => {
  const key = normalizeKey(value);
  if (!key) return WORK_LOT_STATUS.WAITING_ASSESSMENT;
  return STATUS_ALIASES[key] || WORK_LOT_STATUS.WAITING_ASSESSMENT;
};

export const workLotCategoryLabel = (category) => {
  const normalized = normalizeWorkLotCategory(category);
  return (
    WORK_LOT_CATEGORIES.find((item) => item.value === normalized)?.label ||
    normalized
  );
};

export const workLotCategoryCode = (category) =>
  ({
    [WORK_LOT_CATEGORY.BU]: "BU",
    [WORK_LOT_CATEGORY.HH]: "HH",
    [WORK_LOT_CATEGORY.GL]: "GL",
  }[normalizeWorkLotCategory(category)] || "BU");

export const normalizeWorkLot = (lot = {}) => {
  const normalizedCategory = normalizeWorkLotCategory(
    lot.category ?? lot.type
  );
  const normalizedStatus = normalizeWorkLotStatus(lot.status);
  const relatedSiteBoundaryIds = normalizeIdList(
    lot.relatedSiteBoundaryIds ??
      lot.related_site_boundary_ids ??
      lot.siteBoundaryIds ??
      lot.site_boundary_ids ??
      lot.landIds ??
      lot.land_ids ??
      lot.siteBoundaryId ??
      lot.site_boundary_id ??
      lot.landId
  );
  const siteBoundaryId = normalizeText(
    lot.siteBoundaryId ??
      lot.site_boundary_id ??
      lot.landId ??
      relatedSiteBoundaryIds[0] ??
      ""
  );
  const area = normalizeNumber(lot.area);
  const computedArea = geometryAreaSqm(lot.geometry);
  const normalizedArea =
    Number.isFinite(computedArea) && computedArea > 0
      ? computedArea
      : area !== null
        ? area
        : 0;
  return {
    ...lot,
    category: normalizedCategory,
    siteBoundaryId,
    relatedSiteBoundaryIds,
    responsiblePerson: normalizeText(
      lot.responsiblePerson ?? lot.assignee ?? lot.updatedBy
    ),
    assessDate: normalizeDateText(lot.assessDate ?? lot.assessmentDate),
    dueDate: normalizeText(lot.dueDate) || todayHongKong(),
    completionDate: normalizeDateText(lot.completionDate),
    forceEviction: normalizeBoolean(lot.forceEviction ?? lot.forceEvictionFlag),
    floatMonths: normalizeNumber(lot.floatMonths ?? lot.float),
    others: normalizeText(lot.others),
    status: normalizedStatus,
    description: normalizeText(lot.description),
    remark: normalizeText(lot.remark),
    area: normalizedArea,
  };
};
