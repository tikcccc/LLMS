<template>
  <div class="page">
    <main class="map-shell">
      <MapSidePanel
        v-model:leftTab="leftTab"
        v-model:workSearchQuery="workSearchQuery"
        v-model:siteBoundarySearchQuery="siteBoundarySearchQuery"
        v-model:partOfSitesSearchQuery="partOfSitesSearchQuery"
        v-model:sectionSearchQuery="sectionSearchQuery"
        v-model:layerFilterState="layerFilterState"
        :layer-filter-options="layerFilterOptions"
        :part-of-sites-results="partOfSitesResults"
        :section-results="sectionResults"
        :work-lot-results="workLotResults"
        :site-boundary-results="siteBoundaryResults"
        :scope-part-of-sites-results="scopePartOfSitesResults"
        :scope-section-results="scopeSectionResults"
        :scope-work-lot-results="scopeWorkLotResults"
        :scope-site-boundary-results="scopeSiteBoundaryResults"
        :has-scope-query="hasScopeQuery"
        :scope-mode-name="scopeModeName"
        :work-status-style="workStatusStyle"
        @focus-work="zoomToWorkLot"
        @focus-site-boundary="zoomToSiteBoundary"
        @focus-part-of-site="zoomToPartOfSite"
        @focus-section="zoomToSection"
        @panel-close="handleSidePanelClose"
      />

      <section class="map-stage">
        <div ref="mapEl" class="map-container"></div>

        <MapToolbar
          :tool="uiStore.tool"
          :can-edit-layer="canEditLayer"
          :active-layer-type="activeLayerType || 'work'"
          :has-draft="hasDraft"
          :has-scope-query="hasScopeQuery"
          :can-save-modify="!!modifySelectedId"
          :can-export-part-of-sites="canExportPartOfSites"
          :can-export-sections="canExportSections"
          @set-tool="setTool"
          @set-active-layer="setActiveLayerType"
          @cancel-tool="cancelTool"
          @save-modify="saveModify"
          @export-part-of-sites="handleExportPartOfSites"
          @export-sections="handleExportSections"
        />

        <MapScaleBar :map="mapRef" />
        <MapLegend />
      </section>
    </main>

    <MapDrawer
      :selected-work-lot="drawerWorkLot"
      :selected-site-boundary="drawerSiteBoundary"
      :selected-part-of-site="drawerPartOfSite"
      :selected-section="drawerSection"
      :related-work-lots="selectedSiteBoundaryRelatedWorkLots"
      :related-site-boundaries="selectedWorkLotRelatedSites"
      :related-sections="selectedPartOfSiteRelatedSections"
      :related-part-of-sites="selectedSectionRelatedPartOfSites"
      :work-status-style="workStatusStyle"
      :work-category-label="workCategoryLabel"
      :focus-map-state="focusMapTarget"
      :can-edit-work="canEditWork"
      :can-edit-site-boundary="canEditWork"
      :can-edit-part-of-site="canEditWork"
      :can-edit-section="canEditWork"
      :can-delete-work="canEditWork"
      @close="handleDrawerClose"
      @edit-work-lot="editSelectedWorkLot"
      @edit-site-boundary="editSelectedSiteBoundary"
      @edit-part-of-site="editSelectedPartOfSite"
      @edit-section="editSelectedSection"
      @delete-work-lot="deleteSelectedWorkLot"
      @focus-map-work-lot="focusOnMapWorkLot"
      @focus-map-site-boundary="focusOnMapSiteBoundary"
      @focus-map-part-of-site="focusOnMapPartOfSite"
      @focus-map-section="focusOnMapSection"
      @focus-work-lot="zoomToWorkLot"
      @focus-site-boundary="zoomToSiteBoundary"
      @focus-part-of-site="zoomToPartOfSite"
      @focus-section="zoomToSection"
    />

    <WorkLotDialog
      v-model="showWorkDialog"
      :title="workDialogTitle"
      :confirm-text="workDialogConfirmText"
      :work-lot-id="workDialogWorkLotId"
      :related-site-boundary-ids="workForm.relatedSiteBoundaryIds"
      :related-site-boundary-names="workFormRelatedSiteBoundaryNames"
      v-model:operatorName="workForm.operatorName"
      v-model:category="workForm.category"
      v-model:responsiblePerson="workForm.responsiblePerson"
      v-model:assessDate="workForm.assessDate"
      v-model:dueDate="workForm.dueDate"
      v-model:completionDate="workForm.completionDate"
      v-model:floatMonths="workForm.floatMonths"
      v-model:forceEviction="workForm.forceEviction"
      v-model:status="workForm.status"
      v-model:description="workForm.description"
      v-model:remark="workForm.remark"
      @confirm="confirmWork"
      @cancel="cancelWork"
    />

    <SiteBoundaryDialog
      v-model="showSiteBoundaryDialog"
      :title="siteBoundaryDialogTitle"
      :confirm-text="siteBoundaryDialogConfirmText"
      :boundary-id="siteBoundaryDialogBoundaryId"
      v-model:name="siteBoundaryForm.name"
      v-model:contractNo="siteBoundaryForm.contractNo"
      v-model:futureUse="siteBoundaryForm.futureUse"
      v-model:plannedHandoverDate="siteBoundaryForm.plannedHandoverDate"
      v-model:completionDate="siteBoundaryForm.completionDate"
      v-model:others="siteBoundaryForm.others"
      @confirm="confirmSiteBoundary"
      @cancel="cancelSiteBoundary"
    />

    <PartOfSiteDialog
      v-model="showPartOfSiteDialog"
      :title="partOfSiteDialogTitle"
      :confirm-text="partOfSiteDialogConfirmText"
      :system-id="partOfSiteDialogSystemId"
      :part-id="partOfSiteDialogPartId"
      v-model:accessDate="partOfSiteForm.accessDate"
      v-model:area="partOfSiteForm.area"
      @confirm="confirmPartOfSite"
      @cancel="cancelPartOfSite"
    />

    <SectionDialog
      v-model="showSectionDialog"
      :title="sectionDialogTitle"
      :confirm-text="sectionDialogConfirmText"
      :system-id="sectionDialogSystemId"
      :section-id="sectionDialogSectionId"
      v-model:completionDate="sectionForm.completionDate"
      v-model:area="sectionForm.area"
      @confirm="confirmSection"
      @cancel="cancelSection"
    />
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import "ol/ol.css";
import { ElMessage } from "element-plus";

