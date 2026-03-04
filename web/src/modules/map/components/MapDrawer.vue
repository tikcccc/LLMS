<template>
  <el-drawer
    :model-value="isOpen"
    size="420px"
    :modal="false"
    :modal-penetrable="true"
    :show-close="false"
    :close-on-press-escape="true"
    @close="emit('close')"
  >
    <template #header>
      <MapDrawerHeader
        :selected-work-lot="selectedWorkLot"
        :selected-site-boundary="selectedSiteBoundary"
        :selected-part-of-site="selectedPartOfSite"
        :selected-section="selectedSection"
        :selected-int-land="selectedIntLand"
        :work-lot-header-title="workLotHeaderTitle"
        :site-boundary-header-title="siteBoundaryHeaderTitle"
        :part-of-site-header-title="partOfSiteHeaderTitle"
        :section-header-title="sectionHeaderTitle"
        :work-status-style="workStatusStyle"
        :is-work-lot-focus-active="isWorkLotFocusActive"
        :is-site-boundary-focus-active="isSiteBoundaryFocusActive"
        :is-part-of-site-focus-active="isPartOfSiteFocusActive"
        :is-section-focus-active="isSectionFocusActive"
        :can-edit-work="canEditWork"
        :can-edit-site-boundary="canEditSiteBoundary"
        :can-edit-part-of-site="canEditPartOfSite"
        :can-edit-section="canEditSection"
        :can-delete-work="canDeleteWork"
        @close="emit('close')"
        @focus-map-work-lot="emit('focus-map-work-lot', $event)"
        @focus-map-site-boundary="emit('focus-map-site-boundary', $event)"
        @focus-map-part-of-site="emit('focus-map-part-of-site', $event)"
        @focus-map-section="emit('focus-map-section', $event)"
        @edit-work-lot="emit('edit-work-lot')"
        @edit-site-boundary="emit('edit-site-boundary')"
        @edit-part-of-site="emit('edit-part-of-site')"
        @edit-section="emit('edit-section')"
        @request-delete-work-lot="requestDeleteWorkLot"
      />
    </template>

    <MapDrawerBodyWork
      v-if="selectedWorkLot"
      :selected-work-lot="selectedWorkLot"
      :related-site-boundaries="relatedSiteBoundaries"
      :active-collapse="activeCollapse"
      :work-category-label="workCategoryLabel"
      :work-lot-area-text="workLotAreaText"
      :site-boundary-status-style="siteBoundaryStatusStyle"
      @update:active-collapse="activeCollapse = $event"
      @focus-site-boundary="emit('focus-site-boundary', $event)"
    />

    <MapDrawerBodySiteBoundary
      v-else-if="selectedSiteBoundary"
      :selected-site-boundary="selectedSiteBoundary"
      :related-work-lots="relatedWorkLots"
      :active-collapse="activeCollapse"
      :site-boundary-area-text="siteBoundaryAreaText"
      :site-boundary-progress-percent="siteBoundaryProgressPercent"
      :site-boundary-status-style="siteBoundaryStatusStyle"
      :work-status-style="workStatusStyle"
      :related-work-lots-keyword="relatedWorkLotsKeyword"
      :related-work-lots-status-filter="relatedWorkLotsStatusFilter"
      :related-work-lots-due-filter="relatedWorkLotsDueFilter"
      :related-work-lot-status-options="relatedWorkLotStatusOptions"
      :related-work-lot-due-options="RELATED_WORKLOT_DUE_OPTIONS"
      :filtered-related-work-lots="filteredRelatedWorkLots"
      @update:active-collapse="activeCollapse = $event"
      @update:related-work-lots-keyword="relatedWorkLotsKeyword = $event"
      @update:related-work-lots-status-filter="relatedWorkLotsStatusFilter = $event"
      @update:related-work-lots-due-filter="relatedWorkLotsDueFilter = $event"
      @focus-work-lot="emit('focus-work-lot', $event)"
    />

    <MapDrawerBodyPartOfSite
      v-else-if="selectedPartOfSite"
      :selected-part-of-site="selectedPartOfSite"
      :related-sections="relatedSections"
      :active-collapse="activeCollapse"
      :part-of-site-area-text="partOfSiteAreaText"
      :part-of-site-raw-area-text="partOfSiteRawAreaText"
      :part-of-site-overlap-area-text="partOfSiteOverlapAreaText"
      :part-of-site-has-adjusted-area="partOfSiteHasAdjustedArea"
      @update:active-collapse="activeCollapse = $event"
      @focus-section="emit('focus-section', $event)"
    />

    <MapDrawerBodySection
      v-else-if="selectedSection"
      :selected-section="selectedSection"
      :related-part-of-sites="relatedPartOfSites"
      :active-collapse="activeCollapse"
      :section-area-text="sectionAreaText"
      :section-raw-area-text="sectionRawAreaText"
      :section-overlap-area-text="sectionOverlapAreaText"
      :section-has-adjusted-area="sectionHasAdjustedArea"
      @update:active-collapse="activeCollapse = $event"
      @focus-part-of-site="emit('focus-part-of-site', $event)"
    />

    <MapDrawerBodyIntLand
      v-else-if="selectedIntLand"
      :selected-int-land="selectedIntLand"
      :int-land-area-text="intLandAreaText"
      :active-collapse="activeCollapse"
      @update:active-collapse="activeCollapse = $event"
    />

    <ConfirmDialog
      v-if="selectedWorkLot"
      v-model="showDeleteWorkLotConfirm"
      title="Delete Work Lot"
      :message="workLotDeleteMessage"
      description="This action cannot be undone."
      confirm-text="Delete"
      confirm-type="danger"
      @confirm="handleConfirmDeleteWorkLot"
    />
  </el-drawer>
