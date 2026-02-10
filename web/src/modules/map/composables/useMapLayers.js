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
  buildSiteBoundarySourceRef,
  buildWorkLotsByBoundary,
  defaultSiteBoundaryName,
  summarizeSiteBoundary,
} from "../../../shared/utils/siteBoundary";
import { generateLandId } from "../../../shared/utils/id";
import {
  INT_LAND_GEOJSON_URL,
  SITE_BOUNDARY_GEOJSON_URL,
} from "../../../shared/config/mapApi";

export const useMapLayers = ({
  workLotStore,
  authStore,
  uiStore,
  siteBoundaryStore,
}) => {
  const normalizeFeatureId = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized.length ? normalized : null;
  };

  const format = new GeoJSON();

  const workBusinessSource = new VectorSource();
  const workHouseholdSource = new VectorSource();
  const workGovernmentSource = new VectorSource();
  const intLandSource = new VectorSource();
  const siteBoundarySource = new VectorSource();

  const workBusinessLayer = new VectorLayer({
    source: workBusinessSource,
    style: workLotStyle,
  });
  const workHouseholdLayer = new VectorLayer({
    source: workHouseholdSource,
    style: workLotStyle,
  });
  const workGovernmentLayer = new VectorLayer({
    source: workGovernmentSource,
    style: workLotStyle,
  });
  const intLandLayer = new VectorLayer({ source: intLandSource, style: intLandStyle });
  const siteBoundaryLayer = new VectorLayer({
    source: siteBoundarySource,
    style: siteBoundaryStyle,
  });

  workBusinessLayer.set("workCategory", WORK_LOT_CATEGORY.BU);
  workHouseholdLayer.set("workCategory", WORK_LOT_CATEGORY.HH);
  workGovernmentLayer.set("workCategory", WORK_LOT_CATEGORY.GL);

  intLandLayer.setZIndex(12);
  siteBoundaryLayer.setZIndex(14);
  workBusinessLayer.setZIndex(20);
  workHouseholdLayer.setZIndex(21);
  workGovernmentLayer.setZIndex(22);

  const workSources = [workBusinessSource, workHouseholdSource, workGovernmentSource];
  const workLayers = [workBusinessLayer, workHouseholdLayer, workGovernmentLayer];

  const updateLayerOpacity = () => {
    const opacity = authStore.role === "SITE_ADMIN" || authStore.role === "SITE_OFFICER" ? 1 : 0.8;
    workBusinessLayer.setOpacity(opacity);
    workHouseholdLayer.setOpacity(opacity);
    workGovernmentLayer.setOpacity(opacity);
  };

  const updateLayerVisibility = (basemapLayer, labelLayer) => {
    if (basemapLayer) basemapLayer.setVisible(uiStore.showBasemap);
    if (labelLayer) labelLayer.setVisible(uiStore.showLabels);
    intLandLayer.setVisible(uiStore.showIntLand);
    siteBoundaryLayer.setVisible(uiStore.showSiteBoundary);
    const showGroup = uiStore.showWorkLots;
    workBusinessLayer.setVisible(showGroup && uiStore.showWorkLotsBusiness);
    workHouseholdLayer.setVisible(showGroup && uiStore.showWorkLotsDomestic);
    workGovernmentLayer.setVisible(showGroup && uiStore.showWorkLotsGovernment);
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
          assessDate: lot.assessDate,
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
    category === WORK_LOT_CATEGORY.HH
      ? workHouseholdSource
      : category === WORK_LOT_CATEGORY.GL
        ? workGovernmentSource
        : workBusinessSource;

  const getBoundaryMetaById = (id, boundaryById = null) => {
    if (!siteBoundaryStore) return null;
    const lookup = boundaryById || siteBoundaryStore.byId;
    const normalized = String(id);
    return (
      lookup.get(normalized) ||
      lookup.get(normalized.toUpperCase()) ||
      lookup.get(normalized.toLowerCase()) ||
      null
    );
  };

  const getBoundaryMetaBySourceRef = (sourceRef, boundaryBySourceRef = null) => {
    if (!siteBoundaryStore || !sourceRef) return null;
    const normalized = String(sourceRef).trim().toLowerCase();
    if (!normalized) return null;
    const lookup =
      boundaryBySourceRef ||
      siteBoundaryStore.siteBoundaries.reduce((map, boundary, index) => {
        const key = String(
          boundary?.sourceRef ?? buildSiteBoundarySourceRef(boundary, index)
        )
          .trim()
          .toLowerCase();
        if (key) {
          map.set(key, boundary);
        }
        return map;
      }, new Map());
    return lookup.get(normalized) || null;
  };

  const refreshSiteBoundaryState = () => {
    const boundaryById = siteBoundaryStore?.byId || new Map();
    const workLotsByBoundary = buildWorkLotsByBoundary(workLotStore.workLots);
    siteBoundarySource.getFeatures().forEach((feature) => {
      const id = String(feature.getId() ?? feature.get("refId") ?? "");
      if (!id) return;
      const boundaryMeta = getBoundaryMetaById(id, boundaryById);
      const summary = summarizeSiteBoundary(
        {
          plannedHandoverDate:
            boundaryMeta?.plannedHandoverDate ?? feature.get("plannedHandoverDate") ?? "",
          completionDate: boundaryMeta?.completionDate ?? feature.get("completionDate") ?? "",
        },
        workLotsByBoundary.get(id) || []
      );
      feature.set("name", boundaryMeta?.name || feature.get("name") || `Site Boundary ${id}`);
      feature.set(
        "plannedHandoverDate",
        boundaryMeta?.plannedHandoverDate ?? feature.get("plannedHandoverDate") ?? ""
      );
      feature.set("contractNo", boundaryMeta?.contractNo ?? feature.get("contractNo") ?? "");
      feature.set("futureUse", boundaryMeta?.futureUse ?? feature.get("futureUse") ?? "");
      feature.set(
        "completionDate",
        boundaryMeta?.completionDate ?? feature.get("completionDate") ?? ""
      );
      feature.set("others", boundaryMeta?.others ?? feature.get("others") ?? "");
      feature.set("kpiStatus", summary.statusKey);
      feature.set("handoverProgress", summary.progressPercent);
      feature.set("operatorTotal", summary.totalOperators);
      feature.set("operatorCompleted", summary.completedOperators);
      feature.set("overdue", summary.overdue);
      feature.set("requiresForceEviction", summary.requiresForceEviction);
      feature.set("minFloatMonths", summary.minFloatMonths);
      feature.set("boundaryStatus", summary.status);
      feature.set("categoryAreasHectare", summary.categoryAreasHectare);
    });
    siteBoundarySource.changed();
  };

  const refreshWorkSources = () => {
    workBusinessSource.clear(true);
    workHouseholdSource.clear(true);
    workGovernmentSource.clear(true);
    workLotStore.workLots
      .map(createWorkFeature)
      .filter(Boolean)
      .forEach((feature) => {
        const category = feature.get("workCategory");
        getWorkSourceByCategory(category).addFeature(feature);
      });
    refreshSiteBoundaryState();
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
      const boundaryById = siteBoundaryStore?.byId || new Map();
      const boundaryBySourceRef = (siteBoundaryStore?.siteBoundaries || []).reduce(
        (map, boundary, index) => {
          const key = String(
            boundary?.sourceRef ?? buildSiteBoundarySourceRef(boundary, index)
          )
            .trim()
            .toLowerCase();
          if (key) {
            map.set(key, boundary);
          }
          return map;
        },
        new Map()
      );
      const existingIds = new Set((siteBoundaryStore?.siteBoundaries || []).map((item) => item.id));
      features.forEach((feature, index) => {
        const rawId =
          normalizeFeatureId(feature.getId()) ||
          normalizeFeatureId(feature.get("id")) ||
          normalizeFeatureId(feature.get("handle")) ||
          null;
        const sourceRef = buildSiteBoundarySourceRef(
          {
            sourceRef: feature.get("sourceRef") || feature.get("source_ref"),
            handle: feature.get("handle"),
            rawId,
            layer: feature.get("layer"),
            entity: feature.get("entity"),
          },
          index
        );
        const meta =
          getBoundaryMetaBySourceRef(sourceRef, boundaryBySourceRef) ||
          getBoundaryMetaById(rawId, boundaryById);
        const id = String(
          meta?.id || normalizeFeatureId(feature.get("landId") || feature.get("land_id")) || ""
        );
        const assignedId = id || generateLandId(existingIds);
        existingIds.add(String(assignedId).toLowerCase());
        feature.setId(assignedId);
        feature.set("layerType", "siteBoundary");
        feature.set("refId", assignedId);
        feature.set("sourceRef", sourceRef);
        feature.set("landId", assignedId);
        feature.set(
          "name",
          meta?.name || feature.get("name") || defaultSiteBoundaryName(index)
        );
        feature.set(
          "plannedHandoverDate",
          meta?.plannedHandoverDate ||
            feature.get("plannedHandoverDate") ||
            feature.get("handoverDate") ||
            ""
        );
        feature.set("contractNo", meta?.contractNo || feature.get("contractNo") || "");
        feature.set("futureUse", meta?.futureUse || feature.get("futureUse") || "");
        feature.set("completionDate", meta?.completionDate || feature.get("completionDate") || "");
        feature.set("others", meta?.others || feature.get("others") || "");
        const geometry = feature.getGeometry();
        if (geometry && typeof geometry.getArea === "function") {
          feature.set("area", geometry.getArea());
        }
      });
      siteBoundarySource.clear(true);
      siteBoundarySource.addFeatures(features);
      refreshSiteBoundaryState();
    } catch (error) {
      console.warn("[map] Site Boundary load failed", error);
    }
  };

  return {
    format,
    workBusinessSource,
    workHouseholdSource,
    workGovernmentSource,
    workSources,
    intLandSource,
    siteBoundarySource,
    workBusinessLayer,
    workHouseholdLayer,
    workGovernmentLayer,
    workLayers,
    intLandLayer,
    siteBoundaryLayer,
    updateLayerOpacity,
    updateLayerVisibility,
    createWorkFeature,
    refreshWorkSources,
    getWorkFeatureById,
    refreshSiteBoundaryState,
    loadIntLandGeojson,
    loadSiteBoundaryGeojson,
  };
};
