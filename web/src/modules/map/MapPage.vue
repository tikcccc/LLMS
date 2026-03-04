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
import { isEmpty as isEmptyExtent } from "ol/extent";
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
import { fuzzyMatchAny } from "../../shared/utils/search";
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
import { useMapHighlights } from "./composables/useMapHighlights";
import { useMapLayers } from "./composables/useMapLayers";
import { useMapInteractions } from "./composables/useMapInteractions";
import { EPSG_2326 } from "./ol/projection";
import { findSiteBoundaryIdsForGeometry } from "./utils/siteBoundaryMatch";
import {
  buildResolvedPartGeometryStats,
  getGeometriesIntersectionArea,
  geometriesOverlapByArea,
  getResolvedPartGeometryStat,
} from "./utils/partGeometryResolution";
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
const partGeometryStatsById = ref(new Map());
const sectionGeometryStatsById = ref(new Map());
const SECTION_PART_RELATION_MIN_OVERLAP_AREA = 1.0;

const getPartGeometryStatById = (partId) =>
  getResolvedPartGeometryStat(partGeometryStatsById.value, partId);
const getSectionGeometryStatById = (sectionId) =>
  getResolvedPartGeometryStat(sectionGeometryStatsById.value, sectionId);

const resolvePartHighlightGeometry = (partId) => {
  const partGeometryStat = getPartGeometryStatById(partId);
  if (!partGeometryStat) return undefined;
  const geometry = partGeometryStat.geometry;
  return geometry ? geometry.clone() : null;
};
const resolveSectionHighlightGeometry = (sectionId) => {
  const sectionGeometryStat = getSectionGeometryStatById(sectionId);
  if (!sectionGeometryStat) return undefined;
  const geometry = sectionGeometryStat.geometry;
  return geometry ? geometry.clone() : null;
};

