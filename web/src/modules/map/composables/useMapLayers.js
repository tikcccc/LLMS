import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { intLandLineStyleFn, intLandStyle, landLotStyle, workLotStyle } from "../ol/styles";
import { EPSG_2326 } from "../ol/projection";
import { getWorkLotTaskAlert } from "../utils/taskUtils";
import {
  INT_LAND_GEOJSON_URL,
  INT_LAND_LABEL_MIN_AREA,
  INT_LAND_LINE_MIN_LENGTH,
  INT_LAND_MIN_AREA,
} from "../../../shared/config/mapApi";

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
  const intLandSource = new VectorSource();
  const intLandLineSource = new VectorSource();

  const landLayer = new VectorLayer({ source: landSource, style: landLotStyle });
  const workLayer = new VectorLayer({ source: workSource, style: workLotStyle });
  const intLandLayer = new VectorLayer({ source: intLandSource, style: intLandStyle });
  const intLandLineLayer = new VectorLayer({
    source: intLandLineSource,
    style: intLandLineStyleFn,
  });

  landLayer.setZIndex(10);
  intLandLineLayer.setZIndex(12);
  intLandLayer.setZIndex(15);
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
    intLandLineLayer.setVisible(uiStore.showIntLand);
    intLandLayer.setVisible(uiStore.showIntLand);
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

  const loadIntLandGeojson = async () => {
    try {
      const response = await fetch(INT_LAND_GEOJSON_URL, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load INT Land GeoJSON: ${response.status}`);
      }
      const data = await response.json();
      const features = format.readFeatures(data, {
        dataProjection: EPSG_2326,
        featureProjection: EPSG_2326,
      });
      const polygonFeatures = [];
      const lineFeatures = [];
      features.forEach((feature, index) => {
        const geometry = feature.getGeometry();
        if (!geometry) return;
        const type = geometry.getType();
        if (type === "Polygon" || type === "MultiPolygon") {
          const area = geometry.getArea();
          if (area < INT_LAND_MIN_AREA) return;
          const handle = feature.get("handle");
          const id = handle ? `INT-${handle}` : `INT-${index + 1}`;
          feature.setId(id);
          if (area >= INT_LAND_LABEL_MIN_AREA) {
            feature.set("label", id);
          } else {
            feature.set("label", "");
          }
          feature.set("layerType", "int");
          feature.set("area", area);
          polygonFeatures.push(feature);
          return;
        }
        if (type === "LineString" || type === "MultiLineString") {
          const length = geometry.getLength?.() ?? 0;
          if (length < INT_LAND_LINE_MIN_LENGTH) return;
          lineFeatures.push(feature);
        }
      });
      intLandSource.clear(true);
      intLandLineSource.clear(true);
      intLandSource.addFeatures(polygonFeatures);
      intLandLineSource.addFeatures(lineFeatures);
    } catch (error) {
      console.warn("[map] INT Land layer load failed", error);
    }
  };

  return {
    format,
    landSource,
    workSource,
    intLandSource,
    intLandLineSource,
    landLayer,
    workLayer,
    intLandLayer,
    intLandLineLayer,
    updateLayerOpacity,
    updateLayerVisibility,
    createLandFeature,
    createWorkFeature,
    refreshLandSource,
    refreshWorkSource,
    loadIntLandGeojson,
  };
};
