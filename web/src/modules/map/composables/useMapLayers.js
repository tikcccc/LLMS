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
  buildSiteBoundarySourceRef,
  buildWorkLotsByBoundary,
  summarizeSiteBoundary,
} from "../../../shared/utils/siteBoundary";
import { generateLandId } from "../../../shared/utils/id";
import {
  buildPartOfSitesGeojson,
  downloadPartOfSitesGeojson,
} from "../../../shared/utils/partOfSitesGeojson";
import {
  buildSectionsGeojson,
  downloadSectionsGeojson,
} from "../../../shared/utils/sectionsGeojson";
import {
  INT_LAND_GEOJSON_URL,
  PART_OF_SITES_CACHE_TTL_MS,
  PART_OF_SITES_FILE_CONCURRENCY,
  PART_OF_SITES_INDEX_CONCURRENCY,
  PART_OF_SITES_GEOJSON_INDEX_URL,
  SECTIONS_GEOJSON_INDEX_URL,
  SITE_BOUNDARY_GEOJSON_URL,
  STATIC_JSON_FETCH_CACHE_MODE,
} from "../../../shared/config/mapApi";
import {
  fetchJsonWithCache,
  mapWithConcurrency,
} from "../../../shared/utils/asyncDataLoader";

export const useMapLayers = ({
  workLotStore,
  authStore,
  uiStore,
  siteBoundaryStore,
  partOfSitesStore,
  sectionsStore,
}) => {
  const featureKey = (value) => String(value || "").trim().toLowerCase();
  const normalizeFeatureId = (value) => {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized.length ? normalized : null;
  };
  const normalizePartOfSitesId = (value) => {
    const normalized = normalizeFeatureId(value);
    if (!normalized) return null;
    if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
    return normalized;
  };
  const normalizeSectionId = (value) => {
    const normalized = normalizeFeatureId(value);
    if (!normalized) return null;
    if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
    return normalized;
  };
  const normalizeIdList = (value) => {
    const list = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(",")
        : [value];
    const dedupe = new Set();
    list.forEach((item) => {
      if (item === null || item === undefined) return;
      const normalized = String(item).trim();
      if (!normalized) return;
      dedupe.add(normalized);
    });
    return Array.from(dedupe);
  };
  const buildPartOfSitesSystemId = ({
    groupLabel = "",
    partId = "",
    featureIndex = 0,
  } = {}) => {
    const groupToken =
      normalizeFeatureId(groupLabel)?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "PART";
    const partToken =
      normalizePartOfSitesId(partId)?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "UNK";
    const seq = String(Math.max(0, Number(featureIndex) || 0) + 1).padStart(3, "0");
    return `POS-${groupToken}-${partToken}-${seq}`;
  };
  const buildSectionSystemId = ({
    groupLabel = "",
    sectionId = "",
    featureIndex = 0,
  } = {}) => {
    const groupToken =
      normalizeFeatureId(groupLabel)?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "SEC";
    const sectionToken =
      normalizeSectionId(sectionId)?.replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "UNK";
    const seq = String(Math.max(0, Number(featureIndex) || 0) + 1).padStart(3, "0");
    return `SOW-${groupToken}-${sectionToken}-${seq}`;
  };
  const isFeatureSelectedInFilter = (mode, selectedIds = [], id) => {
    if (mode !== "custom") return true;
    const normalized = normalizeFeatureId(id);
    if (!normalized) return false;
    const normalizedLower = normalized.toLowerCase();
    return selectedIds.some(
      (item) => String(item || "").trim().toLowerCase() === normalizedLower
    );
  };
  const getPartOfSitesLotId = (feature, index = 0) =>
    normalizePartOfSitesId(feature?.get("partId")) ||
    normalizePartOfSitesId(feature?.get("part_id")) ||
    normalizePartOfSitesId(feature?.get("partOfSitesLotId")) ||
    normalizeFeatureId(feature?.get("refId")) ||
    normalizeFeatureId(feature?.getId?.()) ||
    normalizeFeatureId(feature?.get("id")) ||
    normalizeFeatureId(feature?.get("handle")) ||
    `part_of_site_${String(index + 1).padStart(5, "0")}`;
  const getSectionLotId = (feature, index = 0) =>
    normalizeSectionId(feature?.get("sectionId")) ||
    normalizeSectionId(feature?.get("section_id")) ||
    normalizeSectionId(feature?.get("sectionLotId")) ||
    normalizeSectionId(feature?.get("refId")) ||
    normalizeSectionId(feature?.getId?.()) ||
    normalizeSectionId(feature?.get("id")) ||
    normalizeSectionId(feature?.get("handle")) ||
    `section_${String(index + 1).padStart(5, "0")}`;

  const format = new GeoJSON();

  const workBusinessSource = new VectorSource();
  const workHouseholdSource = new VectorSource();
  const workGovernmentSource = new VectorSource();
  const intLandSource = new VectorSource();
  const partOfSitesSource = new VectorSource();
  const sectionsSource = new VectorSource();
  const siteBoundarySource = new VectorSource();
  const normalizePartOfSitesFeature = (
    feature,
    {
      groupLabelHint = "",
      partIdHint = "",
      partLabelHint = "",
      featureIndex = 0,
    } = {}
  ) => {
    const lotId =
      normalizePartOfSitesId(feature?.get("partId")) ||
      normalizePartOfSitesId(feature?.get("part_id")) ||
      normalizePartOfSitesId(feature?.get("partOfSitesLotId")) ||
      normalizePartOfSitesId(partIdHint) ||
      getPartOfSitesLotId(feature, featureIndex);
    const groupLabel =
      normalizeFeatureId(feature?.get("partOfSitesGroup")) ||
      normalizeFeatureId(feature?.get("partGroup")) ||
      normalizeFeatureId(groupLabelHint) ||
      "Manual Draw";
    const lotLabel =
      normalizeFeatureId(feature?.get("partOfSitesLotLabel")) ||
      normalizeFeatureId(feature?.get("partId")) ||
      normalizeFeatureId(partLabelHint) ||
      lotId;
    const systemId =
      normalizeFeatureId(feature?.get("partOfSitesSystemId")) ||
      normalizeFeatureId(feature?.get("systemId")) ||
      normalizeFeatureId(feature?.getId?.()) ||
      buildPartOfSitesSystemId({
        groupLabel,
        partId: lotId,
        featureIndex,
      });

    feature.setId(systemId);
    feature.set("partId", lotId);
    feature.set("partGroup", groupLabel);
    feature.set("partOfSitesLotId", lotId);
    feature.set("partOfSitesLotLabel", lotLabel);
    feature.set("partOfSitesSystemId", systemId);
    feature.set("partOfSitesGroup", groupLabel);
    feature.unset("name", true);
    feature.set(
      "accessDate",
      normalizeFeatureId(feature.get("accessDate") || feature.get("access_date")) || ""
    );
    feature.set("layerType", "partOfSites");
    feature.set("refId", lotId);
    return feature;
  };
  const normalizeSectionFeature = (
    feature,
    {
      groupLabelHint = "",
      sectionIdHint = "",
      sectionLabelHint = "",
      featureIndex = 0,
    } = {}
  ) => {
    const sectionId =
      normalizeSectionId(feature?.get("sectionId")) ||
      normalizeSectionId(feature?.get("section_id")) ||
      normalizeSectionId(feature?.get("sectionLotId")) ||
      normalizeSectionId(sectionIdHint) ||
      getSectionLotId(feature, featureIndex);
    const groupLabel =
      normalizeFeatureId(feature?.get("sectionGroup")) ||
      normalizeFeatureId(feature?.get("section_group")) ||
      normalizeFeatureId(groupLabelHint) ||
      "Manual Draw";
    const sectionLabel =
      normalizeFeatureId(feature?.get("sectionLotLabel")) ||
      normalizeFeatureId(feature?.get("sectionLabel")) ||
      normalizeFeatureId(sectionLabelHint) ||
      sectionId;
    const systemId =
      normalizeFeatureId(feature?.get("sectionSystemId")) ||
      normalizeFeatureId(feature?.get("systemId")) ||
      normalizeFeatureId(feature?.getId?.()) ||
      buildSectionSystemId({
        groupLabel,
        sectionId,
        featureIndex,
      });

    const explicitRelatedPartIds = normalizeIdList(
      feature?.get("relatedPartIds") ||
        feature?.get("relatedPartLotIds") ||
        feature?.get("partIds")
    );

    feature.setId(systemId);
    feature.set("sectionId", sectionId);
    feature.set("sectionGroup", groupLabel);
    feature.set("sectionLotId", sectionId);
    feature.set("sectionLotLabel", sectionLabel);
    feature.set("sectionSystemId", systemId);
    feature.set(
      "completionDate",
      normalizeFeatureId(feature.get("completionDate") || feature.get("completion_date")) || ""
    );
    feature.set("relatedPartIds", explicitRelatedPartIds);
    feature.set("partCount", explicitRelatedPartIds.length);
    feature.set("layerType", "section");
    feature.set("refId", sectionId);
    return feature;
  };

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

  const buildPartOfSitesSnapshot = ({ source = "map-edit" } = {}) => {
    const snapshotFeatureCollection = format.writeFeaturesObject(
      partOfSitesSource.getFeatures(),
      {
        dataProjection: EPSG_2326,
        featureProjection: EPSG_2326,
      }
    );
    return buildPartOfSitesGeojson(snapshotFeatureCollection?.features || [], {
      source,
      savedBy: authStore?.roleName || "",
    });
  };

  const persistPartOfSitesSnapshot = ({ source = "map-edit" } = {}) => {
    if (!partOfSitesStore) return null;
    const snapshot = buildPartOfSitesSnapshot({ source });
    partOfSitesStore.saveSnapshotGeojson(snapshot);
    return snapshot;
  };

  const exportPartOfSitesSnapshot = (filename = "part-of-sites-map.geojson") =>
    downloadPartOfSitesGeojson(buildPartOfSitesSnapshot({ source: "map-export" }), filename);
  const buildSectionsSnapshot = ({ source = "map-edit" } = {}) => {
    const snapshotFeatureCollection = format.writeFeaturesObject(
      sectionsSource.getFeatures(),
      {
        dataProjection: EPSG_2326,
        featureProjection: EPSG_2326,
      }
    );
    return buildSectionsGeojson(snapshotFeatureCollection?.features || [], {
      source,
      savedBy: authStore?.roleName || "",
    });
  };

  const persistSectionsSnapshot = ({ source = "map-edit" } = {}) => {
    if (!sectionsStore) return null;
    const snapshot = buildSectionsSnapshot({ source });
    sectionsStore.saveSnapshotGeojson(snapshot);
    return snapshot;
  };

  const exportSectionsSnapshot = (filename = "sections-map.geojson") =>
    downloadSectionsGeojson(buildSectionsSnapshot({ source: "map-export" }), filename);

  const isWorkFeatureVisible = (feature) => {
    if (!uiStore.showWorkLots) return false;
    const category = normalizeWorkLotCategory(
      feature?.get("workCategory") || feature?.get("category")
    );
    if (category === WORK_LOT_CATEGORY.BU && !uiStore.showWorkLotsBusiness) return false;
    if (category === WORK_LOT_CATEGORY.HH && !uiStore.showWorkLotsDomestic) return false;
    if (category === WORK_LOT_CATEGORY.GL && !uiStore.showWorkLotsGovernment) return false;
    const workLotId = feature?.get("refId") || feature?.getId();
    return isFeatureSelectedInFilter(
      uiStore.workLotFilterMode,
      uiStore.workLotSelectedIds,
      workLotId
    );
  };

  const isSiteBoundaryFeatureVisible = (feature) => {
    if (!uiStore.showSiteBoundary) return false;
    const boundaryId = feature?.get("refId") || feature?.getId();
    return isFeatureSelectedInFilter(
      uiStore.siteBoundaryFilterMode,
      uiStore.siteBoundarySelectedIds,
      boundaryId
    );
  };

  const isPartOfSitesFeatureVisible = (feature, index = 0) => {
    if (!uiStore.showPartOfSites) return false;
    const lotId = getPartOfSitesLotId(feature, index);
    return isFeatureSelectedInFilter(
      uiStore.partOfSitesFilterMode,
      uiStore.partOfSitesSelectedIds,
      lotId
    );
  };
  const isSectionFeatureVisible = (feature, index = 0) => {
    if (!uiStore.showSections) return false;
    const sectionId = getSectionLotId(feature, index);
    return isFeatureSelectedInFilter(
      uiStore.sectionFilterMode,
      uiStore.sectionSelectedIds,
      sectionId
    );
  };

  const workLayerStyle = (feature) =>
    isWorkFeatureVisible(feature) ? baseWorkLotStyle(feature) : null;
  const siteBoundaryLayerStyle = (feature) =>
    isSiteBoundaryFeatureVisible(feature) ? baseSiteBoundaryStyle(feature) : null;
  const partOfSitesLayerStyle = (feature) =>
    isPartOfSitesFeatureVisible(feature) ? basePartOfSitesStyle(feature) : null;
  const sectionsLayerStyle = (feature) =>
    isSectionFeatureVisible(feature) ? baseSectionStyle(feature) : null;

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
  let cachedSiteBoundaryFeatures = [];

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
    partOfSitesLayer.setVisible(uiStore.showPartOfSites);
    sectionsLayer.setVisible(uiStore.showSections);
    siteBoundaryLayer.setVisible(uiStore.showSiteBoundary);
    const showGroup = uiStore.showWorkLots;
    workBusinessLayer.setVisible(showGroup && uiStore.showWorkLotsBusiness);
    workHouseholdLayer.setVisible(showGroup && uiStore.showWorkLotsDomestic);
    workGovernmentLayer.setVisible(showGroup && uiStore.showWorkLotsGovernment);
  };

  const refreshLayerFilters = () => {
    workBusinessLayer.changed();
    workHouseholdLayer.changed();
    workGovernmentLayer.changed();
    siteBoundaryLayer.changed();
    partOfSitesLayer.changed();
    sectionsLayer.changed();
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

  const cloneSiteBoundaryGeometry = (feature) => {
    const geometry = feature?.getGeometry?.();
    return geometry ? geometry.clone() : null;
  };

  const buildSourceRefFromFeature = (feature, index = 0) =>
    buildSiteBoundarySourceRef(
      {
        sourceRef: feature?.get("sourceRef") || feature?.get("source_ref"),
        handle: feature?.get("handle"),
        rawId:
          normalizeFeatureId(feature?.getId?.()) ||
          normalizeFeatureId(feature?.get?.("id")) ||
          normalizeFeatureId(feature?.get?.("handle")) ||
          null,
        layer: feature?.get("layer"),
        entity: feature?.get("entity"),
      },
      index
    );

  const buildFallbackFeatureLookup = (features = []) => {
    const byId = new Map();
    const bySourceRef = new Map();
    (Array.isArray(features) ? features : []).forEach((feature, index) => {
      const rawId =
        normalizeFeatureId(feature.getId?.()) ||
        normalizeFeatureId(feature.get("landId") || feature.get("land_id")) ||
        normalizeFeatureId(feature.get("id")) ||
        normalizeFeatureId(feature.get("handle")) ||
        null;
      const sourceRef = buildSourceRefFromFeature(feature, index);
      if (rawId) {
        byId.set(featureKey(rawId), feature);
      }
      if (sourceRef) {
        bySourceRef.set(featureKey(sourceRef), feature);
      }
    });
    return { byId, bySourceRef };
  };

  const createSiteBoundaryFeatureFromRaw = (
    rawFeature,
    index,
    boundaryById,
    boundaryBySourceRef,
    existingIds
  ) => {
    const rawId =
      normalizeFeatureId(rawFeature.getId()) ||
      normalizeFeatureId(rawFeature.get("id")) ||
      normalizeFeatureId(rawFeature.get("handle")) ||
      null;
    const sourceRef = buildSourceRefFromFeature(rawFeature, index);
    const meta =
      getBoundaryMetaBySourceRef(sourceRef, boundaryBySourceRef) ||
      getBoundaryMetaById(rawId, boundaryById);
    const id = String(
      meta?.id || normalizeFeatureId(rawFeature.get("landId") || rawFeature.get("land_id")) || ""
    );
    const assignedId = id || generateLandId(existingIds);
    existingIds.add(featureKey(assignedId));
    const feature = rawFeature.clone();
    feature.setId(assignedId);
    feature.set("layerType", "siteBoundary");
    feature.set("refId", assignedId);
    feature.set("sourceRef", sourceRef);
    feature.set("landId", assignedId);
    feature.set("name", meta?.name ?? rawFeature.get("name") ?? "");
    feature.set(
      "plannedHandoverDate",
      meta?.plannedHandoverDate ||
        rawFeature.get("plannedHandoverDate") ||
        rawFeature.get("handoverDate") ||
        ""
    );
    feature.set("contractNo", meta?.contractNo || rawFeature.get("contractNo") || "");
    feature.set("futureUse", meta?.futureUse || rawFeature.get("futureUse") || "");
    feature.set("completionDate", meta?.completionDate || rawFeature.get("completionDate") || "");
    feature.set("others", meta?.others || rawFeature.get("others") || "");
    const geometry = feature.getGeometry();
    if (geometry && typeof geometry.getArea === "function") {
      feature.set("area", geometry.getArea());
    }
    return feature;
  };

  const createSiteBoundaryFeatureFromStore = (
    boundary,
    index,
    fallbackById,
    fallbackBySourceRef,
    existingIds
  ) => {
    const sourceRef = buildSiteBoundarySourceRef(boundary, index);
    const fallbackFeature =
      fallbackBySourceRef.get(featureKey(sourceRef)) ||
      fallbackById.get(featureKey(boundary?.id)) ||
      null;
    let boundaryGeometry = null;
    if (boundary?.geometry && boundary.geometry.type && Array.isArray(boundary.geometry.coordinates)) {
      try {
        boundaryGeometry = format.readGeometry(boundary.geometry, {
          dataProjection: EPSG_2326,
          featureProjection: EPSG_2326,
        });
      } catch (error) {
        console.warn("[map] invalid site boundary geometry in store", error);
      }
    }
    const fallbackGeometry = cloneSiteBoundaryGeometry(fallbackFeature);
    const geometry = boundaryGeometry || fallbackGeometry;
    if (!geometry) return null;

    const id = normalizeFeatureId(boundary?.id) || generateLandId(existingIds);
    existingIds.add(featureKey(id));
    const feature = format.readFeature(
      {
        type: "Feature",
        geometry: format.writeGeometryObject(geometry, {
          dataProjection: EPSG_2326,
          featureProjection: EPSG_2326,
        }),
        properties: {},
      },
      { dataProjection: EPSG_2326, featureProjection: EPSG_2326 }
    );
    feature.setId(id);
    feature.set("layerType", "siteBoundary");
    feature.set("refId", id);
    feature.set("sourceRef", sourceRef);
    feature.set("landId", id);
    feature.set("name", boundary?.name ?? fallbackFeature?.get("name") ?? "");
    feature.set(
      "layer",
      boundary?.layer ?? fallbackFeature?.get("layer") ?? "—"
    );
    feature.set(
      "entity",
      boundary?.entity ?? fallbackFeature?.get("entity") ?? "Polygon"
    );
    feature.set(
      "plannedHandoverDate",
      boundary?.plannedHandoverDate ??
        fallbackFeature?.get("plannedHandoverDate") ??
        fallbackFeature?.get("handoverDate") ??
        ""
    );
    feature.set("contractNo", boundary?.contractNo ?? fallbackFeature?.get("contractNo") ?? "");
    feature.set("futureUse", boundary?.futureUse ?? fallbackFeature?.get("futureUse") ?? "");
    feature.set(
      "completionDate",
      boundary?.completionDate ?? fallbackFeature?.get("completionDate") ?? ""
    );
    feature.set("others", boundary?.others ?? fallbackFeature?.get("others") ?? "");

    const featureGeometry = feature.getGeometry();
    const geometryArea =
      featureGeometry && typeof featureGeometry.getArea === "function"
        ? featureGeometry.getArea()
        : 0;
    const area =
      Number.isFinite(Number(boundary?.area)) && Number(boundary?.area) > 0
        ? Number(boundary.area)
        : geometryArea;
    feature.set("area", area);
    return feature;
  };

  const refreshSiteBoundarySource = () => {
    const boundaryById = siteBoundaryStore?.byId || new Map();
    const boundaryBySourceRef = (siteBoundaryStore?.siteBoundaries || []).reduce(
      (map, boundary, index) => {
        const key = featureKey(boundary?.sourceRef ?? buildSiteBoundarySourceRef(boundary, index));
        if (key) {
          map.set(key, boundary);
        }
        return map;
      },
      new Map()
    );
    const existingIds = new Set();

    let features = [];
    if ((siteBoundaryStore?.siteBoundaries || []).length > 0) {
      const { byId: fallbackById, bySourceRef: fallbackBySourceRef } =
        buildFallbackFeatureLookup(cachedSiteBoundaryFeatures);
      features = siteBoundaryStore.siteBoundaries
        .map((boundary, index) =>
          createSiteBoundaryFeatureFromStore(
            boundary,
            index,
            fallbackById,
            fallbackBySourceRef,
            existingIds
          )
        )
        .filter(Boolean);
    } else {
      features = cachedSiteBoundaryFeatures.map((feature, index) =>
        createSiteBoundaryFeatureFromRaw(
          feature,
          index,
          boundaryById,
          boundaryBySourceRef,
          existingIds
        )
      );
    }

    siteBoundarySource.clear(true);
    if (features.length > 0) {
      siteBoundarySource.addFeatures(features);
    }
    refreshSiteBoundaryState();
    refreshLayerFilters();
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
      feature.set("name", boundaryMeta?.name ?? feature.get("name") ?? "");
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

  const getSiteBoundaryFeatureById = (id) => {
    if (id === null || id === undefined) return null;
    const normalized = String(id);
    return (
      siteBoundarySource.getFeatureById(normalized) ||
      siteBoundarySource.getFeatureById(normalized.toUpperCase()) ||
      siteBoundarySource.getFeatureById(normalized.toLowerCase()) ||
      null
    );
  };

  const getPartOfSitesFeatureById = (id) => {
    const normalizedId = normalizeFeatureId(id);
    if (!normalizedId) return null;
    const lookup = normalizedId.toLowerCase();
    return (
      partOfSitesSource
        .getFeatures()
        .find((feature, index) => {
          const featureId = String(getPartOfSitesLotId(feature, index)).trim().toLowerCase();
          return featureId === lookup;
        }) || null
    );
  };
  const getSectionFeatureById = (id) => {
    const normalizedId = normalizeFeatureId(id);
    if (!normalizedId) return null;
    const lookup = normalizedId.toLowerCase();
    return (
      sectionsSource
        .getFeatures()
        .find((feature, index) => {
          const featureId = String(getSectionLotId(feature, index)).trim().toLowerCase();
          return featureId === lookup;
        }) || null
    );
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
      cachedSiteBoundaryFeatures = format.readFeatures(data, {
        dataProjection: EPSG_2326,
        featureProjection: EPSG_2326,
      });
      refreshSiteBoundarySource();
    } catch (error) {
      console.warn("[map] Site Boundary load failed", error);
    }
  };

  const loadPartOfSitesGeojson = async () => {
    const fetchJsonOrThrow = async (url, label, { forceRefresh = false } = {}) => {
      try {
        return await fetchJsonWithCache(url, {
          ttlMs: PART_OF_SITES_CACHE_TTL_MS,
          forceRefresh,
          requestCache: STATIC_JSON_FETCH_CACHE_MODE,
        });
      } catch (error) {
        const status = Number(error?.status);
        const detail = Number.isFinite(status) ? status : error?.message || "unknown";
        throw new Error(`Failed to load ${label}: ${detail}`);
      }
    };

    // Always prefer the bundled GeoJSON dataset for part-of-sites.
    // Historical local snapshots can contain stale topology and re-introduce
    // overlap/highlight regressions after algorithm updates.
    if (partOfSitesStore?.hasSnapshot) {
      partOfSitesStore.clearSnapshotGeojson();
    }

    try {
      const rootIndex = await fetchJsonOrThrow(
        PART_OF_SITES_GEOJSON_INDEX_URL,
        "Part of Sites index"
      );
      const groups = Array.isArray(rootIndex?.groups) ? rootIndex.groups : [];
      const groupRecords = await mapWithConcurrency(
        groups,
        async (groupMeta, groupIndex) => {
          const normalizedGroupMeta = groupMeta || {};
          const groupLabel =
            normalizeFeatureId(normalizedGroupMeta.id) ||
            `PART ${String(groupIndex + 1)}`;
          const groupIndexUrl = normalizeFeatureId(normalizedGroupMeta.index);
          if (!groupIndexUrl) return [];
          const groupIndexData = await fetchJsonOrThrow(
            groupIndexUrl,
            `Part of Sites group index (${groupLabel})`
          );
          const items = Array.isArray(groupIndexData?.items) ? groupIndexData.items : [];
          return items.map((item, itemIndex) => ({
            item: item || {},
            itemIndex,
            groupLabel,
          }));
        },
        { concurrency: PART_OF_SITES_INDEX_CONCURRENCY }
      );

      const fileTasks = groupRecords.flat().filter((record) => {
        const fileUrl = normalizeFeatureId(record?.item?.file);
        return Boolean(fileUrl);
      });

      const featureGroups = await mapWithConcurrency(
        fileTasks,
        async (record) => {
          const item = record.item || {};
          const fileUrl = normalizeFeatureId(item.file);
          if (!fileUrl) return [];
          const partIdFromIndex =
            normalizePartOfSitesId(item.id) ||
            `PART_${String(record.itemIndex + 1).padStart(3, "0")}`;
          const partLabelFromIndex = normalizeFeatureId(item.label) || partIdFromIndex;
          const fileData = await fetchJsonOrThrow(
            fileUrl,
            `Part of Sites GeoJSON (${partIdFromIndex})`
          );
          const features = format.readFeatures(fileData, {
            dataProjection: EPSG_2326,
            featureProjection: EPSG_2326,
          });
          features.forEach((feature, featureIndex) => {
            normalizePartOfSitesFeature(feature, {
              groupLabelHint: record.groupLabel,
              partIdHint: partIdFromIndex,
              partLabelHint: partLabelFromIndex,
              featureIndex,
            });
          });
          return features;
        },
        { concurrency: PART_OF_SITES_FILE_CONCURRENCY }
      );
      const collectedFeatures = featureGroups.flat();

      applyPartOfSitesFeaturesToSource(collectedFeatures);
    } catch (error) {
      console.warn("[map] Part of Sites layer load failed", error);
    }
  };
  const loadSectionsGeojson = async () => {
    const fetchJsonOrThrow = async (url, label) => {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`Failed to load ${label}: ${response.status}`);
      }
      return response.json();
    };

    // Always prefer bundled section dataset. Historical snapshots can keep
    // stale section-part bindings and geometry topology from old logic.
    if (sectionsStore?.hasSnapshot) {
      sectionsStore.clearSnapshotGeojson();
    }

    try {
      const rootIndex = await fetchJsonOrThrow(
        SECTIONS_GEOJSON_INDEX_URL,
        "Sections index"
      );
      const groups = Array.isArray(rootIndex?.groups) ? rootIndex.groups : [];
      const collectedFeatures = [];

      for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
        const groupMeta = groups[groupIndex] || {};
        const groupLabel =
          normalizeFeatureId(groupMeta.id) || `SECTION ${String(groupIndex + 1)}`;
        const groupIndexUrl = normalizeFeatureId(groupMeta.index);
        if (!groupIndexUrl) continue;

        const groupIndexData = await fetchJsonOrThrow(
          groupIndexUrl,
          `Section group index (${groupLabel})`
        );
        const items = Array.isArray(groupIndexData?.items) ? groupIndexData.items : [];

        for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
          const item = items[itemIndex] || {};
          const fileUrl = normalizeFeatureId(item.file);
          if (!fileUrl) continue;

          const sectionIdFromIndex =
            normalizeSectionId(item.id) || `SEC_${String(itemIndex + 1).padStart(3, "0")}`;
          const sectionLabelFromIndex =
            normalizeFeatureId(item.label) || sectionIdFromIndex;
          const fileData = await fetchJsonOrThrow(
            fileUrl,
            `Section GeoJSON (${sectionIdFromIndex})`
          );
          const features = format.readFeatures(fileData, {
            dataProjection: EPSG_2326,
            featureProjection: EPSG_2326,
          });

          features.forEach((feature, featureIndex) => {
            normalizeSectionFeature(feature, {
              groupLabelHint: groupLabel,
              sectionIdHint: sectionIdFromIndex,
              sectionLabelHint: sectionLabelFromIndex,
              featureIndex,
            });
          });
          collectedFeatures.push(...features);
        }
      }

      applySectionsFeaturesToSource(collectedFeatures);
    } catch (error) {
      console.warn("[map] Sections layer load failed", error);
    }
  };

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
