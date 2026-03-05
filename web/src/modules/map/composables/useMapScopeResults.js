import { computed } from "vue";
import {
  buildScopePartOfSitesResults,
  buildScopeSectionResults,
  buildScopeSiteBoundaryResults,
  buildScopeWorkLotResults,
} from "../utils/layerFilterSelectors";

export const useMapScopeResults = ({
  scopeWorkLotIds,
  scopeSiteBoundaryIds,
  scopePartOfSitesIds,
  scopeSectionIds,
  workLotStore,
  uiStore,
  resolveContractPackageValue,
  siteBoundarySourceVersion,
  partOfSitesSourceVersion,
  sectionSourceVersion,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
}) => {
  const scopeWorkLotResults = computed(() =>
    buildScopeWorkLotResults({
      scopeWorkLotIds: scopeWorkLotIds.value,
      workLots: workLotStore.workLots,
      activeContract: uiStore.activeContract,
      resolveContractPackageValue,
    })
  );

  const scopeSiteBoundaryResults = computed(() => {
    siteBoundarySourceVersion.value;
    return buildScopeSiteBoundaryResults({
      scopeSiteBoundaryIds: scopeSiteBoundaryIds.value,
      findSiteBoundaryFeatureById,
    });
  });

  const scopePartOfSitesResults = computed(() => {
    partOfSitesSourceVersion.value;
    return buildScopePartOfSitesResults({
      scopePartOfSitesIds: scopePartOfSitesIds.value,
      findPartOfSitesFeatureById,
      resolvePartOfSiteMeta,
    });
  });

  const scopeSectionResults = computed(() => {
    sectionSourceVersion.value;
    return buildScopeSectionResults({
      scopeSectionIds: scopeSectionIds.value,
      findSectionFeatureById,
      resolveSectionMeta,
    });
  });

  return {
    scopeWorkLotResults,
    scopeSiteBoundaryResults,
    scopePartOfSitesResults,
    scopeSectionResults,
  };
};
