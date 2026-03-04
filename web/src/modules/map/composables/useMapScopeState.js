import { computed, ref } from "vue";

export const useMapScopeState = ({ uiStore, leftTab }) => {
  const scopeWorkLotIds = ref([]);
  const scopeSiteBoundaryIds = ref([]);
  const scopePartOfSitesIds = ref([]);
  const scopeSectionIds = ref([]);

  const scopeModeName = computed(() =>
    uiStore.tool === "DRAW_CIRCLE" ? "Scope Circle" : "Scope Draw"
  );

  const hasScopeQuery = computed(
    () =>
      scopeWorkLotIds.value.length > 0 ||
      scopeSiteBoundaryIds.value.length > 0 ||
      scopePartOfSitesIds.value.length > 0 ||
      scopeSectionIds.value.length > 0
  );

  const handleScopeQueryResult = ({
    workLotIds = [],
    siteBoundaryIds = [],
    partOfSitesIds = [],
    sectionIds = [],
  } = {}) => {
    scopeWorkLotIds.value = Array.from(new Set(workLotIds.map((value) => String(value))));
    scopeSiteBoundaryIds.value = Array.from(
      new Set(siteBoundaryIds.map((value) => String(value)))
    );
    scopePartOfSitesIds.value = Array.from(
      new Set(partOfSitesIds.map((value) => String(value)))
    );
    scopeSectionIds.value = Array.from(new Set(sectionIds.map((value) => String(value))));

    if (
      scopeWorkLotIds.value.length > 0 ||
      scopeSiteBoundaryIds.value.length > 0 ||
      scopePartOfSitesIds.value.length > 0 ||
      scopeSectionIds.value.length > 0
    ) {
      leftTab.value = "scope";
      return;
    }

    if (leftTab.value === "scope") {
      leftTab.value = "layers";
    }
  };

  return {
    scopeWorkLotIds,
    scopeSiteBoundaryIds,
    scopePartOfSitesIds,
    scopeSectionIds,
    scopeModeName,
    hasScopeQuery,
    handleScopeQueryResult,
  };
};
