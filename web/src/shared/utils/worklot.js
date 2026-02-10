import { todayHongKong } from "./time";

export const WORK_LOT_CATEGORY = {
  BU: "BU_BUSINESS_UNDERTAKING",
  DOMESTIC: "DOMESTIC",
};

export const WORK_LOT_CATEGORIES = [
  { value: WORK_LOT_CATEGORY.BU, label: "BU Business Undertaking" },
  { value: WORK_LOT_CATEGORY.DOMESTIC, label: "Domestic" },
];

export const WORK_LOT_STATUS = {
  EGA_APPROVED: "EGA approved",
  WAITING_CLEARANCE: "waiting for clearance",
};

export const WORK_LOT_STATUSES = [
  WORK_LOT_STATUS.EGA_APPROVED,
  WORK_LOT_STATUS.WAITING_CLEARANCE,
];

const CATEGORY_ALIASES = {
  [WORK_LOT_CATEGORY.BU]: WORK_LOT_CATEGORY.BU,
  BU: WORK_LOT_CATEGORY.BU,
  BUSINESS: WORK_LOT_CATEGORY.BU,
  BUSINESS_UNDERTAKING: WORK_LOT_CATEGORY.BU,
  [WORK_LOT_CATEGORY.DOMESTIC]: WORK_LOT_CATEGORY.DOMESTIC,
  DOMESTIC: WORK_LOT_CATEGORY.DOMESTIC,
  HOUSEHOLD: WORK_LOT_CATEGORY.DOMESTIC,
};

const STATUS_ALIASES = {
  [WORK_LOT_STATUS.EGA_APPROVED.toUpperCase()]: WORK_LOT_STATUS.EGA_APPROVED,
  "HANDOVER": WORK_LOT_STATUS.EGA_APPROVED,
  "DONE": WORK_LOT_STATUS.EGA_APPROVED,
  "APPROVED": WORK_LOT_STATUS.EGA_APPROVED,
  [WORK_LOT_STATUS.WAITING_CLEARANCE.toUpperCase()]: WORK_LOT_STATUS.WAITING_CLEARANCE,
  "WAITING": WORK_LOT_STATUS.WAITING_CLEARANCE,
  "WAITING_FOR_CLEARANCE": WORK_LOT_STATUS.WAITING_CLEARANCE,
  "IN-PROGRESS": WORK_LOT_STATUS.WAITING_CLEARANCE,
  "IN_PROGRESS": WORK_LOT_STATUS.WAITING_CLEARANCE,
  "PENDING": WORK_LOT_STATUS.WAITING_CLEARANCE,
  "DIFFICULT": WORK_LOT_STATUS.WAITING_CLEARANCE,
  "OPEN": WORK_LOT_STATUS.WAITING_CLEARANCE,
};

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeKey = (value) =>
  normalizeText(value)
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_]/g, "_")
    .toUpperCase();

export const normalizeWorkLotCategory = (value) => {
  const key = normalizeKey(value);
  if (!key) return WORK_LOT_CATEGORY.BU;
  return CATEGORY_ALIASES[key] || WORK_LOT_CATEGORY.BU;
};

export const normalizeWorkLotStatus = (value) => {
  const key = normalizeKey(value);
  if (!key) return WORK_LOT_STATUS.WAITING_CLEARANCE;
  return STATUS_ALIASES[key] || WORK_LOT_STATUS.WAITING_CLEARANCE;
};

export const workLotCategoryLabel = (category) => {
  const normalized = normalizeWorkLotCategory(category);
  return (
    WORK_LOT_CATEGORIES.find((item) => item.value === normalized)?.label ||
    normalized
  );
};

export const normalizeWorkLot = (lot = {}) => {
  const normalizedCategory = normalizeWorkLotCategory(
    lot.category ?? lot.type
  );
  const normalizedStatus = normalizeWorkLotStatus(lot.status);
  return {
    ...lot,
    category: normalizedCategory,
    responsiblePerson: normalizeText(
      lot.responsiblePerson ?? lot.assignee ?? lot.updatedBy
    ),
    dueDate: normalizeText(lot.dueDate) || todayHongKong(),
    status: normalizedStatus,
    description: normalizeText(lot.description),
    remark: normalizeText(lot.remark),
  };
};