import MapToolbar from "./components/MapToolbar.vue";
import MapSidePanel from "./components/MapSidePanel.vue";
import MapDrawer from "./components/MapDrawer.vue";
import WorkLotDialog from "./components/WorkLotDialog.vue";
import SiteBoundaryDialog from "./components/SiteBoundaryDialog.vue";
import PartOfSiteDialog from "./components/PartOfSiteDialog.vue";
import SectionDialog from "./components/SectionDialog.vue";
import MapScaleBar from "./components/MapScaleBar.vue";
import MapLegend from "./components/MapLegend.vue";

import { useAuthStore } from "../../stores/useAuthStore";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useSiteBoundaryStore } from "../../stores/useSiteBoundaryStore";
import { useUiStore } from "../../stores/useUiStore";
import { usePartOfSitesStore } from "../../stores/usePartOfSitesStore";
import { useSectionsStore } from "../../stores/useSectionsStore";
import { todayHongKong } from "../../shared/utils/time";
import {
  CONTRACT_PACKAGE,
  normalizeContractPackage,
  resolveContractPackage,
  toContractPhaseScopedId,
} from "../../shared/utils/contractPackage";
import {
  normalizeWorkLotCategory,
  WORK_LOT_CATEGORY,
  WORK_LOT_STATUS,
  workLotCategoryLabel,
} from "../../shared/utils/worklot";
import {
  createSiteBoundaryEditForm,
} from "../../shared/utils/siteBoundaryEdit";
import {
  createPartOfSiteEditForm,
} from "../../shared/utils/partOfSiteEdit";
import {
  createSectionEditForm,
} from "../../shared/utils/sectionEdit";
import { useMapCore } from "./composables/useMapCore";
import { useMapContractPackageHelpers } from "./composables/useMapContractPackageHelpers";
import { useMapDialogForms } from "./composables/useMapDialogForms";
import { useMapEditLayerType } from "./composables/useMapEditLayerType";
import { useMapAreaOverrides } from "./composables/useMapAreaOverrides";
import { useMapKeyboardShortcuts } from "./composables/useMapKeyboardShortcuts";
import { useMapLayers } from "./composables/useMapLayers";
import { useMapInteractions } from "./composables/useMapInteractions";
import { useMapLayerFilterPanelState } from "./composables/useMapLayerFilterPanelState";
import { useMapPageLifecycle } from "./composables/useMapPageLifecycle";
import { useMapPagePanelState } from "./composables/useMapPagePanelState";
import { useMapPageDialogActionsSetup } from "./composables/useMapPageDialogActionsSetup";
import { useMapPageFocusSetup } from "./composables/useMapPageFocusSetup";
import { useMapPageSpatialSetup } from "./composables/useMapPageSpatialSetup";
import { useMapPageUiActions } from "./composables/useMapPageUiActions";
import { useMapPageWatchers } from "./composables/useMapPageWatchers";
import { useMapScopeResults } from "./composables/useMapScopeResults";
import { useMapScopeState } from "./composables/useMapScopeState";
import { useMapSelectionDetails } from "./composables/useMapSelectionDetails";
import { useMapSourceDataActions } from "./composables/useMapSourceDataActions";
import { EPSG_2326 } from "./ol/projection";
import {
  normalizeIdCollection,
  normalizePartValue,
  normalizePositiveNumber,
  normalizeSectionValue,
} from "./utils/featureMeta";
import {
  applyLayerFilterStateToUiStore,
  normalizeLayerSelectedIdList,
} from "./utils/layerFilterState";
import { workStatusStyle } from "./utils/statusStyle";