const resolvePartSelectionByCoordinate = (coordinate) => {
  if (!Array.isArray(coordinate) || coordinate.length < 2 || !partOfSitesSource) return "";
  const x = Number(coordinate[0]);
  const y = Number(coordinate[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "";

  const dedupe = new Set();
  const candidates = [];
  const clickPoint = [x, y];
  partOfSitesSource.getFeatures().forEach((feature, index) => {
    const meta = resolvePartOfSiteMeta(feature, index);
    const partId = String(meta.partId || "").trim();
    if (!partId) return;
    const key = partId.toLowerCase();
    if (dedupe.has(key)) return;

    const stat = getPartGeometryStatById(partId);
    const geometry = stat?.geometry || feature.getGeometry();
    if (!geometry || typeof geometry.intersectsCoordinate !== "function") return;
    if (!geometry.intersectsCoordinate(clickPoint)) return;

    const areaValue =
      Number.isFinite(stat?.area) && stat.area > 0
        ? stat.area
        : Math.abs(geometry.getArea?.() || 0);
    dedupe.add(key);
    candidates.push({
      partId,
      area: Number.isFinite(areaValue) ? areaValue : 0,
    });
  });

  if (!candidates.length) return "";
  candidates.sort((left, right) => {
    const areaDelta = left.area - right.area;
    if (Math.abs(areaDelta) > 1e-7) return areaDelta;
    return left.partId.localeCompare(right.partId, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
  return candidates[0].partId;
};
const resolveSectionSelectionByCoordinate = (coordinate) => {
  if (!Array.isArray(coordinate) || coordinate.length < 2 || !sectionsSource) return "";
  const x = Number(coordinate[0]);
  const y = Number(coordinate[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "";

  const dedupe = new Set();
  const candidates = [];
  const clickPoint = [x, y];
  sectionsSource.getFeatures().forEach((feature, index) => {
    const meta = resolveSectionMeta(feature, index);
    const sectionId = String(meta.sectionId || "").trim();
    if (!sectionId) return;
    const key = sectionId.toLowerCase();
    if (dedupe.has(key)) return;

    const stat = getSectionGeometryStatById(sectionId);
    const geometry = stat?.geometry || feature.getGeometry();
    if (!geometry || typeof geometry.intersectsCoordinate !== "function") return;
    if (!geometry.intersectsCoordinate(clickPoint)) return;

    const areaValue =
      Number.isFinite(stat?.area) && stat.area > 0
        ? stat.area
        : Math.abs(geometry.getArea?.() || 0);
    dedupe.add(key);
    candidates.push({
      sectionId,
      area: Number.isFinite(areaValue) ? areaValue : 0,
    });
  });

  if (!candidates.length) return "";
  candidates.sort((left, right) => {
    const areaDelta = left.area - right.area;
    if (Math.abs(areaDelta) > 1e-7) return areaDelta;
    return left.sectionId.localeCompare(right.sectionId, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
  return candidates[0].sectionId;
};

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
const showWorkDialog = ref(false);
const workDialogMode = ref("create");
const editingWorkLotId = ref(null);
const showSiteBoundaryDialog = ref(false);
const siteBoundaryDialogMode = ref("create");
const editingSiteBoundaryId = ref("");
const showPartOfSiteDialog = ref(false);
const partOfSiteDialogMode = ref("create");
const editingPartOfSiteId = ref("");
const showSectionDialog = ref(false);
const sectionDialogMode = ref("create");
const editingSectionId = ref("");

const workForm = ref({
  operatorName: "",
  category: WORK_LOT_CATEGORY.BU,
  relatedSiteBoundaryIds: [],
  responsiblePerson: "",
  assessDate: todayHongKong(),
  dueDate: todayHongKong(),
  completionDate: "",
  floatMonths: null,
  forceEviction: false,
  status: WORK_LOT_STATUS.WAITING_ASSESSMENT,
  description: "",
  remark: "",
});

const siteBoundaryForm = ref({
  name: "",
  contractNo: "",
  futureUse: "",
  plannedHandoverDate: "",
  completionDate: "",
  others: "",
});
const partOfSiteForm = ref({
  id: "",
  partId: "",
  accessDate: "",
  area: null,
});
const sectionForm = ref({
  id: "",
  sectionId: "",
  completionDate: "",
  area: null,
});

const workDialogTitle = computed(() =>
  workDialogMode.value === "edit" ? "Edit Work Lot" : "Create Work Lot"
);
const workDialogConfirmText = computed(() =>
  workDialogMode.value === "edit" ? "Save Changes" : "Save"
);
const workDialogWorkLotId = computed(() =>
  workDialogMode.value === "edit" ? String(editingWorkLotId.value ?? "") : ""
);
const workFormRelatedSiteBoundaryNames = computed(() =>
  (Array.isArray(workForm.value.relatedSiteBoundaryIds)
    ? workForm.value.relatedSiteBoundaryIds
    : []
  ).map((id) => {
    const normalized = String(id).trim().toLowerCase();
    if (!normalized) return String(id);
    const found = siteBoundaryStore.siteBoundaries.find(
      (boundary) => String(boundary.id).trim().toLowerCase() === normalized
    );
    return found?.name || String(id);
  })
);
const siteBoundaryDialogBoundaryId = computed(() =>
  String(editingSiteBoundaryId.value || "")
);
const siteBoundaryDialogTitle = computed(() =>
  siteBoundaryDialogMode.value === "edit" ? "Edit Site Boundary" : "Create Site Boundary"
);
const siteBoundaryDialogConfirmText = computed(() =>
  siteBoundaryDialogMode.value === "edit" ? "Save Changes" : "Save"
);
const partOfSiteDialogSystemId = computed(() => String(partOfSiteForm.value.id || ""));
const partOfSiteDialogPartId = computed(() => String(partOfSiteForm.value.partId || ""));
const partOfSiteDialogTitle = computed(() =>
  partOfSiteDialogMode.value === "edit" ? "Edit Part of Site" : "Create Part of Site"
);
const partOfSiteDialogConfirmText = computed(() =>
  partOfSiteDialogMode.value === "edit" ? "Save Changes" : "Save"
);
const sectionDialogSystemId = computed(() => String(sectionForm.value.id || ""));
const sectionDialogSectionId = computed(() => String(sectionForm.value.sectionId || ""));
const sectionDialogTitle = computed(() =>
  sectionDialogMode.value === "edit" ? "Edit Section" : "Create Section"
);
const sectionDialogConfirmText = computed(() =>
  sectionDialogMode.value === "edit" ? "Save Changes" : "Save"
);

const resetWorkForm = () => {
  workForm.value = {
    operatorName: "",
    category: WORK_LOT_CATEGORY.BU,
    relatedSiteBoundaryIds: [],
    responsiblePerson: "",
    assessDate: todayHongKong(),
    dueDate: todayHongKong(),
    completionDate: "",
    floatMonths: null,
    forceEviction: false,
    status: WORK_LOT_STATUS.WAITING_ASSESSMENT,
    description: "",
    remark: "",
  };
};

const resetWorkDialogEditState = () => {
  workDialogMode.value = "create";
  editingWorkLotId.value = null;
};

const resetSiteBoundaryForm = () => {
  siteBoundaryForm.value = createSiteBoundaryEditForm();
};

const resetPartOfSiteForm = () => {
  partOfSiteForm.value = createPartOfSiteEditForm();
};

const resetSectionForm = () => {
  sectionForm.value = createSectionEditForm();
};

const resetSiteBoundaryDialogEditState = () => {
  siteBoundaryDialogMode.value = "create";
  editingSiteBoundaryId.value = "";
};
const resetPartOfSiteDialogEditState = () => {
  partOfSiteDialogMode.value = "create";
  editingPartOfSiteId.value = "";
};
const resetSectionDialogEditState = () => {
  sectionDialogMode.value = "create";
  editingSectionId.value = "";
};

const leftTab = ref("layers");
const workSearchQuery = ref("");
const siteBoundarySearchQuery = ref("");
const partOfSitesSearchQuery = ref("");
const sectionSearchQuery = ref("");
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

const normalizeIdList = (values = []) => {
  if (!Array.isArray(values)) return [];
  const dedupe = new Set();
  values.forEach((value) => {
    const normalized = String(value || "").trim();
    if (!normalized) return;
    dedupe.add(normalized);
  });
  return Array.from(dedupe);
};

const normalizePartValue = (value) => String(value || "").trim();

const normalizePartToken = (value, fallback) => {
  const token = normalizePartValue(value).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return token || fallback;
};

const buildPartOfSitesSystemId = (groupLabel, partId, featureIndex = 0) => {
  const seq = String(Math.max(0, Number(featureIndex) || 0) + 1).padStart(3, "0");
  return `POS-${normalizePartToken(groupLabel, "PART")}-${normalizePartToken(partId, "UNK")}-${seq}`;
};
const buildSectionSystemId = (groupLabel, sectionId, featureIndex = 0) => {
  const seq = String(Math.max(0, Number(featureIndex) || 0) + 1).padStart(3, "0");
  return `SOW-${normalizePartToken(groupLabel, "SEC")}-${normalizePartToken(sectionId, "UNK")}-${seq}`;
};
const normalizeSectionValue = (value) => String(value || "").trim();
const normalizePositiveNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};
const normalizeIdCollection = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(value.map((item) => String(item || "").trim()).filter(Boolean))
    );
  }
  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }
  return [];
};
const getPartAreaOverride = (partId) => {
  const normalizedPartId = normalizePartValue(partId);
  if (!normalizedPartId || !partOfSitesStore) return null;
  const override =
    typeof partOfSitesStore.attributeByPartId === "function"
      ? partOfSitesStore.attributeByPartId(normalizedPartId)
      : partOfSitesStore.attributeOverrides?.[normalizedPartId.toLowerCase()] || null;
  return normalizePositiveNumber(override?.area);
};
const getSectionAreaOverride = (sectionId) => {
  const normalizedSectionId = normalizeSectionValue(sectionId);
  if (!normalizedSectionId || !sectionsStore) return null;
  const override =
    typeof sectionsStore.attributeBySectionId === "function"
      ? sectionsStore.attributeBySectionId(normalizedSectionId)
      : sectionsStore.attributeOverrides?.[normalizedSectionId.toLowerCase()] || null;
  return normalizePositiveNumber(override?.area);
};

const resolvePartOfSiteMeta = (feature, index = 0) => {
  const partId =
    normalizePartValue(feature?.get("partOfSitesLotId")) ||
    normalizePartValue(feature?.get("partId")) ||
    normalizePartValue(feature?.get("part_id")) ||
    normalizePartValue(feature?.get("refId")) ||
    normalizePartValue(feature?.getId?.()) ||
    normalizePartValue(feature?.get("id")) ||
    `part_of_site_${String(index + 1).padStart(5, "0")}`;
  const label =
    normalizePartValue(feature?.get("partOfSitesLotLabel")) ||
    normalizePartValue(feature?.get("partId")) ||
    partId;
  const group =
    normalizePartValue(feature?.get("partOfSitesGroup")) ||
    normalizePartValue(feature?.get("partGroup"));
  const systemId =
    normalizePartValue(feature?.get("partOfSitesSystemId")) ||
    normalizePartValue(feature?.get("systemId")) ||
    buildPartOfSitesSystemId(group, partId, index);
  const accessDate =
    normalizePartValue(feature?.get("accessDate")) ||
    normalizePartValue(feature?.get("access_date"));
  const sectionIds = normalizeIdCollection(
    feature?.get("sectionIds") || feature?.get("relatedSectionIds")
  );
  const sectionId =
    normalizePartValue(feature?.get("sectionId")) ||
    normalizePartValue(feature?.get("section_id")) ||
    sectionIds[0] ||
    "";

  return {
    partId,
    label,
    group,
    systemId,
    accessDate,
    sectionId,
    sectionIds: sectionId ? Array.from(new Set([sectionId, ...sectionIds])) : sectionIds,
  };
};
const resolveSectionMeta = (feature, index = 0) => {
  const sectionId =
    normalizeSectionValue(feature?.get("sectionLotId")) ||
    normalizeSectionValue(feature?.get("sectionId")) ||
    normalizeSectionValue(feature?.get("section_id")) ||
    normalizeSectionValue(feature?.get("refId")) ||
    normalizeSectionValue(feature?.getId?.()) ||
    normalizeSectionValue(feature?.get("id")) ||
    `section_${String(index + 1).padStart(5, "0")}`;
  const title =
    normalizeSectionValue(feature?.get("sectionLotLabel")) ||
    normalizeSectionValue(feature?.get("sectionLabel")) ||
    sectionId;
  const group =
    normalizeSectionValue(feature?.get("sectionGroup")) ||
    normalizeSectionValue(feature?.get("section_group"));
  const systemId =
    normalizeSectionValue(feature?.get("sectionSystemId")) ||
    normalizeSectionValue(feature?.get("systemId")) ||
    buildSectionSystemId(group, sectionId, index);
  const completionDate =
    normalizeSectionValue(feature?.get("completionDate")) ||
    normalizeSectionValue(feature?.get("completion_date"));
  const relatedPartIds = normalizeIdCollection(
    feature?.get("relatedPartIds") ||
      feature?.get("relatedPartLotIds") ||
      feature?.get("partIds")
  );
  return {
    sectionId,
    title,
    group,
    systemId,
    completionDate,
    relatedPartIds,
  };
};

const applyLayerFilterState = (nextState = {}) => {
  if (!nextState || typeof nextState !== "object") return;
  if (typeof nextState.showBasemap === "boolean") {
    uiStore.setLayerVisibility("showBasemap", nextState.showBasemap);
  }
  if (typeof nextState.showLabels === "boolean") {
    uiStore.setLayerVisibility("showLabels", nextState.showLabels);
  }
  if (typeof nextState.showIntLand === "boolean") {
    uiStore.setLayerVisibility("showIntLand", nextState.showIntLand);
  }
  if (typeof nextState.showPartOfSites === "boolean") {
    uiStore.setLayerVisibility("showPartOfSites", nextState.showPartOfSites);
  }
  if (typeof nextState.showSections === "boolean") {
    uiStore.setLayerVisibility("showSections", nextState.showSections);
  }
  if (typeof nextState.showSiteBoundary === "boolean") {
    uiStore.setLayerVisibility("showSiteBoundary", nextState.showSiteBoundary);
  }
  if (typeof nextState.showWorkLots === "boolean") {
    uiStore.setLayerVisibility("showWorkLots", nextState.showWorkLots);
  }

  if (Object.prototype.hasOwnProperty.call(nextState, "workLotFilterMode")) {
    uiStore.setMapFilterMode("workLot", nextState.workLotFilterMode);
  }
  if (Object.prototype.hasOwnProperty.call(nextState, "siteBoundaryFilterMode")) {
    uiStore.setMapFilterMode("siteBoundary", nextState.siteBoundaryFilterMode);
  }
  if (Object.prototype.hasOwnProperty.call(nextState, "partOfSitesFilterMode")) {
    uiStore.setMapFilterMode("partOfSites", nextState.partOfSitesFilterMode);
  }
  if (Object.prototype.hasOwnProperty.call(nextState, "sectionFilterMode")) {
    uiStore.setMapFilterMode("section", nextState.sectionFilterMode);
  }

  if (Array.isArray(nextState.workLotSelectedIds)) {
    const ids = normalizeIdList(nextState.workLotSelectedIds);
    if (nextState.workLotFilterMode === "all") {
      uiStore.setMapFilterMode("workLot", "all");
    } else {
      uiStore.setMapSelectedIds("workLot", ids);
    }
  }
  if (Array.isArray(nextState.siteBoundarySelectedIds)) {
    const ids = normalizeIdList(nextState.siteBoundarySelectedIds);
    if (nextState.siteBoundaryFilterMode === "all") {
      uiStore.setMapFilterMode("siteBoundary", "all");
    } else {
      uiStore.setMapSelectedIds("siteBoundary", ids);
    }
  }
  if (Array.isArray(nextState.partOfSitesSelectedIds)) {
    const ids = normalizeIdList(nextState.partOfSitesSelectedIds);
    if (nextState.partOfSitesFilterMode === "all") {
      uiStore.setMapFilterMode("partOfSites", "all");
    } else {
      uiStore.setMapSelectedIds("partOfSites", ids);
    }
  }
  if (Array.isArray(nextState.sectionSelectedIds)) {
    const ids = normalizeIdList(nextState.sectionSelectedIds);
    if (nextState.sectionFilterMode === "all") {
      uiStore.setMapFilterMode("section", "all");
    } else {
      uiStore.setMapSelectedIds("section", ids);
    }
  }
};

const layerFilterState = computed({
  get: () => ({
    showBasemap: uiStore.showBasemap,
    showLabels: uiStore.showLabels,
    showIntLand: uiStore.showIntLand,
    showPartOfSites: uiStore.showPartOfSites,
    showSections: uiStore.showSections,
    showSiteBoundary: uiStore.showSiteBoundary,
    showWorkLots: uiStore.showWorkLots,
    workLotFilterMode: uiStore.workLotFilterMode,
    workLotSelectedIds: [...uiStore.workLotSelectedIds],
    siteBoundaryFilterMode: uiStore.siteBoundaryFilterMode,
    siteBoundarySelectedIds: [...uiStore.siteBoundarySelectedIds],
    partOfSitesFilterMode: uiStore.partOfSitesFilterMode,
    partOfSitesSelectedIds: [...uiStore.partOfSitesSelectedIds],
    sectionFilterMode: uiStore.sectionFilterMode,
    sectionSelectedIds: [...uiStore.sectionSelectedIds],
  }),
  set: (value) => applyLayerFilterState(value),
});

const layerFilterOptions = computed(() => {
  siteBoundarySourceVersion.value;
  partOfSitesSourceVersion.value;
  sectionSourceVersion.value;
  const workLots = [...workLotStore.workLots]
    .map((lot) => {
      const normalizedCategory = normalizeWorkLotCategory(lot.category ?? lot.type);
      const categoryCode =
        normalizedCategory === WORK_LOT_CATEGORY.BU
          ? "BU"
          : normalizedCategory === WORK_LOT_CATEGORY.HH
            ? "HH"
            : "GL";
      return {
        id: String(lot.id),
        label: lot.operatorName || "Work Lot",
        category: normalizedCategory,
        categoryLabel: workCategoryLabel(normalizedCategory),
        categoryCode,
        status: lot.status || "",
        dueDate: lot.dueDate || "",
      };
    })
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true }) ||
      a.id.localeCompare(b.id, undefined, { numeric: true })
    );

  const siteBoundaries = siteBoundarySource
    ? siteBoundarySource
        .getFeatures()
        .map((feature, index) => {
          const id = String(
            feature.getId() ?? feature.get("refId") ?? `site_boundary_${index + 1}`
          );
          return {
            id,
            label: feature.get("name") || "Site Boundary",
            boundaryStatus: feature.get("boundaryStatus") || "Pending Clearance",
            boundaryStatusKey: feature.get("boundaryStatusKey") || "PENDING_CLEARANCE",
            overdue: !!feature.get("overdue"),
          };
        })
        .sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { numeric: true }) ||
          a.id.localeCompare(b.id, undefined, { numeric: true })
        )
    : [];

  const partById = new Map();
  if (partOfSitesSource) {
    partOfSitesSource.getFeatures().forEach((feature, index) => {
      const meta = resolvePartOfSiteMeta(feature, index);
      if (partById.has(meta.partId)) return;
      partById.set(meta.partId, {
        id: meta.partId,
        label: meta.label,
        group: meta.group,
        systemId: meta.systemId,
        accessDate: meta.accessDate,
      });
    });
  }
  const partOfSites = Array.from(partById.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }) ||
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );
  const sectionById = new Map();
  if (sectionsSource) {
    sectionsSource.getFeatures().forEach((feature, index) => {
      const meta = resolveSectionMeta(feature, index);
      if (sectionById.has(meta.sectionId)) return;
      sectionById.set(meta.sectionId, {
        id: meta.sectionId,
        label: meta.title,
        group: meta.group,
        systemId: meta.systemId,
        partCount: Number(feature.get("partCount")) || meta.relatedPartIds.length || 0,
      });
    });
  }
  const sections = Array.from(sectionById.values()).sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }) ||
    a.id.localeCompare(b.id, undefined, { numeric: true })
  );

  return {
    workLots,
    siteBoundaries,
    partOfSites,
    sections,
  };
});

