const RANDOM_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const LAND_ID_PREFIX = "site_boundary";
export const WORK_LOT_ID_PREFIX = "work_lot";

const LAND_ID_SUFFIX_LENGTH = 5;
const WORK_LOT_ID_SUFFIX_LENGTH = 4;

const LAND_ID_PATTERN = new RegExp(
  `^${LAND_ID_PREFIX}_[A-Z0-9]{${LAND_ID_SUFFIX_LENGTH}}$`,
  "i"
);
const WORK_LOT_ID_PATTERN = new RegExp(
  `^${WORK_LOT_ID_PREFIX}_(BU|HH|GL)_[A-Z0-9]{${WORK_LOT_ID_SUFFIX_LENGTH}}$`,
  "i"
);

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

const randomToken = (length) =>
  Array.from({ length }, () =>
    RANDOM_ALPHABET[Math.floor(Math.random() * RANDOM_ALPHABET.length)]
  ).join("");

const normalizeWorkLotCategoryCode = (value) => {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return "BU";
  if (normalized === "HH" || normalized.includes("HOUSEHOLD") || normalized.includes("DOMESTIC")) {
    return "HH";
  }
  if (normalized === "GL" || normalized.includes("GOVERNMENT") || normalized.includes("GOV_LAND")) {
    return "GL";
  }
  return "BU";
};

const buildUniqueId = (prefix, suffixLength, existingIds) => {
  const existing = collectExistingIdSet(existingIds);
  for (let i = 0; i < 2048; i += 1) {
    const candidate = `${prefix}_${randomToken(suffixLength)}`;
    if (!existing.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
  // Extremely unlikely fallback if random space is exhausted.
  const fallbackSeed = `${Date.now().toString(36).toUpperCase()}${randomToken(suffixLength)}`;
  return `${prefix}_${fallbackSeed.slice(-suffixLength)}`;
};

export const isLandId = (value) => LAND_ID_PATTERN.test(normalizeText(value));

export const isWorkLotId = (value) => WORK_LOT_ID_PATTERN.test(normalizeText(value));

export const generateLandId = (existingIds = []) =>
  buildUniqueId(LAND_ID_PREFIX, LAND_ID_SUFFIX_LENGTH, existingIds);

export const generateWorkLotId = (category, existingIds = []) => {
  const categoryCode = normalizeWorkLotCategoryCode(category);
  const existing = collectExistingIdSet(existingIds);
  for (let i = 0; i < 2048; i += 1) {
    const candidate = `${WORK_LOT_ID_PREFIX}_${categoryCode}_${randomToken(
      WORK_LOT_ID_SUFFIX_LENGTH
    )}`;
    if (!existing.has(candidate.toLowerCase())) {
      return candidate;
    }
  }
  const fallbackSeed = `${Date.now().toString(36).toUpperCase()}${randomToken(
    WORK_LOT_ID_SUFFIX_LENGTH
  )}`;
  return `${WORK_LOT_ID_PREFIX}_${categoryCode}_${fallbackSeed.slice(
    -WORK_LOT_ID_SUFFIX_LENGTH
  )}`;
};

// Backward-compatible generic ID helper (for non Work Lot / Land IDs).
export function generateId(prefix) {
  const normalizedPrefix = normalizeText(prefix) || "id";
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const stamp = Date.now().toString(36).toUpperCase();
  return `${normalizedPrefix}-${stamp}${rand}`;
}
