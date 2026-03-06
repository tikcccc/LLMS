export const normalizeLayerSelectedIdList = (values = []) => {
  if (!Array.isArray(values)) return [];
  const dedupe = new Set();
  values.forEach((value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    dedupe.add(normalized);
  });
  return Array.from(dedupe);
};

export const applyLayerFilterStateToUiStore = (uiStore, nextState = {}) => {
  if (!uiStore || !nextState || typeof nextState !== "object") return;
  if (typeof nextState.activeContract === "string" && nextState.activeContract.trim()) {
    uiStore.setActiveContract(nextState.activeContract);
  }
  if (typeof nextState.showBasemap === "boolean") {
    uiStore.setLayerVisibility("showBasemap", nextState.showBasemap);
  }
  if (typeof nextState.showLabels === "boolean") {
    uiStore.setLayerVisibility("showLabels", nextState.showLabels);
  }
  if (typeof nextState.showIntLand === "boolean") {
    uiStore.setLayerVisibility("showIntLand", nextState.showIntLand);
  }
  if (typeof nextState.showPartOfSites === "boolean") {
    uiStore.setLayerVisibility("showPartOfSites", nextState.showPartOfSites);
  }
  if (typeof nextState.showPartOfSitesC1 === "boolean") {
    uiStore.setLayerVisibility("showPartOfSitesC1", nextState.showPartOfSitesC1);
  }
  if (typeof nextState.showPartOfSitesC2 === "boolean") {
    uiStore.setLayerVisibility("showPartOfSitesC2", nextState.showPartOfSitesC2);
  }
  if (typeof nextState.showPartOfSitesC3 === "boolean") {
    uiStore.setLayerVisibility("showPartOfSitesC3", nextState.showPartOfSitesC3);
  }
  if (typeof nextState.showSections === "boolean") {
    uiStore.setLayerVisibility("showSections", nextState.showSections);
  }
  if (typeof nextState.showSectionsC1 === "boolean") {
    uiStore.setLayerVisibility("showSectionsC1", nextState.showSectionsC1);
  }
  if (typeof nextState.showSectionsC2 === "boolean") {
    uiStore.setLayerVisibility("showSectionsC2", nextState.showSectionsC2);
  }
  if (typeof nextState.showSectionsC3 === "boolean") {
    uiStore.setLayerVisibility("showSectionsC3", nextState.showSectionsC3);
  }
  if (typeof nextState.showSiteBoundary === "boolean") {
    uiStore.setLayerVisibility("showSiteBoundary", nextState.showSiteBoundary);
  }
  if (typeof nextState.showSiteBoundaryC1 === "boolean") {
    uiStore.setLayerVisibility("showSiteBoundaryC1", nextState.showSiteBoundaryC1);
  }
  if (typeof nextState.showSiteBoundaryC2 === "boolean") {
    uiStore.setLayerVisibility("showSiteBoundaryC2", nextState.showSiteBoundaryC2);
  }
  if (typeof nextState.showSiteBoundaryC3 === "boolean") {
    uiStore.setLayerVisibility("showSiteBoundaryC3", nextState.showSiteBoundaryC3);
  }
  if (typeof nextState.showWorkLots === "boolean") {
    uiStore.setLayerVisibility("showWorkLots", nextState.showWorkLots);
  }
  if (typeof nextState.showWorkLotsC1 === "boolean") {
    uiStore.setLayerVisibility("showWorkLotsC1", nextState.showWorkLotsC1);
  }
  if (typeof nextState.showWorkLotsC2 === "boolean") {
    uiStore.setLayerVisibility("showWorkLotsC2", nextState.showWorkLotsC2);
  }
  if (typeof nextState.showWorkLotsC3 === "boolean") {
    uiStore.setLayerVisibility("showWorkLotsC3", nextState.showWorkLotsC3);
  }

  if (Object.prototype.hasOwnProperty.call(nextState, "workLotFilterMode")) {
    uiStore.setMapFilterMode("workLot", nextState.workLotFilterMode);
  }
  if (Object.prototype.hasOwnProperty.call(nextState, "siteBoundaryFilterMode")) {
    uiStore.setMapFilterMode("siteBoundary", nextState.siteBoundaryFilterMode);
  }
  if (Object.prototype.hasOwnProperty.call(nextState, "partOfSitesFilterMode")) {
    uiStore.setMapFilterMode("partOfSites", nextState.partOfSitesFilterMode);
  }
  if (Object.prototype.hasOwnProperty.call(nextState, "sectionFilterMode")) {
    uiStore.setMapFilterMode("section", nextState.sectionFilterMode);
  }

  if (Array.isArray(nextState.workLotSelectedIds)) {
    const ids = normalizeLayerSelectedIdList(nextState.workLotSelectedIds);
    if (nextState.workLotFilterMode === "all") {
      uiStore.setMapFilterMode("workLot", "all");
    } else {
      uiStore.setMapSelectedIds("workLot", ids);
    }
  }
  if (Array.isArray(nextState.siteBoundarySelectedIds)) {
    const ids = normalizeLayerSelectedIdList(nextState.siteBoundarySelectedIds);
    if (nextState.siteBoundaryFilterMode === "all") {
      uiStore.setMapFilterMode("siteBoundary", "all");
    } else {
      uiStore.setMapSelectedIds("siteBoundary", ids);
    }
  }
  if (Array.isArray(nextState.partOfSitesSelectedIds)) {
    const ids = normalizeLayerSelectedIdList(nextState.partOfSitesSelectedIds);
    if (nextState.partOfSitesFilterMode === "all") {
      uiStore.setMapFilterMode("partOfSites", "all");
    } else {
      uiStore.setMapSelectedIds("partOfSites", ids);
    }
  }
  if (Array.isArray(nextState.sectionSelectedIds)) {
    const ids = normalizeLayerSelectedIdList(nextState.sectionSelectedIds);
    if (nextState.sectionFilterMode === "all") {
      uiStore.setMapFilterMode("section", "all");
    } else {
      uiStore.setMapSelectedIds("section", ids);
    }
  }
};

