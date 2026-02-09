import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { intLandStyle, siteBoundaryStyle, workLotStyle } from "../ol/styles";
import { EPSG_2326 } from "../ol/projection";
import { getWorkLotTaskAlert } from "../utils/taskUtils";
import { INT_LAND_GEOJSON_URL, SITE_BOUNDARY_GEOJSON_URL } from "../../../shared/config/mapApi";

export const useMapLayers = ({
  workLotStore,
  taskStore,
  authStore,
  uiStore,
}) => {
  const normalizeFeatureId = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized.length ? normalized : null;
  };

  const format = new GeoJSON();

  const workSource = new VectorSource();
  const intLandSource = new VectorSource();
  const siteBoundarySource = new VectorSource();

  const workLayer = new VectorLayer({ source: workSource, style: workLotStyle });
  const intLandLayer = new VectorLayer({ source: intLandSource, style: intLandStyle });
  const siteBoundaryLayer = new VectorLayer({
    source: siteBoundarySource,
    style: siteBoundaryStyle,
  });

  intLandLayer.setZIndex(12);
  siteBoundaryLayer.setZIndex(14);
  workLayer.setZIndex(20);

  const updateLayerOpacity = () => {
    if (authStore.role === "SITE_ADMIN" || authStore.role === "SITE_OFFICER") {
      workLayer.setOpacity(1);
    } else {
      workLayer.setOpacity(0.8);
    }
  };

  const updateLayerVisibility = (basemapLayer, labelLayer) => {
    if (basemapLayer) basemapLayer.setVisible(uiStore.showBasemap);
    if (labelLayer) labelLayer.setVisible(uiStore.showLabels);
    intLandLayer.setVisible(uiStore.showIntLand);
    siteBoundaryLayer.setVisible(uiStore.showSiteBoundary);
    workLayer.setVisible(uiStore.showWorkLots);
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
        throw new Error(`Failed to load Drawing Layer GeoJSON: ${response.status}`);
      }
      const data = await response.json();
      const features = format.readFeatures(data, {
        dataProjection: EPSG_2326,
        featureProjection: EPSG_2326,
      });
      intLandSource.clear(true);
      intLandSource.addFeatures(features);
    } catch (error) {
      console.warn("[map] Drawing Layer load failed", error);
    }
  };

  const loadSiteBoundaryGeojson = async () => {
    try {
      const response = await fetch(SITE_BOUNDARY_GEOJSON_URL, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load Site Boundary GeoJSON: ${response.status}`);
      }
      const data = await response.json();
      const features = format.readFeatures(data, {
        dataProjection: EPSG_2326,
        featureProjection: EPSG_2326,
      });
      features.forEach((feature, index) => {
        const id =
          normalizeFeatureId(feature.getId()) ||
          normalizeFeatureId(feature.get("id")) ||
          normalizeFeatureId(feature.get("handle")) ||
          `SB-${index + 1}`;
        feature.setId(id);
        feature.set("layerType", "siteBoundary");
        feature.set("refId", id);
        feature.set("name", feature.get("name") ?? "Site Boundary");
        const geometry = feature.getGeometry();
        if (geometry && typeof geometry.getArea === "function") {
          feature.set("area", geometry.getArea());
        }
      });
      siteBoundarySource.clear(true);
      siteBoundarySource.addFeatures(features);
    } catch (error) {
      console.warn("[map] Site Boundary load failed", error);
    }
  };

  return {
    format,
    workSource,
    intLandSource,
    siteBoundarySource,
    workLayer,
    intLandLayer,
    siteBoundaryLayer,
    updateLayerOpacity,
    updateLayerVisibility,
    createWorkFeature,
    refreshWorkSource,
    loadIntLandGeojson,
    loadSiteBoundaryGeojson,
  };
};
