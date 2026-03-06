import { computed, ref } from "vue";
import {
  CONTRACT_PACKAGE_VALUES,
  normalizeContractPackage,
} from "../../../../shared/utils/contractPackage";
import { siteBoundaryStatusStyle } from "../../utils/siteBoundaryStatusStyle";

const normalizeIdList = (value) => {
  if (!Array.isArray(value)) return [];
  const dedupe = new Set();
  value.forEach((item) => {
    const normalized = String(item || "").trim();
    if (!normalized) return;
    dedupe.add(normalized);
  });
  return Array.from(dedupe);
};

const normalizeText = (value) => String(value || "").trim().toLowerCase();

export const useMapSidePanelFilters = ({ props, emit }) => {
  const leftTabProxy = computed({
    get: () => props.leftTab,
    set: (value) => emit("update:leftTab", value),
  });
  const workSearchProxy = computed({
    get: () => props.workSearchQuery,
    set: (value) => emit("update:workSearchQuery", value),
  });
  const siteBoundarySearchProxy = computed({
    get: () => props.siteBoundarySearchQuery,
    set: (value) => emit("update:siteBoundarySearchQuery", value),
  });
  const partOfSitesSearchProxy = computed({
    get: () => props.partOfSitesSearchQuery,
    set: (value) => emit("update:partOfSitesSearchQuery", value),
  });
  const sectionSearchProxy = computed({
    get: () => props.sectionSearchQuery,
    set: (value) => emit("update:sectionSearchQuery", value),
  });

  const patchLayerFilterState = (patch) => {
    if (!patch || typeof patch !== "object") return;
    emit("update:layerFilterState", patch);
  };

  const createBooleanFilterProxy = (key, fallback = false) =>
    computed({
      get: () => {
        const value = props.layerFilterState?.[key];
        return typeof value === "boolean" ? value : fallback;
      },
      set: (value) => patchLayerFilterState({ [key]: !!value }),
    });

  const showBasemapProxy = createBooleanFilterProxy("showBasemap", true);
  const showLabelsProxy = createBooleanFilterProxy("showLabels", true);
  const activeContractProxy = computed({
    get: () =>
      normalizeContractPackage(props.layerFilterState?.activeContract, {
        fallback: CONTRACT_PACKAGE_VALUES[0],
      }),
    set: (value) => {
      const normalized = normalizeContractPackage(value);
      const nextValue = CONTRACT_PACKAGE_VALUES.includes(normalized)
        ? normalized
        : CONTRACT_PACKAGE_VALUES[0];
      patchLayerFilterState({ activeContract: nextValue });
    },
  });
  const showPartOfSitesProxy = createBooleanFilterProxy("showPartOfSites", false);
  const showSectionsProxy = createBooleanFilterProxy("showSections", false);
  const showSiteBoundaryProxy = createBooleanFilterProxy("showSiteBoundary", true);
  const showWorkLotsProxy = createBooleanFilterProxy("showWorkLots", true);

  const getFilterMode = (modeKey) =>
    props.layerFilterState?.[modeKey] === "custom" ? "custom" : "all";

  const getSelectedIds = (idsKey) => normalizeIdList(props.layerFilterState?.[idsKey]);

  const layerFilterKeyword = ref("");

  const resolveLayerOptions = (key) =>
    Array.isArray(props.layerFilterOptions?.[key]) ? props.layerFilterOptions[key] : [];

  const filterLayerOptions = (items = []) => {
    const keyword = normalizeText(layerFilterKeyword.value);
    if (!keyword) return items;
    return items.filter((item) => {
      const candidates = [
        item.id,
        item.label,
        item.layer,
        item.handle,
        item.categoryLabel,
        item.contractPackage,
      ];
      return candidates.some((candidate) => normalizeText(candidate).includes(keyword));
    });
  };

  const compactBoundaryStatus = (value) => {
    const normalized = String(value || "").trim();
    return normalized || "Pending Clearance";
  };
  const compactWorkStatus = (value) => {
    const normalized = String(value || "").trim();
    return normalized || "Waiting for Assessment";
  };

  const siteBoundaryStatusColor = (statusKey, overdue = false) => ({
    color: siteBoundaryStatusStyle(statusKey, overdue)?.color || "#475569",
  });
  const workStatusColor = (status, dueDate = "") => ({
    color: props.workStatusStyle(status, dueDate)?.color || "#475569",
  });

  const partOfSitesOptions = computed(() => resolveLayerOptions("partOfSites"));
  const sectionOptions = computed(() => resolveLayerOptions("sections"));
  const siteBoundaryOptions = computed(() => resolveLayerOptions("siteBoundaries"));
  const workLotOptions = computed(() => resolveLayerOptions("workLots"));

  const filteredPartOfSitesOptions = computed(() => filterLayerOptions(partOfSitesOptions.value));
  const filteredSectionOptions = computed(() => filterLayerOptions(sectionOptions.value));
  const filteredSiteBoundaryOptions = computed(() => filterLayerOptions(siteBoundaryOptions.value));
  const filteredWorkLotOptions = computed(() => filterLayerOptions(workLotOptions.value));

  const partOfSitesAllIds = computed(() => partOfSitesOptions.value.map((item) => item.id));
  const sectionAllIds = computed(() => sectionOptions.value.map((item) => item.id));
  const siteBoundaryAllIds = computed(() => siteBoundaryOptions.value.map((item) => item.id));
  const workLotAllIds = computed(() => workLotOptions.value.map((item) => item.id));

  const resolveDisplaySelectedIds = (modeKey, idsKey, allIds) =>
    getFilterMode(modeKey) === "all" ? [...allIds] : getSelectedIds(idsKey);

  const resolveSelectedCount = (modeKey, idsKey, allIds) => {
    if (getFilterMode(modeKey) === "all") return allIds.length;
    const selected = getSelectedIds(idsKey).map((id) => id.toLowerCase());
    return allIds.filter((id) => selected.includes(String(id || "").toLowerCase())).length;
  };

  const partOfSitesDisplaySelectedIds = computed(() =>
    resolveDisplaySelectedIds(
      "partOfSitesFilterMode",
      "partOfSitesSelectedIds",
      partOfSitesAllIds.value
    )
  );
  const sectionDisplaySelectedIds = computed(() =>
    resolveDisplaySelectedIds("sectionFilterMode", "sectionSelectedIds", sectionAllIds.value)
  );
  const siteBoundaryDisplaySelectedIds = computed(() =>
    resolveDisplaySelectedIds(
      "siteBoundaryFilterMode",
      "siteBoundarySelectedIds",
      siteBoundaryAllIds.value
    )
  );
  const workLotDisplaySelectedIds = computed(() =>
    resolveDisplaySelectedIds("workLotFilterMode", "workLotSelectedIds", workLotAllIds.value)
  );

  const partOfSitesSelectedCount = computed(() =>
    resolveSelectedCount(
      "partOfSitesFilterMode",
      "partOfSitesSelectedIds",
      partOfSitesAllIds.value
    )
  );
  const sectionSelectedCount = computed(() =>
    resolveSelectedCount("sectionFilterMode", "sectionSelectedIds", sectionAllIds.value)
  );
  const siteBoundarySelectedCount = computed(() =>
    resolveSelectedCount(
      "siteBoundaryFilterMode",
      "siteBoundarySelectedIds",
      siteBoundaryAllIds.value
    )
  );
  const workLotSelectedCount = computed(() =>
    resolveSelectedCount("workLotFilterMode", "workLotSelectedIds", workLotAllIds.value)
  );

  const partOfSitesTotal = computed(() => partOfSitesAllIds.value.length);
  const sectionTotal = computed(() => sectionAllIds.value.length);
  const siteBoundaryTotal = computed(() => siteBoundaryAllIds.value.length);
  const workLotTotal = computed(() => workLotAllIds.value.length);

  const setGroupSelectionAll = (modeKey, idsKey) => {
    patchLayerFilterState({
      [modeKey]: "all",
      [idsKey]: [],
    });
  };

  const setGroupSelectionNone = (modeKey, idsKey) => {
    patchLayerFilterState({
      [modeKey]: "custom",
      [idsKey]: [],
    });
  };

  const updateGroupSelection = (modeKey, idsKey, values, allIds) => {
    const selected = normalizeIdList(values);
    const all = normalizeIdList(allIds);
    if (all.length > 0 && selected.length === all.length) {
      setGroupSelectionAll(modeKey, idsKey);
      return;
    }
    patchLayerFilterState({
      [modeKey]: "custom",
      [idsKey]: selected,
    });
  };

  const selectAllPartOfSites = () =>
    setGroupSelectionAll("partOfSitesFilterMode", "partOfSitesSelectedIds");
  const clearPartOfSites = () =>
    setGroupSelectionNone("partOfSitesFilterMode", "partOfSitesSelectedIds");
  const onPartOfSitesSelectionChange = (value) =>
    updateGroupSelection(
      "partOfSitesFilterMode",
      "partOfSitesSelectedIds",
      value,
      partOfSitesAllIds.value
    );

  const selectAllSections = () => setGroupSelectionAll("sectionFilterMode", "sectionSelectedIds");
  const clearSections = () => setGroupSelectionNone("sectionFilterMode", "sectionSelectedIds");
  const onSectionSelectionChange = (value) =>
    updateGroupSelection("sectionFilterMode", "sectionSelectedIds", value, sectionAllIds.value);

  const selectAllSiteBoundaries = () =>
    setGroupSelectionAll("siteBoundaryFilterMode", "siteBoundarySelectedIds");
  const clearSiteBoundaries = () =>
    setGroupSelectionNone("siteBoundaryFilterMode", "siteBoundarySelectedIds");
  const onSiteBoundarySelectionChange = (value) =>
    updateGroupSelection(
      "siteBoundaryFilterMode",
      "siteBoundarySelectedIds",
      value,
      siteBoundaryAllIds.value
    );

  const selectAllWorkLots = () => setGroupSelectionAll("workLotFilterMode", "workLotSelectedIds");
  const clearWorkLots = () => setGroupSelectionNone("workLotFilterMode", "workLotSelectedIds");
  const onWorkLotSelectionChange = (value) =>
    updateGroupSelection("workLotFilterMode", "workLotSelectedIds", value, workLotAllIds.value);

  const siteBoundaryWorkLotCountText = (boundary) => {
    const count = Number(boundary?.workLotCount);
    if (!Number.isFinite(count) || count <= 0) return "No work lots";
    return count === 1 ? "1 work lot" : `${count} work lots`;
  };

  return {
    leftTabProxy,
    workSearchProxy,
    siteBoundarySearchProxy,
    partOfSitesSearchProxy,
    sectionSearchProxy,
    showBasemapProxy,
    showLabelsProxy,
    activeContractProxy,
    showPartOfSitesProxy,
    showSectionsProxy,
    showSiteBoundaryProxy,
    showWorkLotsProxy,
    layerFilterKeyword,
    filteredPartOfSitesOptions,
    filteredSectionOptions,
    filteredSiteBoundaryOptions,
    filteredWorkLotOptions,
    partOfSitesDisplaySelectedIds,
    sectionDisplaySelectedIds,
    siteBoundaryDisplaySelectedIds,
    workLotDisplaySelectedIds,
    partOfSitesSelectedCount,
    sectionSelectedCount,
    siteBoundarySelectedCount,
    workLotSelectedCount,
    partOfSitesTotal,
    sectionTotal,
    siteBoundaryTotal,
    workLotTotal,
    selectAllPartOfSites,
    clearPartOfSites,
    onPartOfSitesSelectionChange,
    selectAllSections,
    clearSections,
    onSectionSelectionChange,
    selectAllSiteBoundaries,
    clearSiteBoundaries,
    onSiteBoundarySelectionChange,
    selectAllWorkLots,
    clearWorkLots,
    onWorkLotSelectionChange,
    compactBoundaryStatus,
    compactWorkStatus,
    siteBoundaryStatusStyle,
    siteBoundaryStatusColor,
    workStatusColor,
    siteBoundaryWorkLotCountText,
  };
};
