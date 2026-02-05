import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { highlightLandLotStyle, highlightWorkLotStyle } from "../ol/styles";

export const useMapHighlights = ({
  createLandFeature,
  createWorkFeature,
  selectedLandLot,
  selectedWorkLot,
  uiStore,
}) => {
  const landHighlightSource = new VectorSource();
  const workHighlightSource = new VectorSource();

  const landHighlightLayer = new VectorLayer({
    source: landHighlightSource,
    style: highlightLandLotStyle,
  });
  const workHighlightLayer = new VectorLayer({
    source: workHighlightSource,
    style: highlightWorkLotStyle,
  });

  landHighlightLayer.setZIndex(25);
  workHighlightLayer.setZIndex(26);

  const highlightOverride = {
    land: null,
    work: null,
  };

  const cloneFeature = (feature) => {
    if (!feature) return null;
    const clone = feature.clone();
    clone.setId(feature.getId());
    return clone;
  };

  const refreshHighlights = () => {
    landHighlightSource.clear(true);
    workHighlightSource.clear(true);

    const landFeature = highlightOverride.land
      ? cloneFeature(highlightOverride.land)
      : createLandFeature(selectedLandLot.value);
    if (landFeature) landHighlightSource.addFeature(landFeature);

    const workFeature = highlightOverride.work
      ? cloneFeature(highlightOverride.work)
      : createWorkFeature(selectedWorkLot.value);
    if (workFeature) workHighlightSource.addFeature(workFeature);

  };

  const setHighlightFeature = (layerType, feature) => {
    if (layerType === "land") {
      highlightOverride.land = feature || null;
      highlightOverride.work = null;
    } else if (layerType === "work") {
      highlightOverride.work = feature || null;
      highlightOverride.land = null;
    }
    refreshHighlights();
  };

  const clearHighlightOverride = (layerType) => {
    if (!layerType) {
      highlightOverride.land = null;
      highlightOverride.work = null;
    } else if (layerType === "land") {
      highlightOverride.land = null;
    } else if (layerType === "work") {
      highlightOverride.work = null;
    }
    refreshHighlights();
  };

  const updateHighlightVisibility = () => {
    landHighlightLayer.setVisible(uiStore.showLandLots);
    workHighlightLayer.setVisible(uiStore.showWorkLots);
  };

  return {
    landHighlightSource,
    workHighlightSource,
    landHighlightLayer,
    workHighlightLayer,
    refreshHighlights,
    setHighlightFeature,
    clearHighlightOverride,
    updateHighlightVisibility,
  };
};
