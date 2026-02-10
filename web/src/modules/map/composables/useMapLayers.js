import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { intLandStyle, siteBoundaryStyle, workLotStyle } from "../ol/styles";
import { EPSG_2326 } from "../ol/projection";
import {
  normalizeWorkLotCategory,
  WORK_LOT_CATEGORY,
} from "../../../shared/utils/worklot";
import {
  INT_LAND_GEOJSON_URL,
  SITE_BOUNDARY_GEOJSON_URL,
} from "../../../shared/config/mapApi";

export const useMapLayers = ({ workLotStore, authStore, uiStore }) => {
  const normalizeFeatureId = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized.length ? normalized : null;
  };

  const format = new GeoJSON();

  const workBusinessSource = new VectorSource();
  const workDomesticSource = new VectorSource();
  const intLandSource = new VectorSource();
  const siteBoundarySource = new VectorSource();

  const workBusinessLayer = new VectorLayer({
    source: workBusinessSource,
    style: workLotStyle,
  });
  const workDomesticLayer = new VectorLayer({
    source: workDomesticSource,
    style: workLotStyle,
  });
  const intLandLayer = new VectorLayer({ source: intLandSource, style: intLandStyle });
  const siteBoundaryLayer = new VectorLayer({
    source: siteBoundarySource,
    style: siteBoundaryStyle,
  });

  workBusinessLayer.set("workCategory", WORK_LOT_CATEGORY.BU);
  workDomesticLayer.set("workCategory", WORK_LOT_CATEGORY.DOMESTIC);

  intLandLayer.setZIndex(12);
  siteBoundaryLayer.setZIndex(14);
  workBusinessLayer.setZIndex(20);
  workDomesticLayer.setZIndex(21);

  const workSources = [workBusinessSource, workDomesticSource];
  const workLayers = [workBusinessLayer, workDomesticLayer];

  const updateLayerOpacity = () => {
    const opacity = authStore.role === "SITE_ADMIN" || authStore.role === "SITE_OFFICER" ? 1 : 0.8;
    workBusinessLayer.setOpacity(opacity);
    workDomesticLayer.setOpacity(opacity);
  };

  const updateLayerVisibility = (basemapLayer, labelLayer) => {
    if (basemapLayer) basemapLayer.setVisible(uiStore.showBasemap);
    if (labelLayer) labelLayer.setVisible(uiStore.showLabels);
    intLandLayer.setVisible(uiStore.showIntLand);
    siteBoundaryLayer.setVisible(uiStore.showSiteBoundary);
    const showGroup = uiStore.showWorkLots;
    workBusinessLayer.setVisible(showGroup && uiStore.showWorkLotsBusiness);
    workDomesticLayer.setVisible(showGroup && uiStore.showWorkLotsDomestic);
  };

  const createWorkFeature = (lot) => {
    if (!lot?.geometry) return null;
    const workCategory = normalizeWorkLotCategory(lot.category ?? lot.type);
    const feature = format.readFeature(
      {
        type: "Feature",
        geometry: lot.geometry,
        properties: {
          operatorName: lot.operatorName,
          status: lot.status,
          workCategory,
          responsiblePerson: lot.responsiblePerson,
          dueDate: lot.dueDate,
          description: lot.description,
          remark: lot.remark,
        },
      },
      { dataProjection: EPSG_2326, featureProjection: EPSG_2326 }
    );
    feature.setId(lot.id);
    feature.set("layerType", "work");
    feature.set("refId", lot.id);
    feature.set("workCategory", workCategory);
    return feature;
  };

  const getWorkSourceByCategory = (category) =>
    category === WORK_LOT_CATEGORY.DOMESTIC ? workDomesticSource : workBusinessSource;

  const refreshWorkSources = () => {
    workBusinessSource.clear(true);
    workDomesticSource.clear(true);
    workLotStore.workLots
      .map(createWorkFeature)
      .filter(Boolean)
      .forEach((feature) => {
        const category = feature.get("workCategory");
        getWorkSourceByCategory(category).addFeature(feature);
      });
  };

  const getWorkFeatureById = (id) => {
    if (id === null || id === undefined) return null;
    const normalized = String(id);
    for (const source of workSources) {
      const found = source.getFeatureById(normalized);
      if (found) return found;
    }
    return null;
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
    workBusinessSource,
    workDomesticSource,
    workSources,
    intLandSource,
    siteBoundarySource,
    workBusinessLayer,
    workDomesticLayer,
    workLayers,
    intLandLayer,
    siteBoundaryLayer,
    updateLayerOpacity,
    updateLayerVisibility,
    createWorkFeature,
    refreshWorkSources,
    getWorkFeatureById,
    loadIntLandGeojson,
    loadSiteBoundaryGeojson,
  };
};
