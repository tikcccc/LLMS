export const useMapContractPackageHelpers = ({
  uiStore,
  contractPackage,
  normalizeContractPackage,
  resolveContractPackage,
}) => {
  const normalizeContractPackageValue = (value) => normalizeContractPackage(value);

  const resolveContractPackageValue = (values = []) =>
    resolveContractPackage(values, { fallback: contractPackage.C2 });

  const toContractPackageVisibilityKey = (group, packageValue) => {
    const normalized = normalizeContractPackageValue(packageValue);
    if (group === "workLot") {
      return `showWorkLots${normalized}`;
    }
    if (group === "siteBoundary") {
      return `showSiteBoundary${normalized}`;
    }
    if (group === "partOfSites") {
      return `showPartOfSites${normalized}`;
    }
    return `showSections${normalized}`;
  };

  const ensureContractPackageVisible = (group, packageValue) => {
    const normalized = normalizeContractPackageValue(packageValue);
    if (uiStore.activeContract !== normalized) {
      uiStore.setActiveContract(normalized);
      return;
    }
    const key = toContractPackageVisibilityKey(group, normalized);
    if (key && !uiStore[key]) {
      uiStore.setLayerVisibility(key, true);
    }
  };

  return {
    normalizeContractPackageValue,
    resolveContractPackageValue,
    ensureContractPackageVisible,
  };
};