export const buildLayerFilterStateFromUiStore = (uiStore) => {
  if (!uiStore) return {};
  return {
    activeContract: uiStore.activeContract,
    showBasemap: uiStore.showBasemap,
    showLabels: uiStore.showLabels,
    showIntLand: uiStore.showIntLand,
    showPartOfSites: uiStore.showPartOfSites,
    showPartOfSitesC1: uiStore.showPartOfSitesC1,
    showPartOfSitesC2: uiStore.showPartOfSitesC2,
    showPartOfSitesC3: uiStore.showPartOfSitesC3,
    showSections: uiStore.showSections,
    showSectionsC1: uiStore.showSectionsC1,
    showSectionsC2: uiStore.showSectionsC2,
    showSectionsC3: uiStore.showSectionsC3,
    showSiteBoundary: uiStore.showSiteBoundary,
    showSiteBoundaryC1: uiStore.showSiteBoundaryC1,
    showSiteBoundaryC2: uiStore.showSiteBoundaryC2,
    showSiteBoundaryC3: uiStore.showSiteBoundaryC3,
    showWorkLots: uiStore.showWorkLots,
    showWorkLotsC1: uiStore.showWorkLotsC1,
    showWorkLotsC2: uiStore.showWorkLotsC2,
    showWorkLotsC3: uiStore.showWorkLotsC3,
    workLotFilterMode: uiStore.workLotFilterMode,
    workLotSelectedIds: [...uiStore.workLotSelectedIds],
    siteBoundaryFilterMode: uiStore.siteBoundaryFilterMode,
    siteBoundarySelectedIds: [...uiStore.siteBoundarySelectedIds],
    partOfSitesFilterMode: uiStore.partOfSitesFilterMode,
    partOfSitesSelectedIds: [...uiStore.partOfSitesSelectedIds],
    sectionFilterMode: uiStore.sectionFilterMode,
    sectionSelectedIds: [...uiStore.sectionSelectedIds],
  };
};
