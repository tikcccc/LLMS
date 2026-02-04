import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { landLotStyle, workLotStyle } from "../ol/styles";
import { EPSG_2326 } from "../ol/projection";
import { getWorkLotTaskAlert } from "../utils/taskUtils";

export const useMapLayers = ({
  landLotStore,
  workLotStore,
  taskStore,
  authStore,
  uiStore,
}) => {
  const format = new GeoJSON();

  const landSource = new VectorSource();
  const workSource = new VectorSource();

  const landLayer = new VectorLayer({ source: landSource, style: landLotStyle });
  const workLayer = new VectorLayer({ source: workSource, style: workLotStyle });

  landLayer.setZIndex(10);
  workLayer.setZIndex(20);

  const updateLayerOpacity = () => {
    if (authStore.role === "SITE_ADMIN") {
      landLayer.setOpacity(1);
      workLayer.setOpacity(0.45);
    } else if (authStore.role === "SITE_OFFICER") {
      landLayer.setOpacity(0.45);
      workLayer.setOpacity(1);
    } else {
      landLayer.setOpacity(0.35);
      workLayer.setOpacity(0.7);
    }
  };

  const updateLayerVisibility = (basemapLayer, labelLayer) => {
    if (basemapLayer) basemapLayer.setVisible(uiStore.showBasemap);
    if (labelLayer) labelLayer.setVisible(uiStore.showLabels);
    landLayer.setVisible(uiStore.showLandLots);
    workLayer.setVisible(uiStore.showWorkLots);
  };

  const createLandFeature = (lot) => {
    if (!lot?.geometry) return null;
    const feature = format.readFeature(
      {
        type: "Feature",
        geometry: lot.geometry,
        properties: {
          lotNumber: lot.lotNumber,
          status: lot.status,
        },
      },
      { dataProjection: EPSG_2326, featureProjection: EPSG_2326 }
    );
    feature.setId(lot.id);
    feature.set("layerType", "land");
    feature.set("refId", lot.id);
    return feature;
  };

  const createWorkFeature = (lot) => {
    if (!lot?.geometry) return null;
    const taskAlert = getWorkLotTaskAlert(taskStore.tasks, lot.id);
    const feature = format.readFeature(
      {
        type: "Feature",
        geometry: lot.geometry,
        properties: {
          operatorName: lot.operatorName,
          status: lot.status,
          taskAlert,
        },
      },
      { dataProjection: EPSG_2326, featureProjection: EPSG_2326 }
    );
    feature.setId(lot.id);
    feature.set("layerType", "work");
    feature.set("refId", lot.id);
    feature.set("taskAlert", taskAlert);
    return feature;
  };

  const refreshLandSource = () => {
    landSource.clear(true);
    landLotStore.landLots
      .map(createLandFeature)
      .filter(Boolean)
      .forEach((feature) => landSource.addFeature(feature));
  };

  const refreshWorkSource = () => {
    workSource.clear(true);
    workLotStore.workLots
      .map(createWorkFeature)
      .filter(Boolean)
      .forEach((feature) => workSource.addFeature(feature));
  };

  return {
    format,
    landSource,
    workSource,
    landLayer,
    workLayer,
    updateLayerOpacity,
    updateLayerVisibility,
    createLandFeature,
    createWorkFeature,
    refreshLandSource,
    refreshWorkSource,
  };
};