const authStore = useAuthStore();
const workLotStore = useWorkLotStore();
const siteBoundaryStore = useSiteBoundaryStore();
const uiStore = useUiStore();
const partOfSitesStore = usePartOfSitesStore();
const sectionsStore = useSectionsStore();
const route = useRoute();

const canEditWork = computed(
  () => authStore.role === "SITE_ADMIN" || authStore.role === "SITE_OFFICER"
);
const canEditLayer = computed(() => canEditWork.value);
const { activeLayerType, setActiveLayerType } = useMapEditLayerType({
  canEditWork,
  canEditLayer,
  uiStore,
});

const selectedWorkLot = computed(
  () => workLotStore.workLots.find((lot) => lot.id === uiStore.selectedWorkLotId) || null
);

const drawerWorkLot = computed(() =>
  uiStore.tool === "MODIFY" ? null : selectedWorkLot.value
);
const drawerSiteBoundary = computed(() =>
  uiStore.tool === "MODIFY" ? null : selectedSiteBoundary.value
);
const drawerPartOfSite = computed(() =>
  uiStore.tool === "MODIFY" ? null : selectedPartOfSite.value
);
const drawerSection = computed(() =>
  uiStore.tool === "MODIFY" ? null : selectedSection.value
);

const workCategoryLabel = (category) => workLotCategoryLabel(category);

const { mapEl, mapRef, basemapLayer, labelLayer, initMap } = useMapCore();