const sanitizeMapFilterSelections = () => {
  uiStore.sanitizeMapSelectedIds({
    workLotIds: layerFilterOptions.value.workLots.map((item) => item.id),
    siteBoundaryIds: layerFilterOptions.value.siteBoundaries.map((item) => item.id),
    partOfSitesIds: layerFilterOptions.value.partOfSites.map((item) => item.id),
    sectionIds: layerFilterOptions.value.sections.map((item) => item.id),
  });
};

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

const workLotResults = computed(() => {
  const query = workSearchQuery.value.trim();
  if (!query) {
    return [...workLotStore.workLots]
      .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
      .slice(0, 80);
  }
  return [...workLotStore.workLots]
    .filter((lot) =>
      fuzzyMatchAny(
        [
          lot.id,
          (lot.relatedSiteBoundaryIds || []).join(", "),
          lot.operatorName,
          workCategoryLabel(lot.category),
          lot.responsiblePerson,
          lot.assessDate,
          lot.dueDate,
          lot.completionDate,
          lot.floatMonths,
          lot.area,
          lot.status,
          lot.description,
          lot.remark,
        ],
        query
      )
    )
    .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))
    .slice(0, 80);
});

const partOfSitesResults = computed(() => {
  partOfSitesSourceVersion.value;
  if (!partOfSitesSource) return [];

  const partById = new Map();
  partOfSitesSource.getFeatures().forEach((feature, index) => {
    const meta = resolvePartOfSiteMeta(feature, index);
    if (partById.has(meta.partId)) return;
    partById.set(meta.partId, {
      id: meta.partId,
      title: meta.label,
      group: meta.group,
      systemId: meta.systemId,
      accessDate: meta.accessDate,
    });
  });

  const query = partOfSitesSearchQuery.value.trim();
  return Array.from(partById.values())
    .filter((item) =>
      fuzzyMatchAny(
        [item.id, item.title, item.group, item.systemId, item.accessDate],
        query
      )
    )
    .sort(
      (left, right) =>
        left.title.localeCompare(right.title, undefined, { numeric: true }) ||
        left.id.localeCompare(right.id, undefined, { numeric: true })
    )
    .slice(0, 120);
});
const sectionResults = computed(() => {
  sectionSourceVersion.value;
  if (!sectionsSource) return [];

  const sectionById = new Map();
  sectionsSource.getFeatures().forEach((feature, index) => {
    const meta = resolveSectionMeta(feature, index);
    if (sectionById.has(meta.sectionId)) return;
    const partCount = Number(feature.get("partCount"));
    sectionById.set(meta.sectionId, {
      id: meta.sectionId,
      title: meta.title,
      group: meta.group,
      systemId: meta.systemId,
      completionDate: meta.completionDate,
      partCount:
        Number.isFinite(partCount) && partCount >= 0
          ? partCount
          : meta.relatedPartIds.length,
    });
  });

  const query = sectionSearchQuery.value.trim();
  return Array.from(sectionById.values())
    .filter((item) =>
      fuzzyMatchAny(
        [
          item.id,
          item.title,
          item.group,
          item.systemId,
          item.completionDate,
          item.partCount,
        ],
        query
      )
    )
    .sort(
      (left, right) =>
        left.title.localeCompare(right.title, undefined, { numeric: true }) ||
        left.id.localeCompare(right.id, undefined, { numeric: true })
    )
    .slice(0, 120);
});

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
  partOfSiteForm.value = createPartOfSiteEditForm(part);
  showPartOfSiteDialog.value = true;
};

