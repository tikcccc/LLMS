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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
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
import { nowIso, todayHongKong } from "../../shared/utils/time";
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
  createWorkLotEditForm,
  buildWorkLotUpdatePayload,
} from "../../shared/utils/workLotEdit";
import {
  createSiteBoundaryEditForm,
  buildSiteBoundaryUpdatePayload,
} from "../../shared/utils/siteBoundaryEdit";
import {
  createPartOfSiteEditForm,
  buildPartOfSiteUpdatePayload,
} from "../../shared/utils/partOfSiteEdit";
import {
  createSectionEditForm,
  buildSectionUpdatePayload,
} from "../../shared/utils/sectionEdit";
import { useMapCore } from "./composables/useMapCore";
import { useMapCoordinateSelection } from "./composables/useMapCoordinateSelection";
import { useMapDialogForms } from "./composables/useMapDialogForms";
import { useMapFocusTargetActions } from "./composables/useMapFocusTargetActions";
import { useMapFocusState } from "./composables/useMapFocusState";
import { useMapHighlights } from "./composables/useMapHighlights";
import { useMapLayers } from "./composables/useMapLayers";
import { useMapInteractions } from "./composables/useMapInteractions";
import { useMapLayerFilterPanelState } from "./composables/useMapLayerFilterPanelState";
import { useMapSectionPartRelations } from "./composables/useMapSectionPartRelations";
import { useMapZoomRouteActions } from "./composables/useMapZoomRouteActions";
import { useMapScopeResults } from "./composables/useMapScopeResults";
import { useMapScopeState } from "./composables/useMapScopeState";
import { useMapSelectionDetails } from "./composables/useMapSelectionDetails";
import { EPSG_2326 } from "./ol/projection";
import { findSiteBoundaryIdsForGeometry } from "./utils/siteBoundaryMatch";
import {
  createPartOfSiteMetaResolver,
  createSectionMetaResolver,
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
const editLayerType = ref("work");
const activeLayerType = computed(() => (canEditWork.value ? editLayerType.value : null));

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

const {
  getPartGeometryStatById,
  getSectionGeometryStatById,
  resolvePartHighlightGeometry,
  resolveSectionHighlightGeometry,
  syncSectionPartRelations,
} = useMapSectionPartRelations({
  sectionsSource,
  partOfSitesSource,
  resolvePartOfSiteMeta: (...args) => resolvePartOfSiteMeta(...args),
  resolveSectionMeta: (...args) => resolveSectionMeta(...args),
  normalizeIdCollection,
  minOverlapArea: 1.0,
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

const leftTab = ref("layers");
const workSearchQuery = ref("");
const siteBoundarySearchQuery = ref("");
const partOfSitesSearchQuery = ref("");
const sectionSearchQuery = ref("");
const siteBoundarySourceVersion = ref(0);
const partOfSitesSourceVersion = ref(0);
const sectionSourceVersion = ref(0);

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

const normalizeContractPackageValue = (value) => normalizeContractPackage(value);
const resolveContractPackageValue = (values = []) =>
  resolveContractPackage(values, { fallback: CONTRACT_PACKAGE.C2 });
const toContractPackageVisibilityKey = (group, contractPackage) => {
  const normalized = normalizeContractPackageValue(contractPackage);
  if (group === "workLot") {
    return normalized === CONTRACT_PACKAGE.C1 ? "showWorkLotsC1" : "showWorkLotsC2";
  }
  if (group === "siteBoundary") {
    return normalized === CONTRACT_PACKAGE.C1
      ? "showSiteBoundaryC1"
      : "showSiteBoundaryC2";
  }
  if (group === "partOfSites") {
    return normalized === CONTRACT_PACKAGE.C1
      ? "showPartOfSitesC1"
      : "showPartOfSitesC2";
  }
  return normalized === CONTRACT_PACKAGE.C1 ? "showSectionsC1" : "showSectionsC2";
};
const ensureContractPackageVisible = (group, contractPackage) => {
  const key = toContractPackageVisibilityKey(group, contractPackage);
  if (key && !uiStore[key]) {
    uiStore.setLayerVisibility(key, true);
  }
};
const resolvePartOfSiteMeta = createPartOfSiteMetaResolver({
  resolveContractPackageValue,
});
const resolveSectionMeta = createSectionMetaResolver({
  resolveContractPackageValue,
});
const { resolvePartSelectionByCoordinate, resolveSectionSelectionByCoordinate } =
  useMapCoordinateSelection({
    partOfSitesSource,
    sectionsSource,
    resolvePartOfSiteMeta,
    resolveSectionMeta,
    getPartGeometryStatById,
    getSectionGeometryStatById,
  });

const getPartAreaOverride = (partId, contractPackage = "") => {
  const normalizedPartId = normalizePartValue(partId);
  if (!normalizedPartId || !partOfSitesStore) return null;
  const normalizedPackage = normalizeContractPackageValue(contractPackage);
  const override =
    typeof partOfSitesStore.attributeByPartId === "function"
      ? partOfSitesStore.attributeByPartId(normalizedPartId, normalizedPackage)
      : partOfSitesStore.attributeOverrides?.[
            toContractPhaseScopedId(normalizedPackage, normalizedPartId).toLowerCase()
          ] || partOfSitesStore.attributeOverrides?.[normalizedPartId.toLowerCase()] || null;
  return normalizePositiveNumber(override?.area);
};
const getSectionAreaOverride = (sectionId, contractPackage = "") => {
  const normalizedSectionId = normalizeSectionValue(sectionId);
  if (!normalizedSectionId || !sectionsStore) return null;
  const normalizedPackage = normalizeContractPackageValue(contractPackage);
  const override =
    typeof sectionsStore.attributeBySectionId === "function"
      ? sectionsStore.attributeBySectionId(normalizedSectionId, normalizedPackage)
      : sectionsStore.attributeOverrides?.[
            toContractPhaseScopedId(normalizedPackage, normalizedSectionId).toLowerCase()
          ] || sectionsStore.attributeOverrides?.[normalizedSectionId.toLowerCase()] || null;
  return normalizePositiveNumber(override?.area);
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
  workLotCategory: WORK_LOT_CATEGORY,
});

const setActiveLayerType = (layerType) => {
  if (!canEditLayer.value) return;
  if (!["work", "siteBoundary", "partOfSites", "section"].includes(layerType)) return;
  editLayerType.value = layerType;
  if (layerType === "siteBoundary") {
    if (!uiStore.showSiteBoundary) {
      uiStore.setLayerVisibility("showSiteBoundary", true);
    }
    return;
  }
  if (layerType === "section") {
    if (!uiStore.showSections) {
      uiStore.setLayerVisibility("showSections", true);
    }
    return;
  }
  if (layerType === "partOfSites") {
    if (!uiStore.showPartOfSites) {
      uiStore.setLayerVisibility("showPartOfSites", true);
    }
    return;
  }
  if (!uiStore.showWorkLots) {
    uiStore.setLayerVisibility("showWorkLots", true);
    uiStore.setLayerVisibility("showWorkLotsBusiness", true);
    uiStore.setLayerVisibility("showWorkLotsDomestic", true);
    uiStore.setLayerVisibility("showWorkLotsGovernment", true);
  }
};

const deleteSelectedWorkLot = () => {
  if (!selectedWorkLot.value) return;
  const workLotId = selectedWorkLot.value.id;
  workLotStore.removeWorkLot(workLotId);
  uiStore.clearSelection();
  clearHighlightOverride();
  refreshHighlights();
};

const editSelectedWorkLot = () => {
  if (!canEditWork.value || !selectedWorkLot.value) return;
  const lot = selectedWorkLot.value;
  workDialogMode.value = "edit";
  editingWorkLotId.value = lot.id;
  workForm.value = createWorkLotEditForm(lot, {
    relatedSiteBoundaryIds: withRelatedIdFallback(
      resolveRelatedSiteBoundaryIdsByGeometryObject(lot.geometry),
      lot.relatedSiteBoundaryIds
    ),
  });
  showWorkDialog.value = true;
};

const editSelectedSiteBoundary = () => {
  if (!canEditWork.value || !selectedSiteBoundary.value) return;
  const boundary = selectedSiteBoundary.value;
  siteBoundaryDialogMode.value = "edit";
  editingSiteBoundaryId.value = String(boundary.id || "");
  siteBoundaryForm.value = createSiteBoundaryEditForm(boundary);
  showSiteBoundaryDialog.value = true;
};

const editSelectedPartOfSite = () => {
  if (!canEditWork.value || !selectedPartOfSite.value) return;
  const part = selectedPartOfSite.value;
  partOfSiteDialogMode.value = "edit";
  editingPartOfSiteId.value = String(part.partId || "");
  editingPartOfSiteContractPackage.value = normalizeContractPackageValue(part.contractPackage);
  partOfSiteForm.value = createPartOfSiteEditForm(part);
  showPartOfSiteDialog.value = true;
};

const editSelectedSection = () => {
  if (!canEditWork.value || !selectedSection.value) return;
  const section = selectedSection.value;
  sectionDialogMode.value = "edit";
  editingSectionId.value = String(section.sectionId || "");
  editingSectionContractPackage.value = normalizeContractPackageValue(section.contractPackage);
  sectionForm.value = createSectionEditForm(section);
  showSectionDialog.value = true;
};

const applyPartOfSiteAttributeUpdate = (
  partId,
  payload = {},
  { contractPackage = "" } = {}
) => {
  const normalizedPartId = normalizePartValue(partId);
  if (!normalizedPartId) return false;
  const feature = findPartOfSitesFeatureById(normalizedPartId, contractPackage);
  if (!feature) return false;
  const resolvedPackage = resolveContractPackageValue([
    contractPackage,
    feature?.get("contractPackage"),
    feature?.get("contract_package"),
    feature?.get("phase"),
    feature?.get("package"),
  ]);

  const accessDate = String(payload.accessDate || "").trim();
  const area = normalizePositiveNumber(payload.area);
  feature.set("accessDate", accessDate);
  if (area !== null) {
    feature.set("area", area);
  } else {
    feature.unset("area", true);
  }
  feature.set("updatedAt", String(payload.updatedAt || "").trim());
  feature.set("updatedBy", String(payload.updatedBy || "").trim());

  if (typeof partOfSitesStore.setAttributeOverride === "function") {
    partOfSitesStore.setAttributeOverride(normalizedPartId, {
      partId: normalizedPartId,
      contractPackage: resolvedPackage,
      ...payload,
    }, resolvedPackage);
  }
  return true;
};

const applySectionAttributeUpdate = (
  sectionId,
  payload = {},
  { contractPackage = "" } = {}
) => {
  const normalizedSectionId = normalizeSectionValue(sectionId);
  if (!normalizedSectionId) return false;
  const feature = findSectionFeatureById(normalizedSectionId, contractPackage);
  if (!feature) return false;
  const resolvedPackage = resolveContractPackageValue([
    contractPackage,
    feature?.get("contractPackage"),
    feature?.get("contract_package"),
    feature?.get("phase"),
    feature?.get("package"),
  ]);

  const completionDate = String(payload.completionDate || "").trim();
  const area = normalizePositiveNumber(payload.area);
  feature.set("completionDate", completionDate);
  if (area !== null) {
    feature.set("area", area);
  } else {
    feature.unset("area", true);
  }
  feature.set("updatedAt", String(payload.updatedAt || "").trim());
  feature.set("updatedBy", String(payload.updatedBy || "").trim());

  if (typeof sectionsStore.setAttributeOverride === "function") {
    sectionsStore.setAttributeOverride(normalizedSectionId, {
      sectionId: normalizedSectionId,
      contractPackage: resolvedPackage,
      ...payload,
    }, resolvedPackage);
  }
  return true;
};

const startSiteBoundaryDrawCreate = () => {
  siteBoundaryDialogMode.value = "create";
  editingSiteBoundaryId.value = "";
  resetSiteBoundaryForm();
};

const canExportPartOfSites = computed(() => {
  partOfSitesSourceVersion.value;
  return (partOfSitesSource?.getFeatures().length || 0) > 0;
});
const canExportSections = computed(() => {
  sectionSourceVersion.value;
  return (sectionsSource?.getFeatures().length || 0) > 0;
});

const handlePartOfSitesSourceChange = () => {
  persistPartOfSitesSnapshot({ source: "map-edit" });
  partOfSitesSourceVersion.value += 1;
  syncSectionPartRelations();
  sectionSourceVersion.value += 1;
  sanitizeMapFilterSelections();
  refreshLayerFilters();
  updateHighlightVisibility();
  refreshHighlights();
};
const handleSectionsSourceChange = () => {
  persistSectionsSnapshot({ source: "map-edit" });
  sectionSourceVersion.value += 1;
  syncSectionPartRelations();
  partOfSitesSourceVersion.value += 1;
  sanitizeMapFilterSelections();
  refreshLayerFilters();
  updateHighlightVisibility();
  refreshHighlights();
};

const handleExportPartOfSites = () => {
  if (!canExportPartOfSites.value) return;
  try {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportPartOfSitesSnapshot(`part-of-sites-map-${timestamp}.geojson`);
    ElMessage.success("Part of Sites GeoJSON exported.");
  } catch (error) {
    console.warn("[map] export part of sites failed", error);
    ElMessage.error("Failed to export Part of Sites GeoJSON.");
  }
};
const handleExportSections = () => {
  if (!canExportSections.value) return;
  try {
    const timestamp = new Date().toISOString().slice(0, 10);
    exportSectionsSnapshot(`sections-map-${timestamp}.geojson`);
    ElMessage.success("Sections GeoJSON exported.");
  } catch (error) {
    console.warn("[map] export sections failed", error);
    ElMessage.error("Failed to export Sections GeoJSON.");
  }
};

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

const resolveRelatedSiteBoundaryIdsByGeometryObject = (geometryObject) => {
  if (!geometryObject || !siteBoundarySource) return [];
  try {
    const geometry = format.readGeometry(geometryObject, {
      dataProjection: EPSG_2326,
      featureProjection: EPSG_2326,
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
  siteBoundarySourceVersion,
  partOfSitesSourceVersion,
  sectionSourceVersion,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
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
  siteBoundarySourceVersion,
  partOfSitesSourceVersion,
  sectionSourceVersion,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  getPartGeometryStatById,
  getSectionGeometryStatById,
  getPartAreaOverride,
  getSectionAreaOverride,
  normalizePositiveNumber,
  normalizeIdCollection,
  resolveRelatedSiteBoundaryIdsByGeometryObject,
  withRelatedIdFallback,
  partOfSitesSource,
  sectionsSource,
  defaultWorkLotStatus: WORK_LOT_STATUS.WAITING_ASSESSMENT,
});

const handleDrawerClose = () => {
  uiStore.clearSelection();
  clearHighlightOverride();
  workHighlightSource?.clear(true);
  partOfSitesHighlightSource?.clear(true);
  sectionHighlightSource?.clear(true);
  siteBoundaryHighlightSource?.clear(true);
  if (selectInteraction.value?.getFeatures) {
    selectInteraction.value.getFeatures().clear();
  }
};

const forceApplyLayerVisibilityAndFilters = () => {
  updateLayerVisibility(basemapLayer.value, labelLayer.value);
  refreshLayerFilters();
  updateHighlightVisibility();
  refreshHighlights();
};

const {
  hasFocusQueryInRoute,
  fitToSiteBoundary,
  applyFocusFromRoute,
  zoomToWorkLot,
  zoomToSiteBoundary,
  zoomToPartOfSite,
  zoomToSection,
} = useMapZoomRouteActions({
  mapRef,
  route,
  uiStore,
  workLotStore,
  siteBoundarySource,
  partOfSitesSource,
  sectionsSource,
  getWorkFeatureById,
  createWorkFeature,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  getPartGeometryStatById,
  ensureContractPackageVisible,
  resolveContractPackageValue,
  normalizeWorkLotCategory,
  workLotCategory: WORK_LOT_CATEGORY,
  refreshHighlights,
});

const {
  activeMapFocus,
  focusMapTarget,
  clearActiveMapFocus,
  handleSidePanelClose,
  toggleFocusOnMapTarget,
  isActiveFocusStateValid,
  isFocusStateLocked,
} = useMapFocusState({
  uiStore,
  workLotStore,
  contractPackage: CONTRACT_PACKAGE,
  workLotCategory: WORK_LOT_CATEGORY,
  resolveContractPackageValue,
  normalizeWorkLotCategory,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  normalizeLayerSelectedIdList,
  applyLayerFilterStateToUiStore,
  refreshLayerPresentation: forceApplyLayerVisibilityAndFilters,
  focusTargetActions: {
    workLot: zoomToWorkLot,
    siteBoundary: zoomToSiteBoundary,
    partOfSites: zoomToPartOfSite,
    section: zoomToSection,
  },
});

const {
  focusOnMapWorkLot,
  focusOnMapSiteBoundary,
  focusOnMapPartOfSite,
  focusOnMapSection,
} = useMapFocusTargetActions({
  workLotStore,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  toggleFocusOnMapTarget,
});

const onRoleChange = () => {
  if (
    !canEditLayer.value &&
    ["POLYGON", "POLYGON_CIRCLE", "MODIFY", "DELETE"].includes(uiStore.tool)
  ) {
    setTool("PAN");
  }
  updateLayerOpacity();
  rebuildInteractions();
};

const confirmWork = () => {
  if (workDialogMode.value === "edit") {
    const workLotId = editingWorkLotId.value;
    if (!workLotId) return;
    const existing = workLotStore.workLots.find((lot) => lot.id === workLotId);
    const autoRelatedIds = withRelatedIdFallback(
      resolveRelatedSiteBoundaryIdsByGeometryObject(existing?.geometry),
      existing?.relatedSiteBoundaryIds
    );
    workLotStore.updateWorkLot(
      workLotId,
      buildWorkLotUpdatePayload(workForm.value, {
        workLotId,
        fallbackOperatorName: existing?.operatorName || `Work Lot ${workLotId}`,
        relatedSiteBoundaryIds: autoRelatedIds,
        updatedBy: authStore.roleName,
        updatedAt: nowIso(),
      })
    );
    showWorkDialog.value = false;
    resetWorkDialogEditState();
    return;
  }

  if (!pendingGeometry.value) return;
  const workLotName = workForm.value.operatorName.trim() || "Work Lot";
  const relatedSiteBoundaryIds = resolveRelatedSiteBoundaryIdsByGeometryObject(
    pendingGeometry.value
  );
  workLotStore.addWorkLot({
    operatorName: workLotName,
    category: workForm.value.category,
    relatedSiteBoundaryIds,
    responsiblePerson: workForm.value.responsiblePerson,
    assessDate: workForm.value.assessDate,
    dueDate: workForm.value.dueDate || todayHongKong(),
    completionDate: workForm.value.completionDate,
    floatMonths: workForm.value.floatMonths,
    forceEviction: workForm.value.forceEviction,
    status: workForm.value.status,
    description: workForm.value.description,
    remark: workForm.value.remark,
    geometry: pendingGeometry.value,
    updatedBy: authStore.roleName,
    updatedAt: nowIso(),
  });
  resetWorkForm();
  showWorkDialog.value = false;
  clearDraft();
  resetWorkDialogEditState();
};

const cancelWork = () => {
  if (workDialogMode.value === "edit") {
    showWorkDialog.value = false;
    resetWorkDialogEditState();
    return;
  }
  cancelDraft();
};

const confirmSiteBoundary = () => {
  if (siteBoundaryDialogMode.value === "edit") {
    if (!editingSiteBoundaryId.value) return;
    siteBoundaryStore.updateSiteBoundary(
      editingSiteBoundaryId.value,
      buildSiteBoundaryUpdatePayload(siteBoundaryForm.value)
    );
    showSiteBoundaryDialog.value = false;
    resetSiteBoundaryDialogEditState();
    return;
  }
  if (!pendingGeometry.value) return;
  const created = siteBoundaryStore.addSiteBoundary({
    ...buildSiteBoundaryUpdatePayload(siteBoundaryForm.value),
    name: String(siteBoundaryForm.value.name || "").trim() || "Site Boundary",
    geometry: pendingGeometry.value,
    entity: pendingGeometry.value?.type || "Polygon",
  });
  uiStore.selectSiteBoundary(created.id);
  resetSiteBoundaryForm();
  clearDraft();
  resetSiteBoundaryDialogEditState();
};

const cancelSiteBoundary = () => {
  if (siteBoundaryDialogMode.value === "edit") {
    showSiteBoundaryDialog.value = false;
    resetSiteBoundaryDialogEditState();
    return;
  }
  cancelDraft();
};

const confirmPartOfSite = () => {
  if (partOfSiteDialogMode.value !== "edit") return;
  if (!editingPartOfSiteId.value) return;
  const payload = buildPartOfSiteUpdatePayload(partOfSiteForm.value, {
    updatedBy: authStore.roleName,
    updatedAt: nowIso(),
  });
  const updated = applyPartOfSiteAttributeUpdate(editingPartOfSiteId.value, payload, {
    contractPackage: editingPartOfSiteContractPackage.value,
  });
  if (!updated) {
    ElMessage.error("Failed to update Part of Site.");
    return;
  }
  showPartOfSiteDialog.value = false;
  resetPartOfSiteDialogEditState();
  handlePartOfSitesSourceChange();
  ElMessage.success("Part of Site updated.");
};

const cancelPartOfSite = () => {
  showPartOfSiteDialog.value = false;
  resetPartOfSiteDialogEditState();
};

const confirmSection = () => {
  if (sectionDialogMode.value !== "edit") return;
  if (!editingSectionId.value) return;
  const payload = buildSectionUpdatePayload(sectionForm.value, {
    updatedBy: authStore.roleName,
    updatedAt: nowIso(),
  });
  const updated = applySectionAttributeUpdate(editingSectionId.value, payload, {
    contractPackage: editingSectionContractPackage.value,
  });
  if (!updated) {
    ElMessage.error("Failed to update Section.");
    return;
  }
  showSectionDialog.value = false;
  resetSectionDialogEditState();
  handleSectionsSourceChange();
  ElMessage.success("Section updated.");
};

const cancelSection = () => {
  showSectionDialog.value = false;
  resetSectionDialogEditState();
};

watch(
  () => workLotStore.workLots,
  () => {
    refreshWorkSources();
    refreshSiteBoundaryState();
    sanitizeMapFilterSelections();
    refreshLayerFilters();
    siteBoundarySourceVersion.value += 1;
    refreshHighlights();
  },
  { deep: true }
);

watch(
  () => siteBoundaryStore.siteBoundaries,
  () => {
    refreshSiteBoundarySource();
    syncWorkLotBoundaryLinks();
    sanitizeMapFilterSelections();
    refreshLayerFilters();
    siteBoundarySourceVersion.value += 1;
    refreshHighlights();
  },
  { deep: true }
);

watch(
  () => uiStore.tool,
  () => rebuildInteractions()
);

watch(
  () => activeLayerType.value,
  (nextLayerType) => {
    if (!nextLayerType) return;
    uiStore.clearSelection();
    clearHighlightOverride();
    if (uiStore.tool !== "PAN") {
      rebuildInteractions();
    }
  }
);

watch(
  () => showWorkDialog.value,
  (open) => {
    if (!open || workDialogMode.value !== "create") return;
    workForm.value.relatedSiteBoundaryIds =
      resolveRelatedSiteBoundaryIdsByGeometryObject(pendingGeometry.value);
  }
);

watch(
  () => [
    uiStore.showBasemap,
    uiStore.showLabels,
    uiStore.showIntLand,
    uiStore.showPartOfSites,
    uiStore.showPartOfSitesC1,
    uiStore.showPartOfSitesC2,
    uiStore.showSections,
    uiStore.showSectionsC1,
    uiStore.showSectionsC2,
    uiStore.showSiteBoundary,
    uiStore.showSiteBoundaryC1,
    uiStore.showSiteBoundaryC2,
    uiStore.showWorkLots,
    uiStore.showWorkLotsC1,
    uiStore.showWorkLotsC2,
    uiStore.showWorkLotsBusiness,
    uiStore.showWorkLotsDomestic,
    uiStore.showWorkLotsGovernment,
  ],
  () => {
    updateLayerVisibility(basemapLayer.value, labelLayer.value);
    refreshLayerFilters();
    updateHighlightVisibility();
    refreshHighlights();
    if (uiStore.tool !== "PAN") {
      rebuildInteractions();
    }
  }
);

watch(
  () => [
    uiStore.workLotFilterMode,
    uiStore.siteBoundaryFilterMode,
    uiStore.partOfSitesFilterMode,
    uiStore.sectionFilterMode,
    uiStore.workLotSelectedIds.join("|"),
    uiStore.siteBoundarySelectedIds.join("|"),
    uiStore.partOfSitesSelectedIds.join("|"),
    uiStore.sectionSelectedIds.join("|"),
  ],
  () => {
    refreshLayerFilters();
    updateHighlightVisibility();
    refreshHighlights();
    if (uiStore.tool === "MODIFY" || uiStore.tool === "DELETE") {
      rebuildInteractions();
    }
  }
);

watch(
  () => [
    activeMapFocus.value?.group || "",
    activeMapFocus.value?.id || "",
    uiStore.showIntLand,
    uiStore.showWorkLots,
    uiStore.showWorkLotsC1,
    uiStore.showWorkLotsC2,
    uiStore.showWorkLotsBusiness,
    uiStore.showWorkLotsDomestic,
    uiStore.showWorkLotsGovernment,
    uiStore.showSiteBoundary,
    uiStore.showSiteBoundaryC1,
    uiStore.showSiteBoundaryC2,
    uiStore.showPartOfSites,
    uiStore.showPartOfSitesC1,
    uiStore.showPartOfSitesC2,
    uiStore.showSections,
    uiStore.showSectionsC1,
    uiStore.showSectionsC2,
    uiStore.workLotFilterMode,
    uiStore.siteBoundaryFilterMode,
    uiStore.partOfSitesFilterMode,
    uiStore.sectionFilterMode,
    uiStore.workLotSelectedIds.join("|"),
    uiStore.siteBoundarySelectedIds.join("|"),
    uiStore.partOfSitesSelectedIds.join("|"),
    uiStore.sectionSelectedIds.join("|"),
  ],
  () => {
    if (!activeMapFocus.value) return;
    if (isFocusStateLocked()) return;
    if (!isActiveFocusStateValid()) {
      clearActiveMapFocus({ restoreSnapshot: false });
    }
  }
);

watch(
  () => authStore.role,
  () => onRoleChange()
);

watch(
  () => uiStore.selectedWorkLotId,
  (value) => {
    if (!value) return;
    const exists = workLotStore.workLots.some((lot) => lot.id === value);
    if (!exists) uiStore.clearSelection();
  }
);

watch(
  () => uiStore.selectedWorkLotId,
  (workId) => {
    updateHighlightVisibility();
    refreshHighlights();
    if (!workId && selectInteraction.value?.getFeatures) {
      selectInteraction.value.getFeatures().clear();
    }
  }
);

watch(
  () => uiStore.selectedSiteBoundaryId,
  (value) => {
    if (value && siteBoundarySource) {
      const exists = !!findSiteBoundaryFeatureById(value);
      if (!exists) {
        uiStore.clearSelection();
        return;
      }
    }
    updateHighlightVisibility();
    refreshHighlights();
    if (!value && selectInteraction.value?.getFeatures) {
      selectInteraction.value.getFeatures().clear();
    }
  }
);

watch(
  () => uiStore.selectedPartOfSiteId,
  (value) => {
    if (value && partOfSitesSource) {
      const exists = !!findPartOfSitesFeatureById(value);
      if (!exists) {
        uiStore.clearSelection();
        return;
      }
    }
    updateHighlightVisibility();
    refreshHighlights();
    if (!value && selectInteraction.value?.getFeatures) {
      selectInteraction.value.getFeatures().clear();
    }
  }
);
watch(
  () => uiStore.selectedSectionId,
  (value) => {
    if (value && sectionsSource) {
      const exists = !!findSectionFeatureById(value);
      if (!exists) {
        uiStore.clearSelection();
        return;
      }
    }
    updateHighlightVisibility();
    refreshHighlights();
    if (!value && selectInteraction.value?.getFeatures) {
      selectInteraction.value.getFeatures().clear();
    }
  }
);

watch(
  () => route.query,
  () => {
    applyFocusFromRoute();
  }
);

const handleKeydown = (event) => {
  const target = event.target;
  const isInputTarget =
    target instanceof HTMLElement &&
    (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
  if (isInputTarget) return;

  if (event.key === "Escape" && uiStore.tool !== "PAN") {
    cancelTool();
    return;
  }

  const key = event.key.toLowerCase();
  if (key === "v") {
    setTool("PAN");
    return;
  }
  if (key === "l") {
    setTool("MEASURE");
    return;
  }
  if (key === "d") {
    setTool("DRAW");
    return;
  }
  if (key === "c") {
    setTool("DRAW_CIRCLE");
    return;
  }
  if (!canEditLayer.value) return;
  if (key === "p") {
    setTool("POLYGON");
    return;
  }
  if (key === "o") {
    setTool("POLYGON_CIRCLE");
    return;
  }
  if (key === "m") {
    setTool("MODIFY");
    return;
  }
  if (key === "x") {
    setTool("DELETE");
  }
};

onMounted(async () => {
  if (uiStore.tool !== "PAN") {
    uiStore.setTool("PAN");
  }
  await siteBoundaryStore.ensureLoaded();
  initMap([
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
  ]);
  refreshWorkSources();
  sanitizeMapFilterSelections();
  loadIntLandGeojson();
  loadPartOfSitesGeojson().then(() => {
    partOfSitesSourceVersion.value += 1;
    syncSectionPartRelations();
    sectionSourceVersion.value += 1;
    sanitizeMapFilterSelections();
    refreshLayerFilters();
    refreshHighlights();
    applyFocusFromRoute();
  });
  loadSectionsGeojson().then(() => {
    sectionSourceVersion.value += 1;
    syncSectionPartRelations();
    partOfSitesSourceVersion.value += 1;
    sanitizeMapFilterSelections();
    refreshLayerFilters();
    refreshHighlights();
    applyFocusFromRoute();
  });
  const shouldAutoFit = !hasFocusQueryInRoute();
  loadSiteBoundaryGeojson().then(() => {
    siteBoundarySourceVersion.value += 1;
    syncWorkLotBoundaryLinks();
    refreshSiteBoundaryState();
    sanitizeMapFilterSelections();
    if (shouldAutoFit) {
      fitToSiteBoundary();
    }
    applyFocusFromRoute();
    refreshHighlights();
  });
  updateLayerOpacity();
  updateLayerVisibility(basemapLayer.value, labelLayer.value);
  updateHighlightVisibility();
  refreshHighlights();
  rebuildInteractions();
  applyFocusFromRoute();
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  if (mapRef.value) {
    mapRef.value.setTarget(null);
  }
  window.removeEventListener("keydown", handleKeydown);
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
