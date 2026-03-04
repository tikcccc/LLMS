import { useMapFocusState } from "./useMapFocusState";
import { useMapFocusTargetActions } from "./useMapFocusTargetActions";
import { useMapZoomRouteActions } from "./useMapZoomRouteActions";

export const useMapPageFocusSetup = ({
  mapRef,
  route,
  uiStore,
  workLotStore,
  mapSources,
  getWorkFeatureById,
  createWorkFeature,
  featureLookup,
  metaResolvers,
  getPartGeometryStatById,
  ensureContractPackageVisible,
  resolveContractPackageValue,
  normalizeWorkLotCategory,
  workLotCategory,
  refreshHighlights,
  contractPackage,
  normalizeLayerSelectedIdList,
  applyLayerFilterStateToUiStore,
  refreshLayerPresentation,
}) => {
  const {
    hasFocusQueryInRoute,
    fitToSiteBoundary,
    applyFocusFromRoute,
    zoomToWorkLot,
    zoomToSiteBoundary,
    zoomToPartOfSite,
    zoomToSection,
  } = useMapZoomRouteActions({
    mapRef,
    route,
    uiStore,
    workLotStore,
    ...mapSources,
    getWorkFeatureById,
    createWorkFeature,
    ...featureLookup,
    ...metaResolvers,
    getPartGeometryStatById,
    ensureContractPackageVisible,
    resolveContractPackageValue,
    normalizeWorkLotCategory,
    workLotCategory,
    refreshHighlights,
  });

  const {
    activeMapFocus,
    focusMapTarget,
    clearActiveMapFocus,
    handleSidePanelClose,
    toggleFocusOnMapTarget,
    isActiveFocusStateValid,
    isFocusStateLocked,
  } = useMapFocusState({
    uiStore,
    workLotStore,
    contractPackage,
    workLotCategory,
    resolveContractPackageValue,
    normalizeWorkLotCategory,
    ...featureLookup,
    ...metaResolvers,
    normalizeLayerSelectedIdList,
    applyLayerFilterStateToUiStore,
    refreshLayerPresentation,
    focusTargetActions: {
      workLot: zoomToWorkLot,
      siteBoundary: zoomToSiteBoundary,
      partOfSites: zoomToPartOfSite,
      section: zoomToSection,
    },
  });

  const {
    focusOnMapWorkLot,
    focusOnMapSiteBoundary,
    focusOnMapPartOfSite,
    focusOnMapSection,
  } = useMapFocusTargetActions({
    workLotStore,
    ...featureLookup,
    ...metaResolvers,
    toggleFocusOnMapTarget,
  });

  return {
    hasFocusQueryInRoute,
    fitToSiteBoundary,
    applyFocusFromRoute,
    zoomToWorkLot,
    zoomToSiteBoundary,
    zoomToPartOfSite,
    zoomToSection,
    activeMapFocus,
    focusMapTarget,
    clearActiveMapFocus,
    handleSidePanelClose,
    isActiveFocusStateValid,
    isFocusStateLocked,
    focusOnMapWorkLot,
    focusOnMapSiteBoundary,
    focusOnMapPartOfSite,
    focusOnMapSection,
  };
};