const {
  format,
  workSources,
  workLayers,
  workBusinessLayer,
  workHouseholdLayer,
  workGovernmentLayer,
  intLandLayer,
  partOfSitesSource,
  partOfSitesLayer,
  sectionsSource,
  sectionsLayer,
  siteBoundarySource,
  siteBoundaryLayer,
  updateLayerOpacity,
  updateLayerVisibility,
  refreshLayerFilters,
  createWorkFeature,
  refreshWorkSources,
  refreshSiteBoundarySource,
  refreshSiteBoundaryState,
  getWorkFeatureById,
  getSiteBoundaryFeatureById,
  getPartOfSitesFeatureById,
  getSectionFeatureById,
  loadIntLandGeojson,
  loadPartOfSitesGeojson,
  loadSectionsGeojson,
  loadSiteBoundaryGeojson,
  persistPartOfSitesSnapshot,
  exportPartOfSitesSnapshot,
  persistSectionsSnapshot,
  exportSectionsSnapshot,
} = useMapLayers({
  workLotStore,
  authStore,
  uiStore,
  siteBoundaryStore,
  partOfSitesStore,
  sectionsStore,
});

const hasDraft = ref(false);
const pendingGeometry = ref(null);
const {
  showWorkDialog,
  workDialogMode,
  editingWorkLotId,
  showSiteBoundaryDialog,
  siteBoundaryDialogMode,
  editingSiteBoundaryId,
  showPartOfSiteDialog,
  partOfSiteDialogMode,
  editingPartOfSiteId,
  editingPartOfSiteContractPackage,
  showSectionDialog,
  sectionDialogMode,
  editingSectionId,
  editingSectionContractPackage,
  workForm,
  siteBoundaryForm,
  partOfSiteForm,
  sectionForm,
  workDialogTitle,
  workDialogConfirmText,
  workDialogWorkLotId,
  workFormRelatedSiteBoundaryNames,
  siteBoundaryDialogBoundaryId,
  siteBoundaryDialogTitle,
  siteBoundaryDialogConfirmText,
  partOfSiteDialogSystemId,
  partOfSiteDialogPartId,
  partOfSiteDialogTitle,
  partOfSiteDialogConfirmText,
  sectionDialogSystemId,
  sectionDialogSectionId,
  sectionDialogTitle,
  sectionDialogConfirmText,
  resetWorkForm,
  resetWorkDialogEditState,
  resetSiteBoundaryForm,
  resetPartOfSiteForm,
  resetSectionForm,
  resetSiteBoundaryDialogEditState,
  resetPartOfSiteDialogEditState,
  resetSectionDialogEditState,
} = useMapDialogForms({
  contractPackage: CONTRACT_PACKAGE,
  workLotCategory: WORK_LOT_CATEGORY,
  workLotStatus: WORK_LOT_STATUS,
  todayHongKong,
  siteBoundaryStore,
  createSiteBoundaryEditForm,
  createPartOfSiteEditForm,
  createSectionEditForm,
});

const {
  leftTab,
  workSearchQuery,
  siteBoundarySearchQuery,
  partOfSitesSearchQuery,
  sectionSearchQuery,
  siteBoundarySourceVersion,
  partOfSitesSourceVersion,
  sectionSourceVersion,
} = useMapPagePanelState();
const sourceVersions = {
  siteBoundarySourceVersion,
  partOfSitesSourceVersion,
  sectionSourceVersion,
};
const mapSources = {
  siteBoundarySource,
  partOfSitesSource,
  sectionsSource,
};

const {
  scopeWorkLotIds,
  scopeSiteBoundaryIds,
  scopePartOfSitesIds,
  scopeSectionIds,
  scopeModeName,
  hasScopeQuery,
  handleScopeQueryResult,
} = useMapScopeState({
  uiStore,
  leftTab,
});

const {
  normalizeContractPackageValue,
  resolveContractPackageValue,
  ensureContractPackageVisible,
} = useMapContractPackageHelpers({
  uiStore,
  contractPackage: CONTRACT_PACKAGE,
  normalizeContractPackage,
  resolveContractPackage,
});
const {
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  getPartGeometryStatById,
  getSectionGeometryStatById,
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
} = useMapPageSpatialSetup({
  format,
  projectionCode: EPSG_2326,
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
  minOverlapArea: 1.0,
});

