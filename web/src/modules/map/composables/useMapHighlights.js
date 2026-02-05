import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { highlightIntLandStyle, highlightLandLotStyle, highlightWorkLotStyle } from "../ol/styles";

export const useMapHighlights = ({
  createLandFeature,
  createWorkFeature,
  selectedLandLot,
  selectedWorkLot,
  getIntLandFeature,
  uiStore,
}) => {
  const landHighlightSource = new VectorSource();
  const workHighlightSource = new VectorSource();
  const intHighlightSource = new VectorSource();

  const landHighlightLayer = new VectorLayer({
    source: landHighlightSource,
    style: highlightLandLotStyle,
  });
  const workHighlightLayer = new VectorLayer({
    source: workHighlightSource,
    style: highlightWorkLotStyle,
  });
  const intHighlightLayer = new VectorLayer({
    source: intHighlightSource,
    style: highlightIntLandStyle,
  });

  landHighlightLayer.setZIndex(25);
  workHighlightLayer.setZIndex(26);
  intHighlightLayer.setZIndex(24);

  const highlightOverride = {
    land: null,
    work: null,
    int: null,
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

    const intFeature = highlightOverride.int
      ? cloneFeature(highlightOverride.int)
      : getIntLandFeature?.();
    if (intFeature) intHighlightSource.addFeature(intFeature);
  };

  const setHighlightFeature = (layerType, feature) => {
    if (layerType === "land") {
      highlightOverride.land = feature || null;
      highlightOverride.work = null;
      highlightOverride.int = null;
    } else if (layerType === "work") {
      highlightOverride.work = feature || null;
      highlightOverride.land = null;
      highlightOverride.int = null;
    } else if (layerType === "int") {
      highlightOverride.int = feature || null;
      highlightOverride.land = null;
      highlightOverride.work = null;
    }
    refreshHighlights();
  };

  const clearHighlightOverride = (layerType) => {
    if (!layerType) {
      highlightOverride.land = null;
      highlightOverride.work = null;
      highlightOverride.int = null;
    } else if (layerType === "land") {
      highlightOverride.land = null;
    } else if (layerType === "work") {
      highlightOverride.work = null;
    } else if (layerType === "int") {
      highlightOverride.int = null;
    }
    refreshHighlights();
  };

  const updateHighlightVisibility = () => {
    landHighlightLayer.setVisible(uiStore.showLandLots);
    workHighlightLayer.setVisible(uiStore.showWorkLots);
    intHighlightLayer.setVisible(uiStore.showIntLand);
  };

  return {
    landHighlightSource,
    workHighlightSource,
    intHighlightSource,
    landHighlightLayer,
    workHighlightLayer,
    intHighlightLayer,
    refreshHighlights,
    setHighlightFeature,
    clearHighlightOverride,
    updateHighlightVisibility,
  };
};
