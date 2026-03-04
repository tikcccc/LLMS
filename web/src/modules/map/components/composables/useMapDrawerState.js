import { computed, ref, watch } from "vue";
import { todayHongKong } from "../../../../shared/utils/time";

const normalizeFocusToken = (value) => String(value || "").trim().toLowerCase();

const isYyyyMmDd = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const defaultActiveCollapse = () => [
  "basic",
  "relatedSites",
  "relatedSections",
  "relatedWorkLots",
  "relatedParts",
  "description",
  "remark",
];

const formatAreaText = (value) => {
  const area = Number(value);
  if (!Number.isFinite(area) || area <= 0) return "—";
  const ha = area / 10000;
  return `${area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${ha.toFixed(2)} ha)`;
};

export const RELATED_WORKLOT_DUE_OPTIONS = [
  { label: "All Due Dates", value: "ALL" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "No Due Date", value: "NO_DUE_DATE" },
];

export const useMapDrawerState = ({ props, emit }) => {
  const isOpen = computed(
    () =>
      !!props.selectedWorkLot ||
      !!props.selectedSiteBoundary ||
      !!props.selectedPartOfSite ||
      !!props.selectedSection ||
      !!props.selectedIntLand
  );

  const workLotHeaderTitle = computed(() => {
    const name = String(
      props.selectedWorkLot?.operatorName || props.selectedWorkLot?.name || ""
    ).trim();
    if (name) return name;
    const id = String(props.selectedWorkLot?.id || "").trim();
    return id || "Work Lot";
  });

  const siteBoundaryHeaderTitle = computed(() => {
    const name = String(props.selectedSiteBoundary?.name || "").trim();
    return name || "Site Boundary";
  });

  const partOfSiteHeaderTitle = computed(() => {
    const title = String(props.selectedPartOfSite?.title || "").trim();
    if (title) return title;
    return "Part of Site";
  });

  const sectionHeaderTitle = computed(() => {
    const title = String(props.selectedSection?.title || "").trim();
    if (title) return title;
    return "Section";
  });

  const isFocusMatch = (group, id) => {
    const currentGroup = String(props.focusMapState?.group || "").trim();
    if (currentGroup !== group) return false;
    return normalizeFocusToken(props.focusMapState?.id) === normalizeFocusToken(id);
  };

  const isWorkLotFocusActive = computed(() => isFocusMatch("workLot", props.selectedWorkLot?.id));
  const isSiteBoundaryFocusActive = computed(() =>
    isFocusMatch("siteBoundary", props.selectedSiteBoundary?.id)
  );
  const isPartOfSiteFocusActive = computed(() =>
    isFocusMatch("partOfSites", props.selectedPartOfSite?.partId)
  );
  const isSectionFocusActive = computed(() =>
    isFocusMatch("section", props.selectedSection?.sectionId)
  );

  const activeCollapse = ref(defaultActiveCollapse());
  const showDeleteWorkLotConfirm = ref(false);
  const workLotDeleteMessage = computed(() => {
    if (!props.selectedWorkLot) return "";
    return `Delete work lot ${props.selectedWorkLot.id}?`;
  });

  const workLotAreaText = computed(() => formatAreaText(props.selectedWorkLot?.area));
  const intLandAreaText = computed(() => formatAreaText(props.selectedIntLand?.area));
  const siteBoundaryAreaText = computed(() => formatAreaText(props.selectedSiteBoundary?.area));
  const partOfSiteAreaText = computed(() => formatAreaText(props.selectedPartOfSite?.area));
  const partOfSiteRawAreaText = computed(() => formatAreaText(props.selectedPartOfSite?.rawArea));
  const partOfSiteOverlapAreaText = computed(() =>
    formatAreaText(props.selectedPartOfSite?.overlapArea)
  );
  const partOfSiteHasAdjustedArea = computed(() => {
    if (!props.selectedPartOfSite?.areaAdjusted) return false;
    const overlapArea = Number(props.selectedPartOfSite?.overlapArea);
    return Number.isFinite(overlapArea) && overlapArea > 0.01;
  });
  const sectionAreaText = computed(() => formatAreaText(props.selectedSection?.area));
  const sectionRawAreaText = computed(() => formatAreaText(props.selectedSection?.rawArea));
  const sectionOverlapAreaText = computed(() => formatAreaText(props.selectedSection?.overlapArea));
  const sectionHasAdjustedArea = computed(() => {
    if (!props.selectedSection?.areaAdjusted) return false;
    const overlapArea = Number(props.selectedSection?.overlapArea);
    return Number.isFinite(overlapArea) && overlapArea > 0.01;
  });

  const siteBoundaryProgressPercent = computed(() => {
    const value = Number(props.selectedSiteBoundary?.handoverProgress);
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, Math.round(value)));
  });

  const relatedWorkLotsKeyword = ref("");
  const relatedWorkLotsStatusFilter = ref("ALL");
  const relatedWorkLotsDueFilter = ref("ALL");

  const relatedWorkLotStatusOptions = computed(() => {
    const statuses = Array.from(
      new Set(
        props.relatedWorkLots
          .map((lot) => String(lot.status || "").trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));
    return [{ label: "All Statuses", value: "ALL" }].concat(
      statuses.map((status) => ({ label: status, value: status }))
    );
  });

  const filteredRelatedWorkLots = computed(() => {
    const keyword = relatedWorkLotsKeyword.value.trim().toLowerCase();
    const today = todayHongKong();
    return props.relatedWorkLots.filter((lot) => {
      if (
        relatedWorkLotsStatusFilter.value !== "ALL" &&
        String(lot.status || "") !== relatedWorkLotsStatusFilter.value
      ) {
        return false;
      }

      const dueDate = String(lot.dueDate || "").trim();
      if (relatedWorkLotsDueFilter.value === "OVERDUE") {
        if (!isYyyyMmDd(dueDate) || dueDate >= today) return false;
      }
      if (relatedWorkLotsDueFilter.value === "NO_DUE_DATE" && !!dueDate) {
        return false;
      }

      if (!keyword) return true;
      return [lot.id, lot.operatorName, lot.status, lot.dueDate]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(keyword));
    });
  });

  const resetRelatedWorkLotFilters = () => {
    relatedWorkLotsKeyword.value = "";
    relatedWorkLotsStatusFilter.value = "ALL";
    relatedWorkLotsDueFilter.value = "ALL";
  };

  const requestDeleteWorkLot = () => {
    showDeleteWorkLotConfirm.value = true;
  };

  const handleConfirmDeleteWorkLot = () => {
    emit("delete-work-lot");
  };

  watch(isOpen, (value) => {
    if (value) {
      activeCollapse.value = defaultActiveCollapse();
      resetRelatedWorkLotFilters();
    }
  });

  watch(
    () => props.selectedSiteBoundary?.id,
    () => {
      resetRelatedWorkLotFilters();
    }
  );

  return {
    isOpen,
    workLotHeaderTitle,
    siteBoundaryHeaderTitle,
    partOfSiteHeaderTitle,
    sectionHeaderTitle,
    isWorkLotFocusActive,
    isSiteBoundaryFocusActive,
    isPartOfSiteFocusActive,
    isSectionFocusActive,
    activeCollapse,
    showDeleteWorkLotConfirm,
    workLotDeleteMessage,
    workLotAreaText,
    intLandAreaText,
    siteBoundaryAreaText,
    partOfSiteAreaText,
    partOfSiteRawAreaText,
    partOfSiteOverlapAreaText,
    partOfSiteHasAdjustedArea,
    sectionAreaText,
    sectionRawAreaText,
    sectionOverlapAreaText,
    sectionHasAdjustedArea,
    siteBoundaryProgressPercent,
    RELATED_WORKLOT_DUE_OPTIONS,
    relatedWorkLotsKeyword,
    relatedWorkLotsStatusFilter,
    relatedWorkLotsDueFilter,
    relatedWorkLotStatusOptions,
    filteredRelatedWorkLots,
    requestDeleteWorkLot,
    handleConfirmDeleteWorkLot,
  };
};