const { getPartAreaOverride, getSectionAreaOverride } = useMapAreaOverrides({
  partOfSitesStore,
  sectionsStore,
  normalizePartValue,
  normalizeSectionValue,
  normalizePositiveNumber,
  normalizeContractPackageValue,
  toContractPhaseScopedId,
});
const featureLookup = {
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
};
const metaResolvers = {
  resolvePartOfSiteMeta,
  resolveSectionMeta,
};

const {
  layerFilterState,
  layerFilterOptions,
  sanitizeMapFilterSelections,
  workLotResults,
  partOfSitesResults,
  sectionResults,
  siteBoundaryResults,
} = useMapLayerFilterPanelState({
  uiStore,
  workLotStore,
  ...mapSources,
  ...sourceVersions,
  workSearchQuery,
  siteBoundarySearchQuery,
  partOfSitesSearchQuery,
  sectionSearchQuery,
  resolveContractPackageValue,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  normalizeWorkLotCategory,
  workCategoryLabel,
  workLotCategory: WORK_LOT_CATEGORY,
});

const startSiteBoundaryDrawCreate = () => {
  siteBoundaryDialogMode.value = "create";
  editingSiteBoundaryId.value = "";
  resetSiteBoundaryForm();
};

const {
  canExportPartOfSites,
  canExportSections,
  handlePartOfSitesSourceChange,
  handleSectionsSourceChange,
  handleExportPartOfSites,
  handleExportSections,
} = useMapSourceDataActions({
  ...sourceVersions,
  ...mapSources,
  persistPartOfSitesSnapshot,
  persistSectionsSnapshot,
  syncSectionPartRelations,
  sanitizeMapFilterSelections,
  refreshLayerFilters,
  updateHighlightVisibility,
  refreshHighlights,
  exportPartOfSitesSnapshot,
  exportSectionsSnapshot,
  notify: ElMessage,
});

const {
  setTool,
  cancelTool,
  clearDraft,
  cancelDraft,
  rebuildInteractions,
  selectInteraction,
  saveModify,
  modifySelectedId,
} = useMapInteractions({
  mapRef,
  uiStore,
  authStore,
  canEditLayer,
  activeLayerType,
  workSources,
  workLayers,
  getWorkFeatureById,
  getSiteBoundaryFeatureById,
  siteBoundarySource,
  partOfSitesLayer,
  partOfSitesSource,
  sectionsLayer,
  sectionsSource,
  siteBoundaryLayer,
  refreshHighlights,
  setHighlightFeature,
  clearHighlightOverride,
  workLotStore,
  siteBoundaryStore,
  format,
  pendingGeometry,
  showWorkDialog,
  showSiteBoundaryDialog,
  hasDraft,
  onScopeQueryResult: handleScopeQueryResult,
  onSiteBoundaryDrawStart: startSiteBoundaryDrawCreate,
  onPartOfSitesSourceChange: handlePartOfSitesSourceChange,
  onSectionsSourceChange: handleSectionsSourceChange,
  resolvePartOfSitesIdAtCoordinate: resolvePartSelectionByCoordinate,
  resolveSectionIdAtCoordinate: resolveSectionSelectionByCoordinate,
});

const {
  scopeWorkLotResults,
  scopeSiteBoundaryResults,
  scopePartOfSitesResults,
  scopeSectionResults,
} = useMapScopeResults({
  scopeWorkLotIds,
  scopeSiteBoundaryIds,
  scopePartOfSitesIds,
  scopeSectionIds,
  workLotStore,
  ...sourceVersions,
  ...featureLookup,
  ...metaResolvers,
});