const editSelectedSection = () => {
  if (!canEditWork.value || !selectedSection.value) return;
  const section = selectedSection.value;
  sectionDialogMode.value = "edit";
  editingSectionId.value = String(section.sectionId || "");
  sectionForm.value = createSectionEditForm(section);
  showSectionDialog.value = true;
};

const applyPartOfSiteAttributeUpdate = (partId, payload = {}) => {
  const normalizedPartId = normalizePartValue(partId);
  if (!normalizedPartId) return false;
  const feature = findPartOfSitesFeatureById(normalizedPartId);
  if (!feature) return false;

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
      ...payload,
    });
  }
  return true;
};

const applySectionAttributeUpdate = (sectionId, payload = {}) => {
  const normalizedSectionId = normalizeSectionValue(sectionId);
  if (!normalizedSectionId) return false;
  const feature = findSectionFeatureById(normalizedSectionId);
  if (!feature) return false;

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
      ...payload,
    });
  }
  return true;
};

const startSiteBoundaryDrawCreate = () => {
  siteBoundaryDialogMode.value = "create";
  editingSiteBoundaryId.value = "";
  resetSiteBoundaryForm();
};

const siteBoundarySourceVersion = ref(0);
const partOfSitesSourceVersion = ref(0);
const sectionSourceVersion = ref(0);
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

