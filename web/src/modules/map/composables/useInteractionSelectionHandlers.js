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
    const rawLayerType = selected.get("layerType");
    const layerType =
      rawLayerType === "work" ||
      rawLayerType === "siteBoundary" ||
      rawLayerType === "partOfSites" ||
      rawLayerType === "section"
        ? rawLayerType
        : activeLayerType.value;
    if (!layerType) return;
    const id = selected.getId();
    const refId = selected.get("refId") || id;
    const clickedCoordinate = event.mapBrowserEvent?.coordinate;
    const resolvedPartId =
      layerType === "partOfSites" && typeof resolvePartOfSitesIdAtCoordinate === "function"
        ? normalizePartId(resolvePartOfSitesIdAtCoordinate(clickedCoordinate))
        : "";
    const resolvedSectionId =
      layerType === "section" && typeof resolveSectionIdAtCoordinate === "function"
        ? normalizeSectionId(resolveSectionIdAtCoordinate(clickedCoordinate))
        : "";
    const selectedId =
      layerType === "partOfSites"
        ? resolvedPartId || getPartOfSitesIdFromFeature(selected) || refId
        : layerType === "section"
          ? resolvedSectionId || getSectionIdFromFeature(selected) || refId
          : refId;
    if (layerType === "work") {
      uiStore.selectWorkLot(selectedId);
    } else if (layerType === "siteBoundary") {
      uiStore.selectSiteBoundary(selectedId);
    } else if (layerType === "partOfSites") {
      uiStore.selectPartOfSite(selectedId);
    } else if (layerType === "section") {
      uiStore.selectSection(selectedId);
    }
    setHighlightFeature(layerType, selected);
    const displayId = selectedId || id;
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
          siteBoundaryStore.removeSiteBoundary(displayId);
        } else if (layerType === "partOfSites") {
          partOfSitesSource?.removeFeature(selected);
          notifyPartOfSitesSourceChange();
        } else if (layerType === "section") {
          sectionsSource?.removeFeature(selected);
          notifySectionsSourceChange();
        } else {
          workLotStore.removeWorkLot(displayId);
        }
        uiStore.clearSelection();
        clearHighlightOverride();
      })
      .catch(() => {
        uiStore.clearSelection();
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

    const resolveModifyRefId = (feature, type) =>
      type === "partOfSites"
        ? getPartOfSitesIdFromFeature(feature) || feature.get("refId") || feature.getId()
        : type === "section"
          ? getSectionIdFromFeature(feature) || feature.get("refId") || feature.getId()
          : feature.get("refId") || feature.getId();
    const refId = resolveModifyRefId(selected, layerType);

    // Lock the first selected target during a modify session.
    const lockedFeature = selectedModifyFeature.value;
    if (lockedFeature) {
      const lockedLayerType = lockedFeature.get("layerType");
      const lockedRefId = resolveModifyRefId(lockedFeature, lockedLayerType);
      const sameTarget =
        String(lockedLayerType || "") === String(layerType || "") &&
        String(lockedRefId || "").trim().toLowerCase() ===
          String(refId || "").trim().toLowerCase();
      if (!sameTarget) {
        features.clear();
        features.push(lockedFeature);
        return;
      }
    }

    selectedModifyFeature.value = selected;
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