const {
  selectedSiteBoundary,
  selectedPartOfSite,
  selectedSection,
  selectedWorkLotRelatedSites,
  selectedSiteBoundaryRelatedWorkLots,
  selectedPartOfSiteRelatedSections,
  selectedSectionRelatedPartOfSites,
} = useMapSelectionDetails({
  uiStore,
  workLotStore,
  selectedWorkLot,
  ...sourceVersions,
  ...featureLookup,
  ...metaResolvers,
  getPartGeometryStatById,
  getSectionGeometryStatById,
  getPartAreaOverride,
  getSectionAreaOverride,
  normalizePositiveNumber,
  normalizeIdCollection,
  resolveRelatedSiteBoundaryIdsByGeometryObject,
  withRelatedIdFallback,
  ...mapSources,
  defaultWorkLotStatus: WORK_LOT_STATUS.WAITING_ASSESSMENT,
});

const {
  deleteSelectedWorkLot,
  editSelectedWorkLot,
  editSelectedSiteBoundary,
  editSelectedPartOfSite,
  editSelectedSection,
  confirmWork,
  cancelWork,
  confirmSiteBoundary,
  cancelSiteBoundary,
  confirmPartOfSite,
  cancelPartOfSite,
  confirmSection,
  cancelSection,
} = useMapPageDialogActionsSetup({
  selection: {
    canEditWork,
    selectedWorkLot,
    selectedSiteBoundary,
    selectedPartOfSite,
    selectedSection,
  },
  stores: {
    workLotStore,
    siteBoundaryStore,
    partOfSitesStore,
    sectionsStore,
    uiStore,
    authStore,
  },
  forms: {
    workForm,
    siteBoundaryForm,
    partOfSiteForm,
    sectionForm,
  },
  dialogs: {
    showWorkDialog,
    showSiteBoundaryDialog,
    showPartOfSiteDialog,
    showSectionDialog,
  },
  editing: {
    workDialogMode,
    editingWorkLotId,
    siteBoundaryDialogMode,
    editingSiteBoundaryId,
    partOfSiteDialogMode,
    editingPartOfSiteId,
    editingPartOfSiteContractPackage,
    sectionDialogMode,
    editingSectionId,
    editingSectionContractPackage,
  },
  resets: {
    resetWorkForm,
    resetWorkDialogEditState,
    resetSiteBoundaryForm,
    resetSiteBoundaryDialogEditState,
    resetPartOfSiteDialogEditState,
    resetSectionDialogEditState,
  },
  relations: {
    resolveRelatedSiteBoundaryIdsByGeometryObject,
    withRelatedIdFallback,
  },
  geometry: {
    pendingGeometry,
    clearDraft,
    cancelDraft,
  },
  contract: {
    normalizeContractPackageValue,
    resolveContractPackageValue,
    normalizePartValue,
    normalizeSectionValue,
    normalizePositiveNumber,
  },
  featureLookup: {
    findPartOfSitesFeatureById,
    findSectionFeatureById,
  },
  callbacks: {
    refreshHighlights,
    clearHighlightOverride,
    onPartOfSitesChanged: handlePartOfSitesSourceChange,
    onSectionsChanged: handleSectionsSourceChange,
    notify: ElMessage,
  },
});

let clearAllHighlights = () => {};
const {
  handleDrawerClose,
  forceApplyLayerVisibilityAndFilters,
  onRoleChange,
} = useMapPageUiActions({
  uiStore,
  clearHighlightOverride,
  clearAllHighlights: () => clearAllHighlights(),
  selectInteraction,
  updateLayerVisibility,
  basemapLayer,
  labelLayer,
  refreshLayerFilters,
  updateHighlightVisibility,
  refreshHighlights,
  canEditLayer,
  setTool,
  updateLayerOpacity,
  rebuildInteractions,
});

