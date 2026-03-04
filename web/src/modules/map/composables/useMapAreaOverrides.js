export const useMapAreaOverrides = ({
  partOfSitesStore,
  sectionsStore,
  normalizePartValue,
  normalizeSectionValue,
  normalizePositiveNumber,
  normalizeContractPackageValue,
  toContractPhaseScopedId,
}) => {
  const getPartAreaOverride = (partId, contractPackage = "") => {
    const normalizedPartId = normalizePartValue(partId);
    if (!normalizedPartId || !partOfSitesStore) return null;
    const normalizedPackage = normalizeContractPackageValue(contractPackage);
    const override =
      typeof partOfSitesStore.attributeByPartId === "function"
        ? partOfSitesStore.attributeByPartId(normalizedPartId, normalizedPackage)
        : partOfSitesStore.attributeOverrides?.[
              toContractPhaseScopedId(normalizedPackage, normalizedPartId).toLowerCase()
            ] || partOfSitesStore.attributeOverrides?.[normalizedPartId.toLowerCase()] || null;
    return normalizePositiveNumber(override?.area);
  };

  const getSectionAreaOverride = (sectionId, contractPackage = "") => {
    const normalizedSectionId = normalizeSectionValue(sectionId);
    if (!normalizedSectionId || !sectionsStore) return null;
    const normalizedPackage = normalizeContractPackageValue(contractPackage);
    const override =
      typeof sectionsStore.attributeBySectionId === "function"
        ? sectionsStore.attributeBySectionId(normalizedSectionId, normalizedPackage)
        : sectionsStore.attributeOverrides?.[
              toContractPhaseScopedId(normalizedPackage, normalizedSectionId).toLowerCase()
            ] || sectionsStore.attributeOverrides?.[normalizedSectionId.toLowerCase()] || null;
    return normalizePositiveNumber(override?.area);
  };

  return {
    getPartAreaOverride,
    getSectionAreaOverride,
  };
};
