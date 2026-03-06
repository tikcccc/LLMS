export const useMapLayerVisibility = ({
  uiStore,
  normalizeContractPackageValue,
  isContractPackageVisible,
  normalizeWorkLotCategory,
  workLotCategory,
  isFeatureSelectedInFilter,
  getPartOfSitesLotId,
  getSectionLotId,
  baseWorkLotStyle,
  baseSiteBoundaryStyle,
  basePartOfSitesStyle,
  baseSectionStyle,
}) => {
  const isWorkFeatureVisible = (feature) => {
    if (!uiStore.showWorkLots) return false;
    const contractPackage = normalizeContractPackageValue(feature?.get("contractPackage"));
    if (
      !isContractPackageVisible(contractPackage, {
        showC1: uiStore.showWorkLotsC1,
        showC2: uiStore.showWorkLotsC2,
        showC3: uiStore.showWorkLotsC3,
      })
    ) {
      return false;
    }
    const category = normalizeWorkLotCategory(
      feature?.get("workCategory") || feature?.get("category")
    );
    if (category === workLotCategory.BU && !uiStore.showWorkLotsBusiness) return false;
    if (category === workLotCategory.HH && !uiStore.showWorkLotsDomestic) return false;
    if (category === workLotCategory.GL && !uiStore.showWorkLotsGovernment) return false;
    const workLotId = feature?.get("refId") || feature?.getId();
    return isFeatureSelectedInFilter(
      uiStore.workLotFilterMode,
      uiStore.workLotSelectedIds,
      workLotId
    );
  };

  const isSiteBoundaryFeatureVisible = (feature) => {
    if (!uiStore.showSiteBoundary) return false;
    const contractPackage = normalizeContractPackageValue(feature?.get("contractPackage"));
    if (
      !isContractPackageVisible(contractPackage, {
        showC1: uiStore.showSiteBoundaryC1,
        showC2: uiStore.showSiteBoundaryC2,
        showC3: uiStore.showSiteBoundaryC3,
      })
    ) {
      return false;
    }
    const boundaryId = feature?.get("refId") || feature?.getId();
    return isFeatureSelectedInFilter(
      uiStore.siteBoundaryFilterMode,
      uiStore.siteBoundarySelectedIds,
      boundaryId
    );
  };

  const isPartOfSitesFeatureVisible = (feature, index = 0) => {
    if (!uiStore.showPartOfSites) return false;
    const contractPackage = normalizeContractPackageValue(feature?.get("contractPackage"));
    if (
      !isContractPackageVisible(contractPackage, {
        showC1: uiStore.showPartOfSitesC1,
        showC2: uiStore.showPartOfSitesC2,
        showC3: uiStore.showPartOfSitesC3,
      })
    ) {
      return false;
    }
    const lotId = getPartOfSitesLotId(feature, index);
    return isFeatureSelectedInFilter(
      uiStore.partOfSitesFilterMode,
      uiStore.partOfSitesSelectedIds,
      lotId
    );
  };

  const isSectionFeatureVisible = (feature, index = 0) => {
    if (!uiStore.showSections) return false;
    const contractPackage = normalizeContractPackageValue(feature?.get("contractPackage"));
    if (
      !isContractPackageVisible(contractPackage, {
        showC1: uiStore.showSectionsC1,
        showC2: uiStore.showSectionsC2,
        showC3: uiStore.showSectionsC3,
      })
    ) {
      return false;
    }
    const sectionId = getSectionLotId(feature, index);
    return isFeatureSelectedInFilter(
      uiStore.sectionFilterMode,
      uiStore.sectionSelectedIds,
      sectionId
    );
  };

  const workLayerStyle = (feature) =>
    isWorkFeatureVisible(feature) ? baseWorkLotStyle(feature) : null;
  const siteBoundaryLayerStyle = (feature) =>
    isSiteBoundaryFeatureVisible(feature) ? baseSiteBoundaryStyle(feature) : null;
  const partOfSitesLayerStyle = (feature) =>
    isPartOfSitesFeatureVisible(feature) ? basePartOfSitesStyle(feature) : null;
  const sectionsLayerStyle = (feature) =>
    isSectionFeatureVisible(feature) ? baseSectionStyle(feature) : null;

  const updateLayerVisibilityForLayers = ({
    basemapLayer,
    labelLayer,
    intLandLayer,
    partOfSitesLayer,
    sectionsLayer,
    siteBoundaryLayer,
    workBusinessLayer,
    workHouseholdLayer,
    workGovernmentLayer,
  }) => {
    if (basemapLayer) basemapLayer.setVisible(uiStore.showBasemap);
    if (labelLayer) labelLayer.setVisible(uiStore.showLabels);
    // Drawing Layer is intentionally hidden from map rendering.
    intLandLayer.setVisible(false);
    partOfSitesLayer.setVisible(uiStore.showPartOfSites);
    sectionsLayer.setVisible(uiStore.showSections);
    siteBoundaryLayer.setVisible(uiStore.showSiteBoundary);
    const showGroup = uiStore.showWorkLots;
    workBusinessLayer.setVisible(showGroup && uiStore.showWorkLotsBusiness);
    workHouseholdLayer.setVisible(showGroup && uiStore.showWorkLotsDomestic);
    workGovernmentLayer.setVisible(showGroup && uiStore.showWorkLotsGovernment);
  };

  const refreshLayerFiltersForLayers = ({
    workBusinessLayer,
    workHouseholdLayer,
    workGovernmentLayer,
    siteBoundaryLayer,
    partOfSitesLayer,
    sectionsLayer,
  }) => {
    workBusinessLayer.changed();
    workHouseholdLayer.changed();
    workGovernmentLayer.changed();
    siteBoundaryLayer.changed();
    partOfSitesLayer.changed();
    sectionsLayer.changed();
  };

  return {
    workLayerStyle,
    siteBoundaryLayerStyle,
    partOfSitesLayerStyle,
    sectionsLayerStyle,
    updateLayerVisibilityForLayers,
    refreshLayerFiltersForLayers,
  };
};