const {
  hasFocusQueryInRoute,
  fitToSiteBoundary,
  applyFocusFromRoute,
  zoomToWorkLot,
  zoomToSiteBoundary,
  zoomToPartOfSite,
  zoomToSection,
  activeMapFocus,
  focusMapTarget,
  clearActiveMapFocus,
  handleSidePanelClose,
  isActiveFocusStateValid,
  isFocusStateLocked,
  focusOnMapWorkLot,
  focusOnMapSiteBoundary,
  focusOnMapPartOfSite,
  focusOnMapSection,
} = useMapPageFocusSetup({
  mapRef,
  route,
  uiStore,
  workLotStore,
  mapSources,
  getWorkFeatureById,
  createWorkFeature,
  featureLookup,
  metaResolvers,
  getPartGeometryStatById,
  ensureContractPackageVisible,
  resolveContractPackageValue,
  normalizeWorkLotCategory,
  workLotCategory: WORK_LOT_CATEGORY,
  refreshHighlights,
  contractPackage: CONTRACT_PACKAGE,
  normalizeLayerSelectedIdList,
  applyLayerFilterStateToUiStore,
  refreshLayerPresentation: forceApplyLayerVisibilityAndFilters,
});

const { handleKeydown } = useMapKeyboardShortcuts({
  uiStore,
  canEditLayer,
  setTool,
  cancelTool,
});

const { clearAllHighlights: clearAllHighlightsFromWatchers } = useMapPageWatchers({
  workLotStore,
  siteBoundaryStore,
  uiStore,
  authStore,
  route,
  activeLayerType,
  activeMapFocus,
  isFocusStateLocked,
  isActiveFocusStateValid,
  clearActiveMapFocus,
  showWorkDialog,
  workDialogMode,
  workForm,
  pendingGeometry,
  resolveRelatedSiteBoundaryIdsByGeometryObject,
  refreshWorkSources,
  refreshSiteBoundaryState,
  refreshSiteBoundarySource,
  syncWorkLotBoundaryLinks,
  sanitizeMapFilterSelections,
  refreshLayerFilters,
  refreshHighlights,
  updateLayerVisibility,
  basemapLayer,
  labelLayer,
  updateHighlightVisibility,
  rebuildInteractions,
  onRoleChange,
  clearHighlightOverride,
  ...featureLookup,
  ...mapSources,
  workHighlightSource,
  partOfSitesHighlightSource,
  sectionHighlightSource,
  siteBoundaryHighlightSource,
  selectInteraction,
  ...sourceVersions,
  applyFocusFromRoute,
});
clearAllHighlights = clearAllHighlightsFromWatchers;

useMapPageLifecycle({
  uiStore,
  mapRef,
  siteBoundaryStore,
  initMap,
  mapLayers: [
    intLandLayer,
    partOfSitesLayer,
    partOfSitesHighlightLayer,
    sectionsLayer,
    sectionHighlightLayer,
    siteBoundaryLayer,
    siteBoundaryHighlightLayer,
    workBusinessLayer,
    workHouseholdLayer,
    workGovernmentLayer,
    workHighlightLayer,
  ],
  refreshWorkSources,
  sanitizeMapFilterSelections,
  loadIntLandGeojson,
  loadPartOfSitesGeojson,
  loadSectionsGeojson,
  loadSiteBoundaryGeojson,
  partOfSitesSourceVersion,
  sectionSourceVersion,
  siteBoundarySourceVersion,
  syncSectionPartRelations,
  syncWorkLotBoundaryLinks,
  refreshSiteBoundaryState,
  refreshLayerFilters,
  refreshHighlights,
  hasFocusQueryInRoute,
  fitToSiteBoundary,
  applyFocusFromRoute,
  updateLayerOpacity,
  updateLayerVisibility,
  basemapLayer,
  labelLayer,
  updateHighlightVisibility,
  rebuildInteractions,
  handleKeydown,
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.map-shell {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.map-stage {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.map-container {
  position: absolute;
  inset: 0;
}

@media (max-width: 900px) {
  .map-shell {
    display: block;
  }

  .map-stage {
    height: 100%;
  }
}
</style>