const findPartOfSitesFeatureById = (id) => {
  if (!id) return null;
  return getPartOfSitesFeatureById(id);
};
const findSectionFeatureById = (id) => {
  if (!id) return null;
  return getSectionFeatureById(id);
};
const syncSectionPartRelations = () => {
  if (!sectionsSource || !partOfSitesSource) {
    partGeometryStatsById.value = new Map();
    sectionGeometryStatsById.value = new Map();
    return;
  }
  const sectionFeatures = sectionsSource.getFeatures();
  const partFeatures = partOfSitesSource.getFeatures();
  const nextPartGeometryStats =
    partFeatures.length > 0
      ? buildResolvedPartGeometryStats({
          features: partFeatures,
          resolvePartId: (feature, index) => resolvePartOfSiteMeta(feature, index).partId,
        })
      : new Map();
  partGeometryStatsById.value = nextPartGeometryStats;
  const nextSectionGeometryStats =
    sectionFeatures.length > 0
      ? buildResolvedPartGeometryStats({
          features: sectionFeatures,
          resolvePartId: (feature, index) => resolveSectionMeta(feature, index).sectionId,
        })
      : new Map();
  sectionGeometryStatsById.value = nextSectionGeometryStats;
  if (!sectionFeatures.length || !partFeatures.length) {
    sectionFeatures.forEach((sectionFeature) => {
      sectionFeature.set("relatedPartIds", []);
      sectionFeature.set("partCount", 0);
    });
    partFeatures.forEach((partFeature) => {
      partFeature.set("sectionIds", []);
      partFeature.set("sectionId", "");
    });
    return;
  }

  const sectionById = new Map();
  const sectionToPartIds = new Map();
  const fallbackSectionIds = new Set();
  const partToSectionIds = new Map();
  const ensureSectionBinding = (sectionId, partId) => {
    const normalizedSectionId = String(sectionId || "").trim();
    const normalizedPartId = String(partId || "").trim();
    if (!normalizedSectionId || !normalizedPartId) return;
    if (!sectionById.has(normalizedSectionId.toLowerCase())) return;
    if (!sectionToPartIds.has(normalizedSectionId)) {
      sectionToPartIds.set(normalizedSectionId, new Set());
    }
    sectionToPartIds.get(normalizedSectionId).add(normalizedPartId);
    if (!partToSectionIds.has(normalizedPartId)) {
      partToSectionIds.set(normalizedPartId, new Set());
    }
    partToSectionIds.get(normalizedPartId).add(normalizedSectionId);
  };

  sectionFeatures.forEach((feature, index) => {
    const sectionMeta = resolveSectionMeta(feature, index);
    sectionById.set(sectionMeta.sectionId.toLowerCase(), {
      sectionId: sectionMeta.sectionId,
      feature,
    });
    sectionToPartIds.set(sectionMeta.sectionId, new Set(sectionMeta.relatedPartIds));
    if (sectionMeta.relatedPartIds.length === 0) {
      fallbackSectionIds.add(sectionMeta.sectionId.toLowerCase());
    }
  });

  // Seed reverse mapping from explicit section -> part relationships.
  sectionToPartIds.forEach((partIds, sectionId) => {
    if (!(partIds instanceof Set) || partIds.size === 0) return;
    partIds.forEach((partId) => {
      const normalizedPartId = String(partId || "").trim();
      if (!normalizedPartId) return;
      if (!partToSectionIds.has(normalizedPartId)) {
        partToSectionIds.set(normalizedPartId, new Set());
      }
      partToSectionIds.get(normalizedPartId).add(sectionId);
    });
  });

  partFeatures.forEach((feature, index) => {
    const bindingSource = String(feature.get("sectionBindingSource") || "")
      .trim()
      .toLowerCase();
    // Ignore previous auto-generated bindings as explicit input.
    if (bindingSource === "auto") return;
    const partMeta = resolvePartOfSiteMeta(feature, index);
    const explicitSectionIds = normalizeIdCollection(
      feature.get("sectionIds") || feature.get("relatedSectionIds")
    );
    const sectionIdCandidates = partMeta.sectionId
      ? [partMeta.sectionId, ...explicitSectionIds]
      : explicitSectionIds;
    sectionIdCandidates.forEach((sectionId) => ensureSectionBinding(sectionId, partMeta.partId));
  });

  partFeatures.forEach((feature, index) => {
    const partMeta = resolvePartOfSiteMeta(feature, index);
    const normalizedPartId = partMeta.partId;
    const existing = partToSectionIds.get(normalizedPartId);
    if (existing && existing.size > 0) return;
    const partGeometry =
      getResolvedPartGeometryStat(nextPartGeometryStats, normalizedPartId)?.geometry ||
      feature.getGeometry();
    if (!partGeometry) return;
    sectionFeatures.forEach((sectionFeature, sectionIndex) => {
      const sectionMeta = resolveSectionMeta(sectionFeature, sectionIndex);
      if (!fallbackSectionIds.has(sectionMeta.sectionId.toLowerCase())) return;
      const sectionGeometry =
        getSectionGeometryStatById(sectionMeta.sectionId)?.geometry ||
        sectionFeature.getGeometry();
      if (!sectionGeometry) return;
      if (!geometriesOverlapByArea(partGeometry, sectionGeometry)) return;
      const overlapArea = getGeometriesIntersectionArea(partGeometry, sectionGeometry);
      if (overlapArea < SECTION_PART_RELATION_MIN_OVERLAP_AREA) return;
      ensureSectionBinding(sectionMeta.sectionId, normalizedPartId);
    });
  });

  sectionFeatures.forEach((feature, index) => {
    const sectionMeta = resolveSectionMeta(feature, index);
    const relatedIds = Array.from(
      sectionToPartIds.get(sectionMeta.sectionId) || []
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    feature.set("relatedPartIds", relatedIds);
    feature.set("partCount", relatedIds.length);
  });

  partFeatures.forEach((feature, index) => {
    const partMeta = resolvePartOfSiteMeta(feature, index);
    const sectionIds = Array.from(
      partToSectionIds.get(partMeta.partId) || []
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    feature.set("sectionIds", sectionIds);
    feature.set("sectionId", sectionIds[0] || "");
    feature.set("sectionBindingSource", "auto");
  });
};

const selectedSiteBoundary = computed(() => {
  siteBoundarySourceVersion.value;
  const id = uiStore.selectedSiteBoundaryId;
  const feature = findSiteBoundaryFeatureById(id);
  if (!feature) return null;
  const geometry = feature.getGeometry();
  const area =
    feature.get("area") ??
    (geometry && typeof geometry.getArea === "function" ? geometry.getArea() : null);
  const normalizedBoundaryId = String(feature.getId() ?? id);
  const relatedWorkLotIds = workLotStore.workLots
    .filter((lot) => {
      const relatedIds = Array.isArray(lot.relatedSiteBoundaryIds)
        ? lot.relatedSiteBoundaryIds
        : [];
      const normalizedBoundaryIdLower = normalizedBoundaryId.toLowerCase();
      return relatedIds.some(
        (relatedId) => String(relatedId).toLowerCase() === normalizedBoundaryIdLower
      );
    })
    .map((lot) => String(lot.id));
  return {
    id: normalizedBoundaryId,
    name: feature.get("name") ?? "",
    layer: feature.get("layer") ?? "—",
    entity: feature.get("entity") ?? "Polygon",
    area,
    contractNo: feature.get("contractNo") ?? "",
    futureUse: feature.get("futureUse") ?? "",
    completionDate: feature.get("completionDate") ?? "",
    others: feature.get("others") ?? "",
    plannedHandoverDate: feature.get("plannedHandoverDate") ?? "",
    handoverProgress: feature.get("handoverProgress") ?? 0,
    operatorTotal: feature.get("operatorTotal") ?? 0,
    operatorCompleted: feature.get("operatorCompleted") ?? 0,
    boundaryStatus: feature.get("boundaryStatus") ?? "Pending Clearance",
    boundaryStatusKey: feature.get("kpiStatus") ?? "PENDING_CLEARANCE",
    categoryAreasHectare: feature.get("categoryAreasHectare") ?? { BU: 0, HH: 0, GL: 0 },
    overdue: !!feature.get("overdue"),
    relatedWorkLotIds,
  };
});

const selectedPartOfSite = computed(() => {
  partOfSitesSourceVersion.value;
  const id = uiStore.selectedPartOfSiteId;
  const feature = findPartOfSitesFeatureById(id);
  if (!feature) return null;
  const meta = resolvePartOfSiteMeta(feature);
  const geometry = feature.getGeometry();
  const rawArea =
    geometry && typeof geometry.getArea === "function" ? Math.abs(geometry.getArea()) : 0;
  const partGeometryStat = getPartGeometryStatById(meta.partId);
  const effectiveArea =
    Number.isFinite(partGeometryStat?.area) && partGeometryStat.area >= 0
      ? partGeometryStat.area
      : rawArea;
  const storedRawArea =
    Number.isFinite(partGeometryStat?.rawArea) && partGeometryStat.rawArea >= 0
      ? partGeometryStat.rawArea
      : rawArea;
  const overlapArea =
    Number.isFinite(partGeometryStat?.overlapArea) && partGeometryStat.overlapArea >= 0
      ? partGeometryStat.overlapArea
      : Math.max(0, storedRawArea - effectiveArea);
  const overrideArea = getPartAreaOverride(meta.partId);
  const featureArea = normalizePositiveNumber(feature.get("area"));
  const areaValue = overrideArea ?? featureArea ?? effectiveArea;

  return {
    partId: meta.partId,
    id: meta.systemId,
    title: meta.label,
    accessDate: meta.accessDate,
    sectionId: meta.sectionId,
    sectionIds: meta.sectionIds,
    area: areaValue,
    rawArea: storedRawArea,
    overlapArea,
    areaAdjusted: !!partGeometryStat?.wasAdjusted,
  };
});
const selectedSection = computed(() => {
  sectionSourceVersion.value;
  const id = uiStore.selectedSectionId;
  const feature = findSectionFeatureById(id);
  if (!feature) return null;
  const meta = resolveSectionMeta(feature);
  const partCount = Number(feature.get("partCount"));
  const geometry = feature.getGeometry();
  const rawArea =
    geometry && typeof geometry.getArea === "function" ? Math.abs(geometry.getArea()) : 0;
  const sectionGeometryStat = getSectionGeometryStatById(meta.sectionId);
  const effectiveArea =
    Number.isFinite(sectionGeometryStat?.area) && sectionGeometryStat.area >= 0
      ? sectionGeometryStat.area
      : rawArea;
  const storedRawArea =
    Number.isFinite(sectionGeometryStat?.rawArea) && sectionGeometryStat.rawArea >= 0
      ? sectionGeometryStat.rawArea
      : rawArea;
  const overlapArea =
    Number.isFinite(sectionGeometryStat?.overlapArea) && sectionGeometryStat.overlapArea >= 0
      ? sectionGeometryStat.overlapArea
      : Math.max(0, storedRawArea - effectiveArea);
  const overrideArea = getSectionAreaOverride(meta.sectionId);
  const featureArea = normalizePositiveNumber(feature.get("area"));
  const areaValue = overrideArea ?? featureArea ?? effectiveArea;
  return {
    id: meta.systemId,
    sectionId: meta.sectionId,
    title: meta.title,
    group: meta.group,
    completionDate: meta.completionDate,
    partCount:
      Number.isFinite(partCount) && partCount >= 0 ? partCount : meta.relatedPartIds.length,
    relatedPartIds: meta.relatedPartIds,
    area: areaValue,
    rawArea: storedRawArea,
    overlapArea,
    areaAdjusted: !!sectionGeometryStat?.wasAdjusted,
  };
});

const selectedWorkLotRelatedSites = computed(() => {
  siteBoundarySourceVersion.value;
  const lot = selectedWorkLot.value;
  if (!lot) return [];
  const relatedSiteBoundaryIds = withRelatedIdFallback(
    resolveRelatedSiteBoundaryIdsByGeometryObject(lot.geometry),
    lot.relatedSiteBoundaryIds
  );
  return Array.from(
    new Set((relatedSiteBoundaryIds || []).map((item) => String(item)).filter(Boolean))
  )
    .map((siteBoundaryId) => {
      const feature = findSiteBoundaryFeatureById(siteBoundaryId);
      return {
        id: String(feature?.getId() ?? siteBoundaryId),
        name: feature?.get("name") ?? "",
        status: feature?.get("boundaryStatus") ?? "Pending Clearance",
        statusKey: feature?.get("kpiStatus") ?? "PENDING_CLEARANCE",
        plannedHandoverDate: feature?.get("plannedHandoverDate") ?? "",
        overdue: !!feature?.get("overdue"),
      };
    })
    .sort(
      (a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }) ||
        a.id.localeCompare(b.id, undefined, { numeric: true })
    );
});

const selectedSiteBoundaryRelatedWorkLots = computed(() => {
  const siteBoundaryId = selectedSiteBoundary.value?.id;
  if (!siteBoundaryId) return [];
  const normalizedSiteBoundaryId = String(siteBoundaryId).toLowerCase();
  return workLotStore.workLots
    .filter((lot) => {
      const relatedIds = Array.isArray(lot.relatedSiteBoundaryIds)
        ? lot.relatedSiteBoundaryIds
        : [];
      return relatedIds.some(
        (relatedId) => String(relatedId).toLowerCase() === normalizedSiteBoundaryId
      );
    })
    .map((lot) => ({
      id: String(lot.id),
      operatorName: lot.operatorName || "Work Lot",
      status: lot.status || WORK_LOT_STATUS.WAITING_ASSESSMENT,
      dueDate: lot.dueDate || "",
    }))
    .sort((a, b) => {
      const dueA = a.dueDate || "9999-12-31";
      const dueB = b.dueDate || "9999-12-31";
      return (
        dueA.localeCompare(dueB) ||
        a.operatorName.localeCompare(b.operatorName, undefined, { numeric: true })
      );
    });
});
const selectedPartOfSiteRelatedSections = computed(() => {
  const partId = selectedPartOfSite.value?.partId;
  if (!partId) return [];
  sectionSourceVersion.value;
  const explicitRelatedIds = normalizeIdCollection(selectedPartOfSite.value?.sectionIds);

  const relatedById = new Map();
  if (explicitRelatedIds.length > 0) {
    explicitRelatedIds.forEach((sectionId) => {
      const normalizedSectionId = String(sectionId || "").trim();
      if (!normalizedSectionId) return;
      const key = normalizedSectionId.toLowerCase();
      if (relatedById.has(key)) return;
      const feature = findSectionFeatureById(normalizedSectionId);
      if (feature) {
        const meta = resolveSectionMeta(feature);
        relatedById.set(key, {
          id: meta.sectionId,
          title: meta.title,
          group: meta.group,
          systemId: meta.systemId,
        });
        return;
      }
      relatedById.set(key, {
        id: normalizedSectionId,
        title: normalizedSectionId,
        group: "",
        systemId: "",
      });
    });
  } else {
    const normalizedPartId = partId.toLowerCase();
    sectionsSource?.getFeatures().forEach((feature, index) => {
      const meta = resolveSectionMeta(feature, index);
      const relatedPartIds = meta.relatedPartIds.map((value) => String(value).toLowerCase());
      if (!relatedPartIds.includes(normalizedPartId)) return;
      const key = String(meta.sectionId || "").toLowerCase();
      if (!key || relatedById.has(key)) return;
      relatedById.set(key, {
        id: meta.sectionId,
        title: meta.title,
        group: meta.group,
        systemId: meta.systemId,
      });
    });
  }
  return Array.from(relatedById.values()).sort(
    (a, b) =>
      a.title.localeCompare(b.title, undefined, { numeric: true }) ||
      a.id.localeCompare(b.id, undefined, { numeric: true })
  );
});
const selectedSectionRelatedPartOfSites = computed(() => {
  const sectionId = selectedSection.value?.sectionId;
  if (!sectionId) return [];
  partOfSitesSourceVersion.value;
  const explicitRelatedIds = normalizeIdCollection(selectedSection.value?.relatedPartIds);

  const relatedById = new Map();
  if (explicitRelatedIds.length > 0) {
    explicitRelatedIds.forEach((partId) => {
      const normalizedPartId = String(partId || "").trim();
      if (!normalizedPartId) return;
      const key = normalizedPartId.toLowerCase();
      if (relatedById.has(key)) return;
      const feature = findPartOfSitesFeatureById(normalizedPartId);
      if (feature) {
        const meta = resolvePartOfSiteMeta(feature);
        relatedById.set(key, {
          id: meta.partId,
          title: meta.label,
          group: meta.group,
          systemId: meta.systemId,
        });
        return;
      }
      relatedById.set(key, {
        id: normalizedPartId,
        title: normalizedPartId,
        group: "",
        systemId: "",
      });
    });
  } else {
    const normalizedSectionId = sectionId.toLowerCase();
    partOfSitesSource?.getFeatures().forEach((feature, index) => {
      const meta = resolvePartOfSiteMeta(feature, index);
      const sectionIds = meta.sectionIds.map((value) => String(value).toLowerCase());
      if (!sectionIds.includes(normalizedSectionId)) return;
      const key = String(meta.partId || "").toLowerCase();
      if (!key || relatedById.has(key)) return;
      relatedById.set(key, {
        id: meta.partId,
        title: meta.label,
        group: meta.group,
        systemId: meta.systemId,
      });
    });
  }
  return Array.from(relatedById.values()).sort(
    (a, b) =>
      a.title.localeCompare(b.title, undefined, { numeric: true }) ||
      a.id.localeCompare(b.id, undefined, { numeric: true })
  );
});

const siteBoundaryResults = computed(() => {
  siteBoundarySourceVersion.value;
  if (!siteBoundarySource) return [];

  const workLotCountByBoundaryId = workLotStore.workLots.reduce((map, lot) => {
    const relatedIds = Array.isArray(lot?.relatedSiteBoundaryIds)
      ? lot.relatedSiteBoundaryIds
      : [];
    relatedIds
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean)
      .forEach((normalizedId) => {
        map.set(normalizedId, (map.get(normalizedId) || 0) + 1);
      });
    return map;
  }, new Map());

  const query = siteBoundarySearchQuery.value.trim().toLowerCase();
  return siteBoundarySource
    .getFeatures()
    .map((feature, index) => {
      const id = String(feature.getId() ?? `site_boundary_${String(index + 1).padStart(5, "0")}`);
      const fallbackCount = Number(feature.get("operatorTotal"));
      const mappedCount = workLotCountByBoundaryId.get(id.toLowerCase());
      const workLotCount = Number.isFinite(mappedCount)
        ? mappedCount
        : Number.isFinite(fallbackCount)
          ? fallbackCount
          : 0;

      return {
        id,
        name: feature.get("name") ?? "",
        plannedHandoverDate: feature.get("plannedHandoverDate") ?? "",
        boundaryStatus: feature.get("boundaryStatus") ?? "Pending Clearance",
        boundaryStatusKey: feature.get("kpiStatus") ?? "PENDING_CLEARANCE",
        overdue: !!feature.get("overdue"),
        workLotCount,
      };
    })
    .filter((item) => {
      if (!query) return true;
      return (
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.boundaryStatus.toLowerCase().includes(query) ||
        item.plannedHandoverDate.toLowerCase().includes(query) ||
        String(item.workLotCount).includes(query)
      );
    })
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
});

