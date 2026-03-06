import { watch } from "vue";

export const useMapPageWatchers = ({
  workLotStore,
  siteBoundaryStore,
  uiStore,
  authStore,
  route,
  activeLayerType,
  activeMapFocus,
  isFocusStateLocked,
  isActiveFocusStateValid,
  clearActiveMapFocus,
  showWorkDialog,
  workDialogMode,
  workForm,
  pendingGeometry,
  resolveRelatedSiteBoundaryIdsByGeometryObject,
  refreshWorkSources,
  refreshSiteBoundaryState,
  refreshSiteBoundarySource,
  syncWorkLotBoundaryLinks,
  sanitizeMapFilterSelections,
  refreshLayerFilters,
  refreshHighlights,
  updateLayerVisibility,
  basemapLayer,
  labelLayer,
  updateHighlightVisibility,
  rebuildInteractions,
  onRoleChange,
  clearHighlightOverride,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  siteBoundarySource,
  partOfSitesSource,
  sectionsSource,
  workHighlightSource,
  partOfSitesHighlightSource,
  sectionHighlightSource,
  siteBoundaryHighlightSource,
  selectInteraction,
  siteBoundarySourceVersion,
  partOfSitesSourceVersion,
  sectionSourceVersion,
  applyFocusFromRoute,
}) => {
  watch(
    () => workLotStore.workLots,
    () => {
      refreshWorkSources();
      refreshSiteBoundaryState();
      sanitizeMapFilterSelections();
      refreshLayerFilters();
      siteBoundarySourceVersion.value += 1;
      refreshHighlights();
    },
    { deep: true }
  );

  watch(
    () => siteBoundaryStore.siteBoundaries,
    () => {
      refreshSiteBoundarySource();
      syncWorkLotBoundaryLinks();
      sanitizeMapFilterSelections();
      refreshLayerFilters();
      siteBoundarySourceVersion.value += 1;
      refreshHighlights();
    },
    { deep: true }
  );

  watch(
    () => uiStore.tool,
    () => rebuildInteractions()
  );

  watch(
    () => activeLayerType.value,
    (nextLayerType) => {
      if (!nextLayerType) return;
      uiStore.clearSelection();
      clearHighlightOverride();
      if (uiStore.tool !== "PAN") {
        rebuildInteractions();
      }
    }
  );

  watch(
    () => showWorkDialog.value,
    (open) => {
      if (!open || workDialogMode.value !== "create") return;
      workForm.value.contractPackage = uiStore.activeContract;
      workForm.value.relatedSiteBoundaryIds =
        resolveRelatedSiteBoundaryIdsByGeometryObject(pendingGeometry.value);
    }
  );

  watch(
    () => [
      uiStore.showBasemap,
      uiStore.showLabels,
      uiStore.showIntLand,
      uiStore.activeContract,
      uiStore.showPartOfSites,
      uiStore.showPartOfSitesC1,
      uiStore.showPartOfSitesC2,
      uiStore.showPartOfSitesC3,
      uiStore.showSections,
      uiStore.showSectionsC1,
      uiStore.showSectionsC2,
      uiStore.showSectionsC3,
      uiStore.showSiteBoundary,
      uiStore.showSiteBoundaryC1,
      uiStore.showSiteBoundaryC2,
      uiStore.showSiteBoundaryC3,
      uiStore.showWorkLots,
      uiStore.showWorkLotsC1,
      uiStore.showWorkLotsC2,
      uiStore.showWorkLotsC3,
      uiStore.showWorkLotsBusiness,
      uiStore.showWorkLotsDomestic,
      uiStore.showWorkLotsGovernment,
    ],
    () => {
      updateLayerVisibility(basemapLayer.value, labelLayer.value);
      refreshLayerFilters();
      updateHighlightVisibility();
      refreshHighlights();
      if (uiStore.tool !== "PAN") {
        rebuildInteractions();
      }
    }
  );

  watch(
    () => [
      uiStore.workLotFilterMode,
      uiStore.siteBoundaryFilterMode,
      uiStore.partOfSitesFilterMode,
      uiStore.sectionFilterMode,
      uiStore.workLotSelectedIds.join("|"),
      uiStore.siteBoundarySelectedIds.join("|"),
      uiStore.partOfSitesSelectedIds.join("|"),
      uiStore.sectionSelectedIds.join("|"),
    ],
    () => {
      refreshLayerFilters();
      updateHighlightVisibility();
      refreshHighlights();
      if (uiStore.tool === "MODIFY" || uiStore.tool === "DELETE") {
        rebuildInteractions();
      }
    }
  );

  watch(
    () => [
      activeMapFocus.value?.group || "",
      activeMapFocus.value?.id || "",
      uiStore.showIntLand,
      uiStore.activeContract,
      uiStore.showWorkLots,
      uiStore.showWorkLotsC1,
      uiStore.showWorkLotsC2,
      uiStore.showWorkLotsC3,
      uiStore.showWorkLotsBusiness,
      uiStore.showWorkLotsDomestic,
      uiStore.showWorkLotsGovernment,
      uiStore.showSiteBoundary,
      uiStore.showSiteBoundaryC1,
      uiStore.showSiteBoundaryC2,
      uiStore.showSiteBoundaryC3,
      uiStore.showPartOfSites,
      uiStore.showPartOfSitesC1,
      uiStore.showPartOfSitesC2,
      uiStore.showPartOfSitesC3,
      uiStore.showSections,
      uiStore.showSectionsC1,
      uiStore.showSectionsC2,
      uiStore.showSectionsC3,
      uiStore.workLotFilterMode,
      uiStore.siteBoundaryFilterMode,
      uiStore.partOfSitesFilterMode,
      uiStore.sectionFilterMode,
      uiStore.workLotSelectedIds.join("|"),
      uiStore.siteBoundarySelectedIds.join("|"),
      uiStore.partOfSitesSelectedIds.join("|"),
      uiStore.sectionSelectedIds.join("|"),
    ],
    () => {
      if (!activeMapFocus.value) return;
      if (isFocusStateLocked()) return;
      if (!isActiveFocusStateValid()) {
        clearActiveMapFocus({ restoreSnapshot: false });
      }
    }
  );

  watch(
    () => authStore.role,
    () => onRoleChange()
  );

  watch(
    () => uiStore.activeContract,
    () => {
      uiStore.clearSelection();
      clearHighlightOverride();
      sanitizeMapFilterSelections();
      refreshLayerFilters();
      refreshHighlights();
      updateHighlightVisibility();
    }
  );

  watch(
    () => uiStore.selectedWorkLotId,
    (value) => {
      if (!value) return;
      const exists = workLotStore.workLots.some((lot) => lot.id === value);
      if (!exists) uiStore.clearSelection();
    }
  );

  watch(
    () => uiStore.selectedWorkLotId,
    (workId) => {
      updateHighlightVisibility();
      refreshHighlights();
      if (!workId && selectInteraction.value?.getFeatures) {
        selectInteraction.value.getFeatures().clear();
      }
    }
  );

  watch(
    () => uiStore.selectedSiteBoundaryId,
    (value) => {
      if (value && siteBoundarySource) {
        const exists = !!findSiteBoundaryFeatureById(value);
        if (!exists) {
          uiStore.clearSelection();
          return;
        }
      }
      updateHighlightVisibility();
      refreshHighlights();
      if (!value && selectInteraction.value?.getFeatures) {
        selectInteraction.value.getFeatures().clear();
      }
    }
  );

  watch(
    () => uiStore.selectedPartOfSiteId,
    (value) => {
      if (value && partOfSitesSource) {
        const exists = !!findPartOfSitesFeatureById(value);
        if (!exists) {
          uiStore.clearSelection();
          return;
        }
      }
      updateHighlightVisibility();
      refreshHighlights();
      if (!value && selectInteraction.value?.getFeatures) {
        selectInteraction.value.getFeatures().clear();
      }
    }
  );

  watch(
    () => uiStore.selectedSectionId,
    (value) => {
      if (value && sectionsSource) {
        const exists = !!findSectionFeatureById(value);
        if (!exists) {
          uiStore.clearSelection();
          return;
        }
      }
      updateHighlightVisibility();
      refreshHighlights();
      if (!value && selectInteraction.value?.getFeatures) {
        selectInteraction.value.getFeatures().clear();
      }
    }
  );

  watch(
    () => route.query,
    () => {
      applyFocusFromRoute();
    }
  );

  const clearAllHighlights = () => {
    workHighlightSource?.clear(true);
    partOfSitesHighlightSource?.clear(true);
    sectionHighlightSource?.clear(true);
    siteBoundaryHighlightSource?.clear(true);
  };

  return {
    clearAllHighlights,
  };
};