</template>

<script setup>
import ConfirmDialog from "../../../components/ConfirmDialog.vue";
import { siteBoundaryStatusStyle } from "../utils/siteBoundaryStatusStyle";
import { useMapDrawerState } from "./composables/useMapDrawerState";
import MapDrawerBodyIntLand from "./MapDrawerBodyIntLand.vue";
import MapDrawerBodyPartOfSite from "./MapDrawerBodyPartOfSite.vue";
import MapDrawerBodySection from "./MapDrawerBodySection.vue";
import MapDrawerBodySiteBoundary from "./MapDrawerBodySiteBoundary.vue";
import MapDrawerBodyWork from "./MapDrawerBodyWork.vue";
import MapDrawerHeader from "./MapDrawerHeader.vue";

const props = defineProps({
  selectedWorkLot: { type: Object, default: null },
  selectedSiteBoundary: { type: Object, default: null },
  selectedPartOfSite: { type: Object, default: null },
  selectedSection: { type: Object, default: null },
  selectedIntLand: { type: Object, default: null },
  relatedWorkLots: { type: Array, default: () => [] },
  relatedSiteBoundaries: { type: Array, default: () => [] },
  relatedSections: { type: Array, default: () => [] },
  relatedPartOfSites: { type: Array, default: () => [] },
  workStatusStyle: { type: Function, required: true },
  workCategoryLabel: { type: Function, required: true },
  focusMapState: { type: Object, default: null },
  canEditWork: { type: Boolean, default: true },
  canEditSiteBoundary: { type: Boolean, default: true },
  canEditPartOfSite: { type: Boolean, default: true },
  canEditSection: { type: Boolean, default: true },
  canDeleteWork: { type: Boolean, default: true },
});

const emit = defineEmits([
  "close",
  "delete-work-lot",
  "edit-work-lot",
  "edit-site-boundary",
  "edit-part-of-site",
  "edit-section",
  "focus-map-work-lot",
  "focus-map-site-boundary",
  "focus-map-part-of-site",
  "focus-map-section",
  "focus-work-lot",
  "focus-site-boundary",
  "focus-part-of-site",
  "focus-section",
]);

const {
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
} = useMapDrawerState({ props, emit });
</script>

<style src="./MapDrawer.css"></style>