const scopeWorkLotResults = computed(() => {
  if (!scopeWorkLotIds.value.length) return [];
  const byId = new Map(workLotStore.workLots.map((lot) => [String(lot.id), lot]));
  return scopeWorkLotIds.value.map((id) => byId.get(String(id))).filter(Boolean);
});

const scopeSiteBoundaryResults = computed(() => {
  siteBoundarySourceVersion.value;
  if (!scopeSiteBoundaryIds.value.length) return [];

  return scopeSiteBoundaryIds.value
    .map((id) => findSiteBoundaryFeatureById(id))
    .filter(Boolean)
    .map((feature) => ({
      id: String(feature.getId() ?? feature.get("refId")),
      name: feature.get("name") ?? "",
    }))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
});

const scopePartOfSitesResults = computed(() => {
  partOfSitesSourceVersion.value;
  if (!scopePartOfSitesIds.value.length) return [];

  return scopePartOfSitesIds.value
    .map((id) => findPartOfSitesFeatureById(id))
    .filter(Boolean)
    .map((feature, index) => {
      const meta = resolvePartOfSiteMeta(feature, index);
      return {
        id: meta.partId,
        title: meta.label,
        group: meta.group,
        systemId: meta.systemId,
      };
    })
    .sort(
      (left, right) =>
        left.title.localeCompare(right.title, undefined, { numeric: true }) ||
        left.id.localeCompare(right.id, undefined, { numeric: true })
    );
});
const scopeSectionResults = computed(() => {
  sectionSourceVersion.value;
  if (!scopeSectionIds.value.length) return [];

  return scopeSectionIds.value
    .map((id) => findSectionFeatureById(id))
    .filter(Boolean)
    .map((feature, index) => {
      const meta = resolveSectionMeta(feature, index);
      return {
        id: meta.sectionId,
        title: meta.title,
        group: meta.group,
        systemId: meta.systemId,
      };
    })
    .sort(
      (left, right) =>
        left.title.localeCompare(right.title, undefined, { numeric: true }) ||
        left.id.localeCompare(right.id, undefined, { numeric: true })
    );
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

const getQueryValue = (value) => (Array.isArray(value) ? value[0] : value ?? null);

const fitToSiteBoundary = () => {
  if (!mapRef.value || !siteBoundarySource) return;
  const extent = siteBoundarySource.getExtent();
  if (!extent || isEmptyExtent(extent)) return;
  mapRef.value.getView().fit(extent, {
    padding: [80, 80, 80, 80],
    duration: 600,
    maxZoom: 17,
  });
};

const applyFocusFromRoute = () => {
  if (!mapRef.value) return;

  const workLotId = getQueryValue(route.query.workLotId);
  const siteBoundaryId = getQueryValue(route.query.siteBoundaryId);
  const partOfSiteId = getQueryValue(route.query.partOfSiteId);
  const sectionId = getQueryValue(route.query.sectionId);

  if (!workLotId && !siteBoundaryId && !partOfSiteId && !sectionId) return;

  if (uiStore.tool !== "PAN") {
    uiStore.setTool("PAN");
  }

  if (workLotId) {
    zoomToWorkLot(workLotId);
    return;
  }

  if (siteBoundaryId) {
    zoomToSiteBoundary(siteBoundaryId);
    return;
  }

  if (partOfSiteId) {
    zoomToPartOfSite(partOfSiteId);
    return;
  }

  if (sectionId) {
    zoomToSection(sectionId);
  }
};

const isIdSelected = (ids = [], id) => {
  const normalized = String(id || "").trim().toLowerCase();
  if (!normalized) return false;
  return ids.some((item) => String(item || "").trim().toLowerCase() === normalized);
};

const normalizeFocusToken = (value) => String(value || "").trim().toLowerCase();
const activeMapFocus = ref(null);
const focusMapTarget = computed(() =>
  activeMapFocus.value
    ? { group: activeMapFocus.value.group, id: activeMapFocus.value.id }
    : null
);

const forceApplyLayerVisibilityAndFilters = () => {
  updateLayerVisibility(basemapLayer.value, labelLayer.value);
  refreshLayerFilters();
  updateHighlightVisibility();
  refreshHighlights();
};

const captureFocusSnapshot = () => ({
  showIntLand: uiStore.showIntLand,
  showWorkLots: uiStore.showWorkLots,
  showWorkLotsBusiness: uiStore.showWorkLotsBusiness,
  showWorkLotsDomestic: uiStore.showWorkLotsDomestic,
  showWorkLotsGovernment: uiStore.showWorkLotsGovernment,
  showSiteBoundary: uiStore.showSiteBoundary,
  showPartOfSites: uiStore.showPartOfSites,
  showSections: uiStore.showSections,
  workLotFilterMode: uiStore.workLotFilterMode,
  workLotSelectedIds: [...uiStore.workLotSelectedIds],
  siteBoundaryFilterMode: uiStore.siteBoundaryFilterMode,
  siteBoundarySelectedIds: [...uiStore.siteBoundarySelectedIds],
  partOfSitesFilterMode: uiStore.partOfSitesFilterMode,
  partOfSitesSelectedIds: [...uiStore.partOfSitesSelectedIds],
  sectionFilterMode: uiStore.sectionFilterMode,
  sectionSelectedIds: [...uiStore.sectionSelectedIds],
});

const restoreFocusSnapshot = (snapshot) => {
  if (!snapshot) return;
  applyLayerFilterState(snapshot);
  if (typeof snapshot.showWorkLotsBusiness === "boolean") {
    uiStore.setLayerVisibility("showWorkLotsBusiness", snapshot.showWorkLotsBusiness);
  }
  if (typeof snapshot.showWorkLotsDomestic === "boolean") {
    uiStore.setLayerVisibility("showWorkLotsDomestic", snapshot.showWorkLotsDomestic);
  }
  if (typeof snapshot.showWorkLotsGovernment === "boolean") {
    uiStore.setLayerVisibility("showWorkLotsGovernment", snapshot.showWorkLotsGovernment);
  }
  forceApplyLayerVisibilityAndFilters();
};

let focusStateMutationLock = false;
const runWithFocusStateLock = (task) => {
  focusStateMutationLock = true;
  try {
    task();
  } finally {
    focusStateMutationLock = false;
  }
};

const clearActiveMapFocus = ({ restoreSnapshot = false } = {}) => {
  if (!activeMapFocus.value) return;
  const snapshot = activeMapFocus.value.snapshot || null;
  activeMapFocus.value = null;
  if (restoreSnapshot && snapshot) {
    runWithFocusStateLock(() => {
      restoreFocusSnapshot(snapshot);
    });
  }
};

const handleSidePanelClose = () => {
  if (!activeMapFocus.value) return;
  clearActiveMapFocus({ restoreSnapshot: true });
};

const resetFocusOnMapFilters = () => {
  uiStore.setLayerVisibility("showIntLand", false);
  uiStore.setLayerVisibility("showWorkLots", false);
  uiStore.setLayerVisibility("showSiteBoundary", false);
  uiStore.setLayerVisibility("showPartOfSites", false);
  uiStore.setLayerVisibility("showSections", false);
  uiStore.setMapFilterMode("workLot", "all");
  uiStore.setMapFilterMode("siteBoundary", "all");
  uiStore.setMapFilterMode("partOfSites", "all");
  uiStore.setMapFilterMode("section", "all");
};

const applyFocusOnMapTarget = (group, targetId) => {
  const normalizedTargetId = String(targetId || "").trim();
  if (!normalizedTargetId) return;
  runWithFocusStateLock(() => {
    resetFocusOnMapFilters();
    if (group === "workLot") {
      uiStore.setLayerVisibility("showWorkLots", true);
      uiStore.setMapSelectedIds("workLot", [normalizedTargetId]);
    }
    if (group === "siteBoundary") {
      uiStore.setLayerVisibility("showSiteBoundary", true);
      uiStore.setMapSelectedIds("siteBoundary", [normalizedTargetId]);
    }
    if (group === "partOfSites") {
      uiStore.setLayerVisibility("showPartOfSites", true);
      uiStore.setMapSelectedIds("partOfSites", [normalizedTargetId]);
    }
    if (group === "section") {
      uiStore.setLayerVisibility("showSections", true);
      uiStore.setMapSelectedIds("section", [normalizedTargetId]);
    }
    forceApplyLayerVisibilityAndFilters();
  });
  if (group === "workLot") zoomToWorkLot(normalizedTargetId);
  if (group === "siteBoundary") zoomToSiteBoundary(normalizedTargetId);
  if (group === "partOfSites") zoomToPartOfSite(normalizedTargetId);
  if (group === "section") zoomToSection(normalizedTargetId);
};

const toggleFocusOnMapTarget = (group, targetId) => {
  const normalizedTargetId = String(targetId || "").trim();
  if (!normalizedTargetId) return;
  const currentGroup = activeMapFocus.value?.group || "";
  const currentId = normalizeFocusToken(activeMapFocus.value?.id);
  if (currentGroup === group && currentId === normalizeFocusToken(normalizedTargetId)) {
    clearActiveMapFocus({ restoreSnapshot: true });
    return;
  }
  const snapshot = activeMapFocus.value?.snapshot || captureFocusSnapshot();
  activeMapFocus.value = {
    group,
    id: normalizedTargetId,
    snapshot,
  };
  applyFocusOnMapTarget(group, normalizedTargetId);
};

const focusOnMapWorkLot = (id) => {
  const lot = workLotStore.workLots.find((item) => String(item.id) === String(id || "").trim());
  if (!lot) return;
  toggleFocusOnMapTarget("workLot", String(lot.id));
};

const focusOnMapSiteBoundary = (id) => {
  const feature = findSiteBoundaryFeatureById(id);
  if (!feature) return;
  const selectedId = String(feature.getId() ?? id ?? "").trim();
  if (!selectedId) return;
  toggleFocusOnMapTarget("siteBoundary", selectedId);
};

const focusOnMapPartOfSite = (id) => {
  const feature = findPartOfSitesFeatureById(id);
  if (!feature) return;
  const meta = resolvePartOfSiteMeta(feature);
  const selectedId = String(meta.partId || "").trim();
  if (!selectedId) return;
  toggleFocusOnMapTarget("partOfSites", selectedId);
};

const focusOnMapSection = (id) => {
  const feature = findSectionFeatureById(id);
  if (!feature) return;
  const meta = resolveSectionMeta(feature);
  const selectedId = String(meta.sectionId || "").trim();
  if (!selectedId) return;
  toggleFocusOnMapTarget("section", selectedId);
};

const isSingleFocusSelection = (mode, ids, targetId) => {
  if (mode !== "custom") return false;
  const normalizedSelected = normalizeIdList(ids).map((item) => normalizeFocusToken(item));
  if (normalizedSelected.length !== 1) return false;
  return normalizedSelected[0] === normalizeFocusToken(targetId);
};

const isActiveFocusStateValid = () => {
  if (!activeMapFocus.value) return true;
  const { group, id } = activeMapFocus.value;
  const othersHidden =
    !uiStore.showIntLand &&
    (group === "workLot" ? true : !uiStore.showWorkLots) &&
    (group === "siteBoundary" ? true : !uiStore.showSiteBoundary) &&
    (group === "partOfSites" ? true : !uiStore.showPartOfSites) &&
    (group === "section" ? true : !uiStore.showSections);
  if (!othersHidden) return false;

  if (group === "workLot") {
    if (!uiStore.showWorkLots) return false;
    if (!isSingleFocusSelection(uiStore.workLotFilterMode, uiStore.workLotSelectedIds, id)) {
      return false;
    }
    const lot = workLotStore.workLots.find(
      (item) => normalizeFocusToken(item.id) === normalizeFocusToken(id)
    );
    if (!lot) return false;
    const category = normalizeWorkLotCategory(lot.category ?? lot.type);
    if (category === WORK_LOT_CATEGORY.BU && !uiStore.showWorkLotsBusiness) return false;
    if (category === WORK_LOT_CATEGORY.HH && !uiStore.showWorkLotsDomestic) return false;
    if (category === WORK_LOT_CATEGORY.GL && !uiStore.showWorkLotsGovernment) return false;
    return true;
  }
  if (group === "siteBoundary") {
    return (
      uiStore.showSiteBoundary &&
      isSingleFocusSelection(uiStore.siteBoundaryFilterMode, uiStore.siteBoundarySelectedIds, id)
    );
  }
  if (group === "partOfSites") {
    return (
      uiStore.showPartOfSites &&
      isSingleFocusSelection(uiStore.partOfSitesFilterMode, uiStore.partOfSitesSelectedIds, id)
    );
  }
  if (group === "section") {
    return (
      uiStore.showSections &&
      isSingleFocusSelection(uiStore.sectionFilterMode, uiStore.sectionSelectedIds, id)
    );
  }
  return false;
};

const zoomToWorkLot = (id) => {
  if (!mapRef.value) return;
  const lot = workLotStore.workLots.find((item) => String(item.id) === String(id));
  if (lot) {
    const category = normalizeWorkLotCategory(lot.category ?? lot.type);
    if (!uiStore.showWorkLots) {
      uiStore.setLayerVisibility("showWorkLots", true);
    }
    if (category === WORK_LOT_CATEGORY.BU && !uiStore.showWorkLotsBusiness) {
      uiStore.setLayerVisibility("showWorkLotsBusiness", true);
    }
    if (category === WORK_LOT_CATEGORY.HH && !uiStore.showWorkLotsDomestic) {
      uiStore.setLayerVisibility("showWorkLotsDomestic", true);
    }
    if (category === WORK_LOT_CATEGORY.GL && !uiStore.showWorkLotsGovernment) {
      uiStore.setLayerVisibility("showWorkLotsGovernment", true);
    }
    if (
      uiStore.workLotFilterMode === "custom" &&
      !isIdSelected(uiStore.workLotSelectedIds, lot.id)
    ) {
      uiStore.ensureMapSelectedId("workLot", lot.id);
    }
  }
  const view = mapRef.value.getView();
  const feature = getWorkFeatureById(id) || createWorkFeature(lot);
  if (!feature) return;
  const extent = feature.getGeometry().getExtent();
  view.fit(extent, { padding: [80, 80, 80, 80], duration: 500, maxZoom: 18 });
  uiStore.selectWorkLot(id);
};

const zoomToSiteBoundary = (id) => {
  if (!mapRef.value || !siteBoundarySource) return;
  if (!uiStore.showSiteBoundary) {
    uiStore.setLayerVisibility("showSiteBoundary", true);
  }
  const view = mapRef.value.getView();
  const feature = findSiteBoundaryFeatureById(id);
  if (!feature) return;
  const selectedId = String(feature.getId() ?? id);
  if (
    uiStore.siteBoundaryFilterMode === "custom" &&
    !isIdSelected(uiStore.siteBoundarySelectedIds, selectedId)
  ) {
    uiStore.ensureMapSelectedId("siteBoundary", selectedId);
  }
  const extent = feature.getGeometry().getExtent();
  view.fit(extent, { padding: [80, 80, 80, 80], duration: 500, maxZoom: 18 });
  uiStore.selectSiteBoundary(selectedId);
  refreshHighlights();
};

const zoomToPartOfSite = (id) => {
  if (!mapRef.value || !partOfSitesSource) return;
  if (!uiStore.showPartOfSites) {
    uiStore.setLayerVisibility("showPartOfSites", true);
  }
  const feature = findPartOfSitesFeatureById(id);
  if (!feature) return;
  const meta = resolvePartOfSiteMeta(feature);
  if (
    uiStore.partOfSitesFilterMode === "custom" &&
    !isIdSelected(uiStore.partOfSitesSelectedIds, meta.partId)
  ) {
    uiStore.ensureMapSelectedId("partOfSites", meta.partId);
  }
  const geometry = getPartGeometryStatById(meta.partId)?.geometry || feature.getGeometry();
  if (!geometry) return;
  const extent = geometry.getExtent();
  mapRef.value.getView().fit(extent, {
    padding: [80, 80, 80, 80],
    duration: 500,
    maxZoom: 18,
  });
  uiStore.selectPartOfSite(meta.partId);
  refreshHighlights();
};
const zoomToSection = (id) => {
  if (!mapRef.value || !sectionsSource) return;
  if (!uiStore.showSections) {
    uiStore.setLayerVisibility("showSections", true);
  }
  const feature = findSectionFeatureById(id);
  if (!feature) return;
  const meta = resolveSectionMeta(feature);
  if (
    uiStore.sectionFilterMode === "custom" &&
    !isIdSelected(uiStore.sectionSelectedIds, meta.sectionId)
  ) {
    uiStore.ensureMapSelectedId("section", meta.sectionId);
  }
  const geometry = feature.getGeometry();
  if (!geometry) return;
  const extent = geometry.getExtent();
  mapRef.value.getView().fit(extent, {
    padding: [80, 80, 80, 80],
    duration: 500,
    maxZoom: 18,
  });
  uiStore.selectSection(meta.sectionId);
  refreshHighlights();
};

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
  const updated = applyPartOfSiteAttributeUpdate(editingPartOfSiteId.value, payload);
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
  const updated = applySectionAttributeUpdate(editingSectionId.value, payload);
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
    uiStore.showSections,
    uiStore.showSiteBoundary,
    uiStore.showWorkLots,
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
    uiStore.showWorkLotsBusiness,
    uiStore.showWorkLotsDomestic,
    uiStore.showWorkLotsGovernment,
    uiStore.showSiteBoundary,
    uiStore.showPartOfSites,
    uiStore.showSections,
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
    if (focusStateMutationLock) return;
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
  const shouldAutoFit =
    !getQueryValue(route.query.workLotId) &&
    !getQueryValue(route.query.siteBoundaryId) &&
    !getQueryValue(route.query.partOfSiteId) &&
    !getQueryValue(route.query.sectionId);
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
