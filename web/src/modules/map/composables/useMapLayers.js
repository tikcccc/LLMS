import GeoJSON from "ol/format/GeoJSON";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {
  intLandStyle as baseIntLandStyle,
  partOfSitesStyle as basePartOfSitesStyle,
  sectionStyle as baseSectionStyle,
  siteBoundaryStyle as baseSiteBoundaryStyle,
  workLotStyle as baseWorkLotStyle,
} from "../ol/styles";
import { EPSG_2326 } from "../ol/projection";
import {
  normalizeWorkLotCategory,
  WORK_LOT_CATEGORY,
} from "../../../shared/utils/worklot";
import {
  CONTRACT_PACKAGE,
} from "../../../shared/utils/contractPackage";
import {
  getPartOfSitesLotId,
  getSectionLotId,
  isFeatureSelectedInFilter,
  isPolygonalFeature,
  normalizeFeatureId,
  normalizePartOfSitesId,
  normalizeSectionId,
} from "../utils/layerFeatureHelpers";
import { useMapFeatureNormalization } from "./useMapFeatureNormalization";
import { useMapLayerVisibility } from "./useMapLayerVisibility";
import { useMapLayerDataIO } from "./useMapLayerDataIO";
import { useMapSiteBoundarySourceState } from "./useMapSiteBoundarySourceState";

