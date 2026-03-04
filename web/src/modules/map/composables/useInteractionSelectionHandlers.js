import { ElMessageBox } from "element-plus";

export const useInteractionSelectionHandlers = ({
  uiStore,
  activeLayerType,
  modifySelectedId,
  selectedModifyFeature,
  setHighlightFeature,
  clearHighlightOverride,
  workLotStore,
  siteBoundaryStore,
  partOfSitesSource,
  sectionsSource,
  notifyPartOfSitesSourceChange,
  notifySectionsSourceChange,
  resolvePartOfSitesIdAtCoordinate,
  resolveSectionIdAtCoordinate,
  normalizePartId,
  normalizeSectionId,
  getPartOfSitesIdFromFeature,
  getSectionIdFromFeature,
}) => {
  const handleSelect = (event) => {
    if (uiStore.tool !== "PAN") return;
    const selected = event.selected[0];
    if (!selected) {
      uiStore.clearSelection();
      clearHighlightOverride();
      return;
    }
    const layerType = selected.get("layerType");
    const refId = selected.get("refId") || selected.getId();
    if (layerType === "work") {
      uiStore.selectWorkLot(refId);
    } else if (layerType === "siteBoundary") {
      uiStore.selectSiteBoundary(refId);
    } else if (layerType === "partOfSites") {
      const clickedCoordinate = event.mapBrowserEvent?.coordinate;
      const resolvedPartId =
        typeof resolvePartOfSitesIdAtCoordinate === "function"
          ? normalizePartId(resolvePartOfSitesIdAtCoordinate(clickedCoordinate))
          : "";
      uiStore.selectPartOfSite(resolvedPartId || getPartOfSitesIdFromFeature(selected) || refId);
    } else if (layerType === "section") {
      const clickedCoordinate = event.mapBrowserEvent?.coordinate;
      const resolvedSectionId =
        typeof resolveSectionIdAtCoordinate === "function"
          ? normalizeSectionId(resolveSectionIdAtCoordinate(clickedCoordinate))
          : "";
      uiStore.selectSection(resolvedSectionId || getSectionIdFromFeature(selected) || refId);
    } else {
      return;
    }
    clearHighlightOverride();
  };

  const handleDeleteSelect = (event) => {
    const selected = event.selected[0];
    if (!selected) return;
    const id = selected.getId();
    const layerType = selected.get("layerType") || activeLayerType.value;
    if (!layerType) return;
    setHighlightFeature(layerType, selected);
    const partId = getPartOfSitesIdFromFeature(selected);
    const sectionId = getSectionIdFromFeature(selected);
    const displayId =
      layerType === "partOfSites"
        ? partId || id
        : layerType === "section"
          ? sectionId || id
          : id;
    const label =
      layerType === "siteBoundary"
        ? "site boundary"
        : layerType === "partOfSites"
          ? "part of site"
          : layerType === "section"
            ? "section"
            : "work lot";
    ElMessageBox.confirm(`Delete ${label} ${displayId}?`, "Confirm", { type: "warning" })
      .then(() => {
        if (layerType === "siteBoundary") {
          siteBoundaryStore.removeSiteBoundary(id);
        } else if (layerType === "partOfSites") {
          partOfSitesSource?.removeFeature(selected);
          notifyPartOfSitesSourceChange();
        } else if (layerType === "section") {
          sectionsSource?.removeFeature(selected);
          notifySectionsSourceChange();
        } else {
          workLotStore.removeWorkLot(id);
        }
        uiStore.clearSelection();
        clearHighlightOverride();
      })
      .catch(() => {
        clearHighlightOverride();
      })
      .finally(() => {
        event.target.getFeatures().clear();
      });
  };

  const handleModifySelect = (event) => {
    const features = event.target.getFeatures();
    const selected = event.selected[0];

    if (!selected) {
      if (!selectedModifyFeature.value) {
        return;
      }
      features.clear();
      features.push(selectedModifyFeature.value);
      return;
    }

    const layerType = selected.get("layerType");
    if (
      layerType !== "work" &&
      layerType !== "siteBoundary" &&
      layerType !== "partOfSites" &&
      layerType !== "section"
    ) {
      return;
    }

    selectedModifyFeature.value = selected;
    const refId =
      layerType === "partOfSites"
        ? getPartOfSitesIdFromFeature(selected) || selected.get("refId") || selected.getId()
        : layerType === "section"
          ? getSectionIdFromFeature(selected) || selected.get("refId") || selected.getId()
          : selected.get("refId") || selected.getId();
    modifySelectedId.value = refId;
    if (layerType === "work") {
      uiStore.selectWorkLot(refId);
    } else if (layerType === "siteBoundary") {
      uiStore.selectSiteBoundary(refId);
    } else if (layerType === "section") {
      uiStore.selectSection(refId);
    } else {
      uiStore.selectPartOfSite(refId);
    }
    setHighlightFeature(layerType, selected);
  };

  return {
    handleSelect,
    handleDeleteSelect,
    handleModifySelect,
  };
};
