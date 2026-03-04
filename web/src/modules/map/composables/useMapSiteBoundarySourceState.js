import { EPSG_2326 } from "../ol/projection";
import {
  buildSiteBoundarySourceRef,
  buildWorkLotsByBoundary,
  summarizeSiteBoundary,
} from "../../../shared/utils/siteBoundary";
import { generateLandId } from "../../../shared/utils/id";
import { CONTRACT_PACKAGE } from "../../../shared/utils/contractPackage";
import { featureKey, normalizeFeatureId } from "../utils/layerFeatureHelpers";

export const useMapSiteBoundarySourceState = ({
  format,
  siteBoundarySource,
  siteBoundaryStore,
  workLotStore,
  resolveContractPackageValue,
  refreshLayerFilters,
}) => {
  let cachedSiteBoundaryFeatures = [];

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
    const contractPackage = resolveContractPackageValue(
      [
        meta?.contractPackage,
        meta?.contract_package,
        meta?.phase,
        rawFeature.get("contractPackage"),
        rawFeature.get("contract_package"),
        rawFeature.get("phase"),
        rawFeature.get("package"),
        meta?.contractNo,
        rawFeature.get("contractNo"),
        rawFeature.get("layer"),
        sourceRef,
      ],
      CONTRACT_PACKAGE.C2
    );
    existingIds.add(featureKey(assignedId));
    const feature = rawFeature.clone();
    feature.setId(assignedId);
    feature.set("layerType", "siteBoundary");
    feature.set("refId", assignedId);
    feature.set("sourceRef", sourceRef);
    feature.set("landId", assignedId);
    feature.set("contractPackage", contractPackage);
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
    const contractPackage = resolveContractPackageValue(
      [
        boundary?.contractPackage,
        boundary?.contract_package,
        boundary?.phase,
        boundary?.package,
        fallbackFeature?.get("contractPackage"),
        fallbackFeature?.get("contract_package"),
        boundary?.contractNo,
        fallbackFeature?.get("contractNo"),
        boundary?.layer,
        fallbackFeature?.get("layer"),
        sourceRef,
      ],
      CONTRACT_PACKAGE.C2
    );
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
    feature.set("contractPackage", contractPackage);
    feature.set("name", boundary?.name ?? fallbackFeature?.get("name") ?? "");
    feature.set("layer", boundary?.layer ?? fallbackFeature?.get("layer") ?? "—");
    feature.set("entity", boundary?.entity ?? fallbackFeature?.get("entity") ?? "Polygon");
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
      feature.set(
        "contractPackage",
        resolveContractPackageValue(
          [
            boundaryMeta?.contractPackage,
            boundaryMeta?.contract_package,
            feature.get("contractPackage"),
            feature.get("contract_package"),
            boundaryMeta?.contractNo,
            feature.get("contractNo"),
            feature.get("layer"),
            feature.get("sourceRef"),
          ],
          CONTRACT_PACKAGE.C2
        )
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

  const setCachedSiteBoundaryFeatures = (features = []) => {
    cachedSiteBoundaryFeatures = Array.isArray(features) ? features : [];
  };

  return {
    refreshSiteBoundarySource,
    refreshSiteBoundaryState,
    getSiteBoundaryFeatureById,
    setCachedSiteBoundaryFeatures,
  };
};
