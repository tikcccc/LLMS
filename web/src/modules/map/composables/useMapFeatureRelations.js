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
  const resolveRelatedSiteBoundaryIdsByGeometryObject = (geometryObject) => {
    if (!geometryObject || !siteBoundarySource) return [];
    try {
      const geometry = format.readGeometry(geometryObject, {
        dataProjection: projectionCode,
        featureProjection: projectionCode,
      });
      return findSiteBoundaryIdsForGeometry(geometry, siteBoundarySource);
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
      const autoRelatedIds = resolveRelatedSiteBoundaryIdsByGeometryObject(lot.geometry).map(
        (item) => String(item)
      );
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

  const findSiteBoundaryFeatureById = (id) => {
    if (!id) return null;
    return getSiteBoundaryFeatureById(id);
  };

  const findPartOfSitesFeatureById = (id, contractPackage = "") => {
    if (!id) return null;
    return getPartOfSitesFeatureById(id, contractPackage);
  };

  const findSectionFeatureById = (id, contractPackage = "") => {
    if (!id) return null;
    return getSectionFeatureById(id, contractPackage);
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
