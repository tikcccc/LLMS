import { computed } from "vue";
import { fuzzyMatchAny } from "../../../shared/utils/search";
import {
  applyLayerFilterStateToUiStore,
  buildLayerFilterStateFromUiStore,
} from "../utils/layerFilterState";
import {
  buildLayerFilterOptions,
  buildPartOfSitesResults,
  buildSectionResults,
  buildSiteBoundaryResults,
  buildWorkLotResults,
} from "../utils/layerFilterSelectors";

export const useMapLayerFilterPanelState = ({
  uiStore,
  workLotStore,
  siteBoundarySource,
  partOfSitesSource,
  sectionsSource,
  siteBoundarySourceVersion,
  partOfSitesSourceVersion,
  sectionSourceVersion,
  workSearchQuery,
  siteBoundarySearchQuery,
  partOfSitesSearchQuery,
  sectionSearchQuery,
  resolveContractPackageValue,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  normalizeWorkLotCategory,
  workCategoryLabel,
  workLotCategory,
}) => {
  const layerFilterState = computed({
    get: () => buildLayerFilterStateFromUiStore(uiStore),
    set: (value) => applyLayerFilterStateToUiStore(uiStore, value),
  });

  const layerFilterOptions = computed(() => {
    siteBoundarySourceVersion.value;
    partOfSitesSourceVersion.value;
    sectionSourceVersion.value;
    return buildLayerFilterOptions({
      workLots: workLotStore.workLots,
      siteBoundaryFeatures: siteBoundarySource?.getFeatures() || [],
      partOfSitesFeatures: partOfSitesSource?.getFeatures() || [],
      sectionFeatures: sectionsSource?.getFeatures() || [],
      resolveContractPackageValue,
      resolvePartOfSiteMeta,
      resolveSectionMeta,
      normalizeWorkLotCategory,
      workCategoryLabel,
      workLotCategory,
    });
  });

  const sanitizeMapFilterSelections = () => {
    uiStore.sanitizeMapSelectedIds({
      workLotIds: layerFilterOptions.value.workLots.map((item) => item.id),
      siteBoundaryIds: layerFilterOptions.value.siteBoundaries.map((item) => item.id),
      partOfSitesIds: layerFilterOptions.value.partOfSites.map((item) => item.id),
      sectionIds: layerFilterOptions.value.sections.map((item) => item.id),
    });
  };

  const workLotResults = computed(() =>
    buildWorkLotResults({
      workLots: workLotStore.workLots,
      query: workSearchQuery.value,
      fuzzyMatchAny,
      workCategoryLabel,
    })
  );

  const partOfSitesResults = computed(() => {
    partOfSitesSourceVersion.value;
    return buildPartOfSitesResults({
      partOfSitesFeatures: partOfSitesSource?.getFeatures() || [],
      query: partOfSitesSearchQuery.value,
      fuzzyMatchAny,
      resolvePartOfSiteMeta,
    });
  });

  const sectionResults = computed(() => {
    sectionSourceVersion.value;
    return buildSectionResults({
      sectionFeatures: sectionsSource?.getFeatures() || [],
      query: sectionSearchQuery.value,
      fuzzyMatchAny,
      resolveSectionMeta,
    });
  });

  const siteBoundaryResults = computed(() => {
    siteBoundarySourceVersion.value;
    return buildSiteBoundaryResults({
      siteBoundaryFeatures: siteBoundarySource?.getFeatures() || [],
      workLots: workLotStore.workLots,
      query: siteBoundarySearchQuery.value,
    });
  });

  return {
    layerFilterState,
    layerFilterOptions,
    sanitizeMapFilterSelections,
    workLotResults,
    partOfSitesResults,
    sectionResults,
    siteBoundaryResults,
  };
};
