import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { highlightSiteBoundaryStyle, highlightWorkLotStyle } from "../ol/styles";
import {
  normalizeWorkLotCategory,
  WORK_LOT_CATEGORY,
} from "../../../shared/utils/worklot";

export const useMapHighlights = ({
  createWorkFeature,
  selectedWorkLot,
  uiStore,
  siteBoundarySource,
}) => {
  const workHighlightSource = new VectorSource();
  const siteBoundaryHighlightSource = new VectorSource();

  const workHighlightLayer = new VectorLayer({
    source: workHighlightSource,
    style: highlightWorkLotStyle,
  });

  workHighlightLayer.setZIndex(26);

  let highlightOverride = null;
  let siteBoundaryHighlightOverride = null;

  const siteBoundaryHighlightLayer = new VectorLayer({
    source: siteBoundaryHighlightSource,
    style: highlightSiteBoundaryStyle,
  });

  siteBoundaryHighlightLayer.setZIndex(16);

  const cloneFeature = (feature) => {
    if (!feature) return null;
    const clone = feature.clone();
    clone.setId(feature.getId());
    return clone;
  };

  const refreshHighlights = () => {
    workHighlightSource.clear(true);
    siteBoundaryHighlightSource.clear(true);

    const workFeature = highlightOverride
      ? cloneFeature(highlightOverride)
      : createWorkFeature(selectedWorkLot.value);
    if (workFeature) workHighlightSource.addFeature(workFeature);

    const siteBoundaryId = uiStore.selectedSiteBoundaryId;
    const siteBoundaryFeature = siteBoundaryHighlightOverride
      ? cloneFeature(siteBoundaryHighlightOverride)
      : siteBoundaryId && siteBoundarySource
        ? cloneFeature(siteBoundarySource.getFeatureById(siteBoundaryId))
        : null;
    if (siteBoundaryFeature) siteBoundaryHighlightSource.addFeature(siteBoundaryFeature);
  };

  const setHighlightFeature = (layerType, feature) => {
    if (layerType === "work") {
      highlightOverride = feature || null;
    }
    if (layerType === "siteBoundary") {
      siteBoundaryHighlightOverride = feature || null;
    }
    refreshHighlights();
  };

  const clearHighlightOverride = (layerType) => {
    if (!layerType || layerType === "work") {
      highlightOverride = null;
    }
    if (!layerType || layerType === "siteBoundary") {
      siteBoundaryHighlightOverride = null;
    }
    refreshHighlights();
  };

  const updateHighlightVisibility = () => {
    const selectedCategory = selectedWorkLot.value
      ? normalizeWorkLotCategory(selectedWorkLot.value.category ?? selectedWorkLot.value.type)
      : null;
    const canShowBusiness =
      uiStore.showWorkLots &&
      uiStore.showWorkLotsBusiness &&
      (selectedCategory === null || selectedCategory === WORK_LOT_CATEGORY.BU);
    const canShowDomestic =
      uiStore.showWorkLots &&
      uiStore.showWorkLotsDomestic &&
      (selectedCategory === null || selectedCategory === WORK_LOT_CATEGORY.HH);
    const canShowGovernment =
      uiStore.showWorkLots &&
      uiStore.showWorkLotsGovernment &&
      (selectedCategory === null || selectedCategory === WORK_LOT_CATEGORY.GL);
    workHighlightLayer.setVisible(canShowBusiness || canShowDomestic || canShowGovernment);
    siteBoundaryHighlightLayer.setVisible(uiStore.showSiteBoundary);
  };

  return {
    workHighlightSource,
    workHighlightLayer,
    siteBoundaryHighlightSource,
    siteBoundaryHighlightLayer,
    refreshHighlights,
    setHighlightFeature,
    clearHighlightOverride,
    updateHighlightVisibility,
  };
};
