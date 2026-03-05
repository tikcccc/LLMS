import { computed, ref } from "vue";

export const useMapFocusState = ({
  uiStore,
  workLotStore,
  contractPackage,
  workLotCategory,
  resolveContractPackageValue,
  normalizeWorkLotCategory,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  normalizeLayerSelectedIdList,
  applyLayerFilterStateToUiStore,
  refreshLayerPresentation,
  focusTargetActions = {},
}) => {
  const normalizeFocusToken = (value) => String(value || "").trim().toLowerCase();

  const activeMapFocus = ref(null);
  const focusMapTarget = computed(() =>
    activeMapFocus.value
      ? { group: activeMapFocus.value.group, id: activeMapFocus.value.id }
      : null
  );

  const captureFocusSnapshot = () => ({
    activeContract: uiStore.activeContract,
    showIntLand: uiStore.showIntLand,
    showWorkLots: uiStore.showWorkLots,
    showWorkLotsC1: uiStore.showWorkLotsC1,
    showWorkLotsC2: uiStore.showWorkLotsC2,
    showWorkLotsBusiness: uiStore.showWorkLotsBusiness,
    showWorkLotsDomestic: uiStore.showWorkLotsDomestic,
    showWorkLotsGovernment: uiStore.showWorkLotsGovernment,
    showSiteBoundary: uiStore.showSiteBoundary,
    showSiteBoundaryC1: uiStore.showSiteBoundaryC1,
    showSiteBoundaryC2: uiStore.showSiteBoundaryC2,
    showPartOfSites: uiStore.showPartOfSites,
    showPartOfSitesC1: uiStore.showPartOfSitesC1,
    showPartOfSitesC2: uiStore.showPartOfSitesC2,
    showSections: uiStore.showSections,
    showSectionsC1: uiStore.showSectionsC1,
    showSectionsC2: uiStore.showSectionsC2,
    workLotFilterMode: uiStore.workLotFilterMode,
    workLotSelectedIds: [...uiStore.workLotSelectedIds],
    siteBoundaryFilterMode: uiStore.siteBoundaryFilterMode,
    siteBoundarySelectedIds: [...uiStore.siteBoundarySelectedIds],
    partOfSitesFilterMode: uiStore.partOfSitesFilterMode,
    partOfSitesSelectedIds: [...uiStore.partOfSitesSelectedIds],
    sectionFilterMode: uiStore.sectionFilterMode,
    sectionSelectedIds: [...uiStore.sectionSelectedIds],
  });

  const restoreFocusSnapshot = (snapshot) => {
    if (!snapshot) return;
    applyLayerFilterStateToUiStore(uiStore, snapshot);
    if (typeof snapshot.showWorkLotsBusiness === "boolean") {
      uiStore.setLayerVisibility("showWorkLotsBusiness", snapshot.showWorkLotsBusiness);
    }
    if (typeof snapshot.showWorkLotsDomestic === "boolean") {
      uiStore.setLayerVisibility("showWorkLotsDomestic", snapshot.showWorkLotsDomestic);
    }
    if (typeof snapshot.showWorkLotsGovernment === "boolean") {
      uiStore.setLayerVisibility("showWorkLotsGovernment", snapshot.showWorkLotsGovernment);
    }
    if (typeof refreshLayerPresentation === "function") {
      refreshLayerPresentation();
    }
  };

  const focusStateMutationLock = ref(false);
  const runWithFocusStateLock = (task) => {
    focusStateMutationLock.value = true;
    try {
      task();
    } finally {
      focusStateMutationLock.value = false;
    }
  };

  const clearActiveMapFocus = ({ restoreSnapshot = false } = {}) => {
    if (!activeMapFocus.value) return;
    const snapshot = activeMapFocus.value.snapshot || null;
    activeMapFocus.value = null;
    if (restoreSnapshot && snapshot) {
      runWithFocusStateLock(() => {
        restoreFocusSnapshot(snapshot);
      });
    }
  };

  const handleSidePanelClose = () => {
    if (!activeMapFocus.value) return;
    clearActiveMapFocus({ restoreSnapshot: true });
  };

  const resetFocusOnMapFilters = () => {
    uiStore.setLayerVisibility("showIntLand", false);
    uiStore.setLayerVisibility("showWorkLots", false);
    uiStore.setLayerVisibility("showSiteBoundary", false);
    uiStore.setLayerVisibility("showPartOfSites", false);
    uiStore.setLayerVisibility("showSections", false);
    uiStore.setMapFilterMode("workLot", "all");
    uiStore.setMapFilterMode("siteBoundary", "all");
    uiStore.setMapFilterMode("partOfSites", "all");
    uiStore.setMapFilterMode("section", "all");
  };

  const applyFocusOnMapTarget = (group, targetId) => {
    const normalizedTargetId = String(targetId || "").trim();
    if (!normalizedTargetId) return;
    runWithFocusStateLock(() => {
      resetFocusOnMapFilters();
      if (group === "workLot") {
        uiStore.setLayerVisibility("showWorkLots", true);
        uiStore.setMapSelectedIds("workLot", [normalizedTargetId]);
      }
      if (group === "siteBoundary") {
        uiStore.setLayerVisibility("showSiteBoundary", true);
        uiStore.setMapSelectedIds("siteBoundary", [normalizedTargetId]);
      }
      if (group === "partOfSites") {
        uiStore.setLayerVisibility("showPartOfSites", true);
        uiStore.setMapSelectedIds("partOfSites", [normalizedTargetId]);
      }
      if (group === "section") {
        uiStore.setLayerVisibility("showSections", true);
        uiStore.setMapSelectedIds("section", [normalizedTargetId]);
      }
      if (typeof refreshLayerPresentation === "function") {
        refreshLayerPresentation();
      }
    });
    const action = focusTargetActions[group];
    if (typeof action === "function") {
      action(normalizedTargetId);
    }
  };

  const toggleFocusOnMapTarget = (group, targetId) => {
    const normalizedTargetId = String(targetId || "").trim();
    if (!normalizedTargetId) return;
    const currentGroup = activeMapFocus.value?.group || "";
    const currentId = normalizeFocusToken(activeMapFocus.value?.id);
    if (currentGroup === group && currentId === normalizeFocusToken(normalizedTargetId)) {
      clearActiveMapFocus({ restoreSnapshot: true });
      return;
    }
    const snapshot = activeMapFocus.value?.snapshot || captureFocusSnapshot();
    activeMapFocus.value = {
      group,
      id: normalizedTargetId,
      snapshot,
    };
    applyFocusOnMapTarget(group, normalizedTargetId);
  };

  const isSingleFocusSelection = (mode, ids, targetId) => {
    if (mode !== "custom") return false;
    const normalizedSelected = normalizeLayerSelectedIdList(ids).map((item) =>
      normalizeFocusToken(item)
    );
    if (normalizedSelected.length !== 1) return false;
    return normalizedSelected[0] === normalizeFocusToken(targetId);
  };

  const isActiveFocusStateValid = () => {
    if (!activeMapFocus.value) return true;
    const { group, id } = activeMapFocus.value;
    const othersHidden =
      !uiStore.showIntLand &&
      (group === "workLot" ? true : !uiStore.showWorkLots) &&
      (group === "siteBoundary" ? true : !uiStore.showSiteBoundary) &&
      (group === "partOfSites" ? true : !uiStore.showPartOfSites) &&
      (group === "section" ? true : !uiStore.showSections);
    if (!othersHidden) return false;

    if (group === "workLot") {
      if (!uiStore.showWorkLots) return false;
      if (!isSingleFocusSelection(uiStore.workLotFilterMode, uiStore.workLotSelectedIds, id)) {
        return false;
      }
      const lot = workLotStore.workLots.find(
        (item) => normalizeFocusToken(item.id) === normalizeFocusToken(id)
      );
      if (!lot) return false;
      const resolvedPackage = resolveContractPackageValue([
        lot.contractPackage,
        lot.contract_package,
        lot.phase,
        lot.package,
        lot.contractNo,
      ]);
      if (
        (resolvedPackage === contractPackage.C1 && !uiStore.showWorkLotsC1) ||
        (resolvedPackage === contractPackage.C2 && !uiStore.showWorkLotsC2)
      ) {
        return false;
      }
      const category = normalizeWorkLotCategory(lot.category ?? lot.type);
      if (category === workLotCategory.BU && !uiStore.showWorkLotsBusiness) return false;
      if (category === workLotCategory.HH && !uiStore.showWorkLotsDomestic) return false;
      if (category === workLotCategory.GL && !uiStore.showWorkLotsGovernment) return false;
      return true;
    }

    if (group === "siteBoundary") {
      if (!uiStore.showSiteBoundary) return false;
      if (
        !isSingleFocusSelection(
          uiStore.siteBoundaryFilterMode,
          uiStore.siteBoundarySelectedIds,
          id
        )
      ) {
        return false;
      }
      const feature = findSiteBoundaryFeatureById(id);
      if (!feature) return false;
      const resolvedPackage = resolveContractPackageValue([
        feature.get("contractPackage"),
        feature.get("contract_package"),
        feature.get("phase"),
        feature.get("package"),
        feature.get("contractNo"),
        feature.get("layer"),
      ]);
      if (resolvedPackage === contractPackage.C1) return uiStore.showSiteBoundaryC1;
      return uiStore.showSiteBoundaryC2;
    }

    if (group === "partOfSites") {
      if (!uiStore.showPartOfSites) return false;
      if (
        !isSingleFocusSelection(uiStore.partOfSitesFilterMode, uiStore.partOfSitesSelectedIds, id)
      ) {
        return false;
      }
      const feature = findPartOfSitesFeatureById(id);
      if (!feature) return false;
      const meta = resolvePartOfSiteMeta(feature);
      if (meta.contractPackage === contractPackage.C1) return uiStore.showPartOfSitesC1;
      return uiStore.showPartOfSitesC2;
    }

    if (group === "section") {
      if (!uiStore.showSections) return false;
      if (!isSingleFocusSelection(uiStore.sectionFilterMode, uiStore.sectionSelectedIds, id)) {
        return false;
      }
      const feature = findSectionFeatureById(id);
      if (!feature) return false;
      const meta = resolveSectionMeta(feature);
      if (meta.contractPackage === contractPackage.C1) return uiStore.showSectionsC1;
      return uiStore.showSectionsC2;
    }

    return false;
  };

  const isFocusStateLocked = () => focusStateMutationLock.value;

  return {
    activeMapFocus,
    focusMapTarget,
    clearActiveMapFocus,
    handleSidePanelClose,
    toggleFocusOnMapTarget,
    isActiveFocusStateValid,
    isFocusStateLocked,
  };
};