export const useMapLayers = ({
  workLotStore,
  authStore,
  uiStore,
  siteBoundaryStore,
  partOfSitesStore,
  sectionsStore,
}) => {
  const format = new GeoJSON();

  const workBusinessSource = new VectorSource();
  const workHouseholdSource = new VectorSource();
  const workGovernmentSource = new VectorSource();
  const intLandSource = new VectorSource();
  const partOfSitesSource = new VectorSource();
  const sectionsSource = new VectorSource();
  const siteBoundarySource = new VectorSource();
  const {
    normalizeContractPackageValue,
    resolveContractPackageValue,
    isContractPackageVisible,
    normalizePartOfSitesFeature,
    normalizeSectionFeature,
  } = useMapFeatureNormalization({
    partOfSitesStore,
    sectionsStore,
  });

  const applyPartOfSitesFeaturesToSource = (features = []) => {
    partOfSitesSource.clear(true);
    if (Array.isArray(features) && features.length > 0) {
      partOfSitesSource.addFeatures(features);
    }
    refreshLayerFilters();
  };
  const applySectionsFeaturesToSource = (features = []) => {
    sectionsSource.clear(true);
    if (Array.isArray(features) && features.length > 0) {
      sectionsSource.addFeatures(features);
    }
    refreshLayerFilters();
  };
  const {
    workLayerStyle,
    siteBoundaryLayerStyle,
    partOfSitesLayerStyle,
    sectionsLayerStyle,
    updateLayerVisibilityForLayers,
    refreshLayerFiltersForLayers,
  } = useMapLayerVisibility({
    uiStore,
    normalizeContractPackageValue,
    isContractPackageVisible,
    normalizeWorkLotCategory,
    workLotCategory: WORK_LOT_CATEGORY,
    isFeatureSelectedInFilter,
    getPartOfSitesLotId,
    getSectionLotId,
    baseWorkLotStyle,
    baseSiteBoundaryStyle,
    basePartOfSitesStyle,
    baseSectionStyle,
  });

  const workBusinessLayer = new VectorLayer({
    source: workBusinessSource,
    style: workLayerStyle,
  });
  const workHouseholdLayer = new VectorLayer({
    source: workHouseholdSource,
    style: workLayerStyle,
  });
  const workGovernmentLayer = new VectorLayer({
    source: workGovernmentSource,
    style: workLayerStyle,
  });
  const intLandLayer = new VectorLayer({
    source: intLandSource,
    style: baseIntLandStyle,
  });
  const partOfSitesLayer = new VectorLayer({
    source: partOfSitesSource,
    style: partOfSitesLayerStyle,
  });
  const sectionsLayer = new VectorLayer({
    source: sectionsSource,
    style: sectionsLayerStyle,
  });
  const siteBoundaryLayer = new VectorLayer({
    source: siteBoundarySource,
    style: siteBoundaryLayerStyle,
  });

  workBusinessLayer.set("workCategory", WORK_LOT_CATEGORY.BU);
  workHouseholdLayer.set("workCategory", WORK_LOT_CATEGORY.HH);
  workGovernmentLayer.set("workCategory", WORK_LOT_CATEGORY.GL);

  intLandLayer.setZIndex(12);
  partOfSitesLayer.setZIndex(13);
  sectionsLayer.setZIndex(14);
  siteBoundaryLayer.setZIndex(15);
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
    updateLayerVisibilityForLayers({
      basemapLayer,
      labelLayer,
      intLandLayer,
      partOfSitesLayer,
      sectionsLayer,
      siteBoundaryLayer,
      workBusinessLayer,
      workHouseholdLayer,
      workGovernmentLayer,
    });
  };

  const refreshLayerFilters = () => {
    refreshLayerFiltersForLayers({
      workBusinessLayer,
      workHouseholdLayer,
      workGovernmentLayer,
      siteBoundaryLayer,
      partOfSitesLayer,
      sectionsLayer,
    });
  };

  const createWorkFeature = (lot) => {
    if (!lot?.geometry) return null;
    const workCategory = normalizeWorkLotCategory(lot.category ?? lot.type);
    const contractPackage = resolveContractPackageValue(
      [
        lot.contractPackage,
        lot.contract_package,
        lot.phase,
        lot.package,
        lot.contractNo,
      ],
      CONTRACT_PACKAGE.C2
    );
    const feature = format.readFeature(
      {
        type: "Feature",
        geometry: lot.geometry,
        properties: {
          contractPackage,
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
    feature.set("contractPackage", contractPackage);
    return feature;
  };

  const getWorkSourceByCategory = (category) =>
    category === WORK_LOT_CATEGORY.HH
      ? workHouseholdSource
      : category === WORK_LOT_CATEGORY.GL
        ? workGovernmentSource
        : workBusinessSource;

  const {
    refreshSiteBoundarySource,
    refreshSiteBoundaryState,
    getSiteBoundaryFeatureById,
    setCachedSiteBoundaryFeatures,
  } = useMapSiteBoundarySourceState({
    format,
    siteBoundarySource,
    siteBoundaryStore,
    workLotStore,
    resolveContractPackageValue,
    refreshLayerFilters,
  });

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
    refreshLayerFilters();
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

  const getPartOfSitesFeatureById = (id, contractPackage = "") => {
    const normalizedId = normalizeFeatureId(id);
    if (!normalizedId) return null;
    const lookup = normalizedId.toLowerCase();
    const scopedPackage = normalizeFeatureId(contractPackage)
      ? normalizeContractPackageValue(contractPackage)
      : "";
    return (
      partOfSitesSource
        .getFeatures()
        .find((feature, index) => {
          const featureId = String(getPartOfSitesLotId(feature, index)).trim().toLowerCase();
          if (featureId !== lookup) return false;
          if (!scopedPackage) return true;
          return normalizeContractPackageValue(feature?.get("contractPackage")) === scopedPackage;
        }) || null
    );
  };
  const getSectionFeatureById = (id, contractPackage = "") => {
    const normalizedId = normalizeFeatureId(id);
    if (!normalizedId) return null;
    const lookup = normalizedId.toLowerCase();
    const scopedPackage = normalizeFeatureId(contractPackage)
      ? normalizeContractPackageValue(contractPackage)
      : "";
    return (
      sectionsSource
        .getFeatures()
        .find((feature, index) => {
          const featureId = String(getSectionLotId(feature, index)).trim().toLowerCase();
          if (featureId !== lookup) return false;
          if (!scopedPackage) return true;
          return normalizeContractPackageValue(feature?.get("contractPackage")) === scopedPackage;
        }) || null
    );
  };

  const {
    buildPartOfSitesSnapshot,
    persistPartOfSitesSnapshot,
    exportPartOfSitesSnapshot,
    buildSectionsSnapshot,
    persistSectionsSnapshot,
    exportSectionsSnapshot,
    loadIntLandGeojson,
    loadSiteBoundaryGeojson,
    loadPartOfSitesGeojson,
    loadSectionsGeojson,
  } = useMapLayerDataIO({
    format,
    intLandSource,
    partOfSitesSource,
    sectionsSource,
    authStore,
    partOfSitesStore,
    sectionsStore,
    setCachedSiteBoundaryFeatures,
    refreshSiteBoundarySource,
    applyPartOfSitesFeaturesToSource,
    applySectionsFeaturesToSource,
    normalizeFeatureId,
    normalizePartOfSitesId,
    normalizeSectionId,
    normalizePartOfSitesFeature,
    normalizeSectionFeature,
    isPolygonalFeature,
  });

  return {
    format,
    workBusinessSource,
    workHouseholdSource,
    workGovernmentSource,
    workSources,
    intLandSource,
    partOfSitesSource,
    sectionsSource,
    siteBoundarySource,
    workBusinessLayer,
    workHouseholdLayer,
    workGovernmentLayer,
    workLayers,
    intLandLayer,
    partOfSitesLayer,
    sectionsLayer,
    siteBoundaryLayer,
    updateLayerOpacity,
    updateLayerVisibility,
    refreshLayerFilters,
    createWorkFeature,
    refreshWorkSources,
    getWorkFeatureById,
    getSiteBoundaryFeatureById,
    getPartOfSitesFeatureById,
    getSectionFeatureById,
    refreshSiteBoundarySource,
    refreshSiteBoundaryState,
    loadIntLandGeojson,
    loadPartOfSitesGeojson,
    loadSectionsGeojson,
    loadSiteBoundaryGeojson,
    persistPartOfSitesSnapshot,
    exportPartOfSitesSnapshot,
    persistSectionsSnapshot,
    exportSectionsSnapshot,
  };
};
