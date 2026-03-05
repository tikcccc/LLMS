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
      return normalized === contractPackage.C1 ? "showWorkLotsC1" : "showWorkLotsC2";
    }
    if (group === "siteBoundary") {
      return normalized === contractPackage.C1
        ? "showSiteBoundaryC1"
        : "showSiteBoundaryC2";
    }
    if (group === "partOfSites") {
      return normalized === contractPackage.C1
        ? "showPartOfSitesC1"
        : "showPartOfSitesC2";
    }
    return normalized === contractPackage.C1 ? "showSectionsC1" : "showSectionsC2";
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
