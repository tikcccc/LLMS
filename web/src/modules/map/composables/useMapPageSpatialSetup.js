import {
  createPartOfSiteMetaResolver,
  createSectionMetaResolver,
} from "../utils/featureMeta";
import { useMapCoordinateSelection } from "./useMapCoordinateSelection";
import { useMapFeatureRelations } from "./useMapFeatureRelations";
import { useMapHighlights } from "./useMapHighlights";
import { useMapSectionPartRelations } from "./useMapSectionPartRelations";

export const useMapPageSpatialSetup = ({
  format,
  projectionCode,
  uiStore,
  selectedWorkLot,
  partOfSitesSource,
  sectionsSource,
  siteBoundarySource,
  createWorkFeature,
  siteBoundaryStore,
  workLotStore,
  getSiteBoundaryFeatureById,
  getPartOfSitesFeatureById,
  getSectionFeatureById,
  resolveContractPackageValue,
  normalizeIdCollection,
  minOverlapArea = 1.0,
}) => {
  const resolvePartOfSiteMeta = createPartOfSiteMetaResolver({
    resolveContractPackageValue,
  });
  const resolveSectionMeta = createSectionMetaResolver({
    resolveContractPackageValue,
  });

  const {
    getPartGeometryStatById,
    getSectionGeometryStatById,
    resolvePartHighlightGeometry,
    resolveSectionHighlightGeometry,
    syncSectionPartRelations,
  } = useMapSectionPartRelations({
    sectionsSource,
    partOfSitesSource,
    resolvePartOfSiteMeta,
    resolveSectionMeta,
    normalizeIdCollection,
    minOverlapArea,
  });

  const { resolvePartSelectionByCoordinate, resolveSectionSelectionByCoordinate } =
    useMapCoordinateSelection({
      partOfSitesSource,
      sectionsSource,
      resolvePartOfSiteMeta,
      resolveSectionMeta,
      getPartGeometryStatById,
      getSectionGeometryStatById,
      resolveActiveContract: () => uiStore.activeContract,
    });

  const {
    resolveRelatedSiteBoundaryIdsByGeometryObject,
    syncWorkLotBoundaryLinks,
    withRelatedIdFallback,
    findSiteBoundaryFeatureById,
    findPartOfSitesFeatureById,
    findSectionFeatureById,
  } = useMapFeatureRelations({
    format,
    projectionCode,
    siteBoundarySource,
    siteBoundaryStore,
    workLotStore,
    getSiteBoundaryFeatureById,
    getPartOfSitesFeatureById,
    getSectionFeatureById,
  });

  const {
    workHighlightSource,
    workHighlightLayer,
    partOfSitesHighlightSource,
    partOfSitesHighlightLayer,
    sectionHighlightSource,
    sectionHighlightLayer,
    siteBoundaryHighlightSource,
    siteBoundaryHighlightLayer,
    refreshHighlights,
    setHighlightFeature,
    clearHighlightOverride,
    updateHighlightVisibility,
  } = useMapHighlights({
    createWorkFeature,
    selectedWorkLot,
    uiStore,
    partOfSitesSource,
    sectionsSource,
    siteBoundarySource,
    resolvePartOfSitesHighlightGeometry: resolvePartHighlightGeometry,
    resolveSectionHighlightGeometry,
  });

  return {
    resolvePartOfSiteMeta,
    resolveSectionMeta,
    getPartGeometryStatById,
    getSectionGeometryStatById,
    resolvePartHighlightGeometry,
    resolveSectionHighlightGeometry,
    syncSectionPartRelations,
    resolvePartSelectionByCoordinate,
    resolveSectionSelectionByCoordinate,
    resolveRelatedSiteBoundaryIdsByGeometryObject,
    syncWorkLotBoundaryLinks,
    withRelatedIdFallback,
    findSiteBoundaryFeatureById,
    findPartOfSitesFeatureById,
    findSectionFeatureById,
    workHighlightSource,
    workHighlightLayer,
    partOfSitesHighlightSource,
    partOfSitesHighlightLayer,
    sectionHighlightSource,
    sectionHighlightLayer,
    siteBoundaryHighlightSource,
    siteBoundaryHighlightLayer,
    refreshHighlights,
    setHighlightFeature,
    clearHighlightOverride,
    updateHighlightVisibility,
  };
};
