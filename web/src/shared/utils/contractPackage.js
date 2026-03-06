export const CONTRACT_PACKAGE = {
  C1: "C1",
  C2: "C2",
  C3: "C3",
};

export const CONTRACT_PACKAGE_VALUES = [
  CONTRACT_PACKAGE.C1,
  CONTRACT_PACKAGE.C2,
  CONTRACT_PACKAGE.C3,
];

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const hasStandaloneContractToken = (text, token) =>
  new RegExp(`(^|[^A-Z0-9])${token}([^A-Z0-9]|$)`).test(text);

const detectContractPackageFromText = (value) => {
  const normalized = normalizeText(value).toUpperCase();
  if (!normalized) return "";
  for (const token of CONTRACT_PACKAGE_VALUES) {
    if (normalized === token || hasStandaloneContractToken(normalized, token)) {
      return token;
    }
  }
  return "";
};

export const normalizeContractPackage = (
  value,
  { fallback = CONTRACT_PACKAGE.C2 } = {}
) => {
  const detected = detectContractPackageFromText(value);
  if (detected) return detected;
  const detectedFallback = detectContractPackageFromText(fallback);
  return detectedFallback || CONTRACT_PACKAGE.C2;
};

export const resolveContractPackage = (
  values = [],
  { fallback = CONTRACT_PACKAGE.C2 } = {}
) => {
  const normalizedValues = Array.isArray(values) ? values : [values];
  for (let index = 0; index < normalizedValues.length; index += 1) {
    const detected = detectContractPackageFromText(normalizedValues[index]);
    if (detected) return detected;
  }
  return normalizeContractPackage("", { fallback });
};

export const toContractPhaseScopedId = (contractPackage, id) => {
  const normalizedId = normalizeText(id);
  const normalizedPackage = normalizeContractPackage(contractPackage);
  if (!normalizedId) return normalizedPackage;
  return `${normalizedPackage}:${normalizedId}`;
};
