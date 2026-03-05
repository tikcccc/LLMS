const normalizeText = (value) => String(value || "").trim();

export const resolvePartGroupLabel = (partId, fallback = "") => {
  const normalizedPartId = normalizeText(partId).toUpperCase();
  const matchedPrefix = normalizedPartId.match(/^(\d+)/);
  if (matchedPrefix?.[1]) {
    return `PART ${matchedPrefix[1]}`;
  }
  return normalizeText(fallback);
};
