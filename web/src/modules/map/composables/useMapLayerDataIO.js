import { EPSG_2326 } from "../ol/projection";
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

export const useMapLayerDataIO = ({
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
}) => {
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
      if (typeof setCachedSiteBoundaryFeatures === "function") {
        setCachedSiteBoundaryFeatures(features);
      }
      if (typeof refreshSiteBoundarySource === "function") {
        refreshSiteBoundarySource();
      }
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
          const polygonFeatures = features.filter(isPolygonalFeature);
          polygonFeatures.forEach((feature, featureIndex) => {
            normalizePartOfSitesFeature(feature, {
              groupLabelHint: record.groupLabel,
              partIdHint: partIdFromIndex,
              partLabelHint: partLabelFromIndex,
              featureIndex,
            });
          });
          return polygonFeatures;
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
          const polygonFeatures = features.filter(isPolygonalFeature);

          polygonFeatures.forEach((feature, featureIndex) => {
            normalizeSectionFeature(feature, {
              groupLabelHint: groupLabel,
              sectionIdHint: sectionIdFromIndex,
              sectionLabelHint: sectionLabelFromIndex,
              featureIndex,
            });
          });
          collectedFeatures.push(...polygonFeatures);
        }
      }

      applySectionsFeaturesToSource(collectedFeatures);
    } catch (error) {
      console.warn("[map] Sections layer load failed", error);
    }
  };

  return {
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
  };
};
