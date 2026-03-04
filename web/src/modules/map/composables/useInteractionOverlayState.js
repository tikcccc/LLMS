import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

const emptyScopeQueryResult = () => ({
  workLotIds: [],
  siteBoundaryIds: [],
  partOfSitesIds: [],
  sectionIds: [],
});

export const useInteractionOverlayState = ({
  mapRef,
  scopeSketchStyle,
  measureStyle,
  onScopeQueryResult,
}) => {
  const scopeQuerySource = new VectorSource();
  const scopeQueryLayer = new VectorLayer({
    source: scopeQuerySource,
    style: scopeSketchStyle,
  });
  scopeQueryLayer.setZIndex(30);
  let scopeLayerAdded = false;

  const measureSource = new VectorSource();
  const measureLayer = new VectorLayer({
    source: measureSource,
    style: measureStyle,
  });
  measureLayer.setZIndex(35);
  let measureLayerAdded = false;

  const ensureScopeLayer = () => {
    if (!mapRef.value || scopeLayerAdded) return;
    mapRef.value.addLayer(scopeQueryLayer);
    scopeLayerAdded = true;
  };

  const ensureMeasureLayer = () => {
    if (!mapRef.value || measureLayerAdded) return;
    mapRef.value.addLayer(measureLayer);
    measureLayerAdded = true;
  };

  const clearScopeQuery = () => {
    scopeQuerySource.clear(true);
    onScopeQueryResult?.(emptyScopeQueryResult());
  };

  const clearMeasure = () => {
    measureSource.clear(true);
  };

  return {
    scopeQuerySource,
    measureSource,
    ensureScopeLayer,
    ensureMeasureLayer,
    clearScopeQuery,
    clearMeasure,
  };
};
