import { onBeforeUnmount, onMounted } from "vue";

export const useMapPageLifecycle = ({
  uiStore,
  mapRef,
  siteBoundaryStore,
  initMap,
  mapLayers,
  refreshWorkSources,
  sanitizeMapFilterSelections,
  loadIntLandGeojson,
  loadPartOfSitesGeojson,
  loadSectionsGeojson,
  loadSiteBoundaryGeojson,
  partOfSitesSourceVersion,
  sectionSourceVersion,
  siteBoundarySourceVersion,
  syncSectionPartRelations,
  syncWorkLotBoundaryLinks,
  refreshSiteBoundaryState,
  refreshLayerFilters,
  refreshHighlights,
  hasFocusQueryInRoute,
  fitToSiteBoundary,
  applyFocusFromRoute,
  updateLayerOpacity,
  updateLayerVisibility,
  basemapLayer,
  labelLayer,
  updateHighlightVisibility,
  rebuildInteractions,
  handleKeydown,
}) => {
  onMounted(async () => {
    if (uiStore.tool !== "PAN") {
      uiStore.setTool("PAN");
    }
    await siteBoundaryStore.ensureLoaded();
    initMap(mapLayers);
    refreshWorkSources();
    sanitizeMapFilterSelections();
    loadIntLandGeojson();
    loadPartOfSitesGeojson().then(() => {
      partOfSitesSourceVersion.value += 1;
      syncSectionPartRelations();
      sectionSourceVersion.value += 1;
      sanitizeMapFilterSelections();
      refreshLayerFilters();
      refreshHighlights();
      applyFocusFromRoute();
    });
    loadSectionsGeojson().then(() => {
      sectionSourceVersion.value += 1;
      syncSectionPartRelations();
      partOfSitesSourceVersion.value += 1;
      sanitizeMapFilterSelections();
      refreshLayerFilters();
      refreshHighlights();
      applyFocusFromRoute();
    });
    const shouldAutoFit = !hasFocusQueryInRoute();
    loadSiteBoundaryGeojson().then(() => {
      siteBoundarySourceVersion.value += 1;
      syncWorkLotBoundaryLinks();
      refreshSiteBoundaryState();
      sanitizeMapFilterSelections();
      if (shouldAutoFit) {
        fitToSiteBoundary();
      }
      applyFocusFromRoute();
      refreshHighlights();
    });
    updateLayerOpacity();
    updateLayerVisibility(basemapLayer.value, labelLayer.value);
    updateHighlightVisibility();
    refreshHighlights();
    rebuildInteractions();
    applyFocusFromRoute();
    window.addEventListener("keydown", handleKeydown);
  });

  onBeforeUnmount(() => {
    if (mapRef.value) {
      mapRef.value.setTarget(null);
    }
    window.removeEventListener("keydown", handleKeydown);
  });
};
