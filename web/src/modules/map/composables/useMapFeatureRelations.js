import { findSiteBoundaryIdsForGeometry } from "../utils/siteBoundaryMatch";

export const useMapFeatureRelations = ({
  format,
  projectionCode,
  siteBoundarySource,
  siteBoundaryStore,
  workLotStore,
  getSiteBoundaryFeatureById,
  getPartOfSitesFeatureById,
  getSectionFeatureById,
}) => {
  const normalizeContractPackage = (value) =>
    String(value || "").trim().toUpperCase() === "C1" ? "C1" : "C2";

  const resolveRelatedSiteBoundaryIdsByGeometryObject = (
    geometryObject,
    { contractPackage = "" } = {}
  ) => {
    if (!geometryObject || !siteBoundarySource) return [];
    try {
      const geometry = format.readGeometry(geometryObject, {
        dataProjection: projectionCode,
        featureProjection: projectionCode,
      });
      const relatedIds = findSiteBoundaryIdsForGeometry(geometry, siteBoundarySource);
      const normalizedContract = String(contractPackage || "").trim();
      if (!normalizedContract) return relatedIds;
      const scopedContract = normalizeContractPackage(normalizedContract);
      return relatedIds.filter((id) => {
        const feature = getSiteBoundaryFeatureById(id, scopedContract);
        if (!feature) return false;
        return normalizeContractPackage(feature.get("contractPackage")) === scopedContract;
      });
    } catch (error) {
      console.warn("[map] resolve related site boundaries for work lot failed", error);
      return [];
    }
  };

  const syncWorkLotBoundaryLinks = () => {
    const hasSourceFeatures = siteBoundarySource?.getFeatures().length > 0;
    if (!hasSourceFeatures && siteBoundaryStore.siteBoundaries.length > 0) {
      return;
    }
    workLotStore.workLots.forEach((lot) => {
      const scopedContract = normalizeContractPackage(
        lot?.contractPackage ??
          lot?.contract_package ??
          lot?.phase ??
          lot?.package ??
          lot?.contractNo
      );
      const autoRelatedIds = resolveRelatedSiteBoundaryIdsByGeometryObject(lot.geometry, {
        contractPackage: scopedContract,
      }).map((item) => String(item));
      const currentRelated = Array.isArray(lot.relatedSiteBoundaryIds)
        ? lot.relatedSiteBoundaryIds.map((item) => String(item))
        : [];
      const changed =
        autoRelatedIds.length !== currentRelated.length ||
        autoRelatedIds.some((item, index) => item !== currentRelated[index]);
      if (!changed) return;
      workLotStore.updateWorkLot(lot.id, {
        relatedSiteBoundaryIds: autoRelatedIds,
      });
    });
  };

  const withRelatedIdFallback = (derivedIds, fallbackIds = []) =>
    Array.isArray(derivedIds) && derivedIds.length > 0
      ? derivedIds
      : Array.isArray(fallbackIds)
        ? fallbackIds
        : [];

  const findSiteBoundaryFeatureById = (id, contractPackage = "") => {
    if (!id) return null;
    const normalizedContract = String(contractPackage || "").trim();
    if (!normalizedContract) {
      return getSiteBoundaryFeatureById(id);
    }
    return getSiteBoundaryFeatureById(id, normalizedContract);
  };

  const findPartOfSitesFeatureById = (id, contractPackage = "") => {
    if (!id) return null;
    const normalizedContract = String(contractPackage || "").trim();
    if (!normalizedContract) {
      return getPartOfSitesFeatureById(id);
    }
    return getPartOfSitesFeatureById(id, normalizedContract);
  };

  const findSectionFeatureById = (id, contractPackage = "") => {
    if (!id) return null;
    const normalizedContract = String(contractPackage || "").trim();
    if (!normalizedContract) {
      return getSectionFeatureById(id);
    }
    return getSectionFeatureById(id, normalizedContract);
  };

  return {
    resolveRelatedSiteBoundaryIdsByGeometryObject,
    syncWorkLotBoundaryLinks,
    withRelatedIdFallback,
    findSiteBoundaryFeatureById,
    findPartOfSitesFeatureById,
    findSectionFeatureById,
  };
};
