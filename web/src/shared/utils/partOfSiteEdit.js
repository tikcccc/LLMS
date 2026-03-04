const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeDateText = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};

const normalizeArea = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

export const createPartOfSiteEditForm = (part = {}) => ({
  id: normalizeText(part.id),
  partId: normalizeText(part.partId),
  accessDate: normalizeDateText(part.accessDate),
  area: normalizeArea(part.area),
});

export const buildPartOfSiteUpdatePayload = (
  form = {},
  {
    updatedAt = "",
    updatedBy = "",
  } = {}
) => ({
  accessDate: normalizeDateText(form.accessDate),
  area: normalizeArea(form.area),
  updatedAt: normalizeText(updatedAt),
  updatedBy: normalizeText(updatedBy),
});
