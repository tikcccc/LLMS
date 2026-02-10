<template>
  <div class="page">
    <main class="map-shell">
      <div ref="mapEl" class="map-container"></div>

      <MapToolbar
        :tool="uiStore.tool"
        :can-edit-layer="canEditLayer"
        :has-draft="hasDraft"
        :has-scope-query="hasScopeQuery"
        :can-save-modify="!!modifySelectedId"
        @set-tool="setTool"
        @cancel-tool="cancelTool"
        @save-modify="saveModify"
      />

      <MapSidePanel
        v-model:leftTab="leftTab"
        v-model:workSearchQuery="workSearchQuery"
        v-model:siteBoundarySearchQuery="siteBoundarySearchQuery"
        v-model:showBasemap="uiStore.showBasemap"
        v-model:showLabels="uiStore.showLabels"
        v-model:showIntLand="uiStore.showIntLand"
        v-model:showSiteBoundary="uiStore.showSiteBoundary"
        v-model:showWorkLots="uiStore.showWorkLots"
        v-model:showWorkLotsBusiness="uiStore.showWorkLotsBusiness"
        v-model:showWorkLotsDomestic="uiStore.showWorkLotsDomestic"
        v-model:showWorkLotsGovernment="uiStore.showWorkLotsGovernment"
        :work-lot-results="workLotResults"
        :site-boundary-results="siteBoundaryResults"
        :scope-work-lot-results="scopeWorkLotResults"
        :scope-site-boundary-results="scopeSiteBoundaryResults"
        :has-scope-query="hasScopeQuery"
        :scope-mode-name="scopeModeName"
        :work-status-style="workStatusStyle"
        @focus-work="zoomToWorkLot"
        @focus-site-boundary="zoomToSiteBoundary"
      />

      <MapScaleBar :map="mapRef" />
    </main>

    <MapDrawer
      :selected-work-lot="drawerWorkLot"
      :selected-site-boundary="selectedSiteBoundary"
      :related-work-lots="selectedSiteBoundaryRelatedWorkLots"
      :related-site-boundaries="selectedWorkLotRelatedSites"
      :work-status-style="workStatusStyle"
      :work-category-label="workCategoryLabel"
      :can-edit-work="canEditWork"
      :can-edit-site-boundary="canEditWork"
      :can-delete-work="canEditWork"
      @close="handleDrawerClose"
      @edit-work-lot="editSelectedWorkLot"
      @edit-site-boundary="editSelectedSiteBoundary"
      @delete-work-lot="deleteSelectedWorkLot"
      @focus-work-lot="zoomToWorkLot"
      @focus-site-boundary="zoomToSiteBoundary"
    />

    <WorkLotDialog
      v-model="showWorkDialog"
      :title="workDialogTitle"
      :confirm-text="workDialogConfirmText"
      :work-lot-id="workDialogWorkLotId"
      :related-site-boundary-ids="workForm.relatedSiteBoundaryIds"
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
      title="Edit Site Boundary"
      confirm-text="Save"
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
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import "ol/ol.css";
import { isEmpty as isEmptyExtent } from "ol/extent";

import MapToolbar from "./components/MapToolbar.vue";
import MapSidePanel from "./components/MapSidePanel.vue";
import MapDrawer from "./components/MapDrawer.vue";
import WorkLotDialog from "./components/WorkLotDialog.vue";
import SiteBoundaryDialog from "./components/SiteBoundaryDialog.vue";
import MapScaleBar from "./components/MapScaleBar.vue";

import { useAuthStore } from "../../stores/useAuthStore";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useSiteBoundaryStore } from "../../stores/useSiteBoundaryStore";
import { useUiStore } from "../../stores/useUiStore";
import { nowIso, todayHongKong } from "../../shared/utils/time";
import { fuzzyMatchAny } from "../../shared/utils/search";
import {
  normalizeWorkLotCategory,
  WORK_LOT_CATEGORY,
  WORK_LOT_STATUS,
  workLotCategoryLabel,
} from "../../shared/utils/worklot";
import { useMapCore } from "./composables/useMapCore";
import { useMapHighlights } from "./composables/useMapHighlights";
import { useMapLayers } from "./composables/useMapLayers";
import { useMapInteractions } from "./composables/useMapInteractions";
import { EPSG_2326 } from "./ol/projection";
import { findSiteBoundaryIdsForGeometry } from "./utils/siteBoundaryMatch";
import { workStatusStyle } from "./utils/statusStyle";

const authStore = useAuthStore();
const workLotStore = useWorkLotStore();
const siteBoundaryStore = useSiteBoundaryStore();
const uiStore = useUiStore();
const route = useRoute();

const canEditWork = computed(
  () => authStore.role === "SITE_ADMIN" || authStore.role === "SITE_OFFICER"
);
const canEditLayer = computed(() => canEditWork.value);
const activeLayerType = computed(() => (canEditWork.value ? "work" : null));

const selectedWorkLot = computed(
  () => workLotStore.workLots.find((lot) => lot.id === uiStore.selectedWorkLotId) || null
);

const drawerWorkLot = computed(() =>
  uiStore.tool === "MODIFY" ? null : selectedWorkLot.value
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
  siteBoundarySource,
  siteBoundaryLayer,
  updateLayerOpacity,
  updateLayerVisibility,
  createWorkFeature,
  refreshWorkSources,
  refreshSiteBoundaryState,
  getWorkFeatureById,
  loadIntLandGeojson,
  loadSiteBoundaryGeojson,
} = useMapLayers({
  workLotStore,
  authStore,
  uiStore,
  siteBoundaryStore,
});

const {
  workHighlightSource,
  workHighlightLayer,
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
  siteBoundarySource,
});

const hasDraft = ref(false);
const pendingGeometry = ref(null);
const showWorkDialog = ref(false);
const workDialogMode = ref("create");
const editingWorkLotId = ref(null);
const showSiteBoundaryDialog = ref(false);
const editingSiteBoundaryId = ref("");

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

const workDialogTitle = computed(() =>
  workDialogMode.value === "edit" ? "Edit Work Lot" : "Create Work Lot"
);
const workDialogConfirmText = computed(() =>
  workDialogMode.value === "edit" ? "Save Changes" : "Save"
);
const workDialogWorkLotId = computed(() =>
  workDialogMode.value === "edit" ? String(editingWorkLotId.value ?? "") : ""
);
const siteBoundaryDialogBoundaryId = computed(() =>
  String(editingSiteBoundaryId.value || "")
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

const leftTab = ref("layers");
const workSearchQuery = ref("");

const siteBoundarySearchQuery = ref("");
const scopeWorkLotIds = ref([]);
const scopeSiteBoundaryIds = ref([]);
const scopeModeName = computed(() =>
  uiStore.tool === "DRAW_CIRCLE" ? "Scope Circle" : "Scope Draw"
);
const hasScopeQuery = computed(
  () => scopeWorkLotIds.value.length > 0 || scopeSiteBoundaryIds.value.length > 0
);

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

const handleScopeQueryResult = ({ workLotIds = [], siteBoundaryIds = [] } = {}) => {
  scopeWorkLotIds.value = Array.from(new Set(workLotIds.map((value) => String(value))));
  scopeSiteBoundaryIds.value = Array.from(
    new Set(siteBoundaryIds.map((value) => String(value)))
  );

  if (scopeWorkLotIds.value.length > 0 || scopeSiteBoundaryIds.value.length > 0) {
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
  workForm.value = {
    operatorName: lot.operatorName || "",
    category: normalizeWorkLotCategory(lot.category ?? lot.type),
    relatedSiteBoundaryIds: withRelatedIdFallback(
      resolveRelatedSiteBoundaryIdsByGeometryObject(lot.geometry),
      lot.relatedSiteBoundaryIds
    ),
    responsiblePerson: lot.responsiblePerson || "",
    assessDate: lot.assessDate || "",
    dueDate: lot.dueDate || todayHongKong(),
    completionDate: lot.completionDate || "",
    floatMonths: lot.floatMonths ?? null,
    forceEviction: !!lot.forceEviction,
    status: lot.status || WORK_LOT_STATUS.WAITING_ASSESSMENT,
    description: lot.description || "",
    remark: lot.remark || "",
  };
  showWorkDialog.value = true;
};

const editSelectedSiteBoundary = () => {
  if (!canEditWork.value || !selectedSiteBoundary.value) return;
  const boundary = selectedSiteBoundary.value;
  editingSiteBoundaryId.value = String(boundary.id || "");
  siteBoundaryForm.value = {
    name: boundary.name || "",
    contractNo: boundary.contractNo || "",
    futureUse: boundary.futureUse || "",
    plannedHandoverDate: boundary.plannedHandoverDate || "",
    completionDate: boundary.completionDate || "",
    others: boundary.others || "",
  };
  showSiteBoundaryDialog.value = true;
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
  siteBoundarySource,
  siteBoundaryLayer,
  refreshHighlights,
  setHighlightFeature,
  clearHighlightOverride,
  workLotStore,
  format,
  pendingGeometry,
  showWorkDialog,
  hasDraft,
  onScopeQueryResult: handleScopeQueryResult,
});

const siteBoundarySourceVersion = ref(0);

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
  if (!id || !siteBoundarySource) return null;
  const normalizedId = String(id);
  return (
    siteBoundarySource.getFeatureById(normalizedId) ||
    siteBoundarySource.getFeatureById(normalizedId.toUpperCase()) ||
    siteBoundarySource.getFeatureById(normalizedId.toLowerCase()) ||
    null
  );
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
    name: feature.get("name") ?? "Site Boundary",
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
        name: feature?.get("name") ?? "Site Boundary",
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

const siteBoundaryResults = computed(() => {
  siteBoundarySourceVersion.value;
  if (!siteBoundarySource) return [];

  const query = siteBoundarySearchQuery.value.trim().toLowerCase();
  return siteBoundarySource
    .getFeatures()
    .map((feature, index) => ({
      id: String(feature.getId() ?? `site_boundary_${String(index + 1).padStart(5, "0")}`),
      name: feature.get("name") ?? "Site Boundary",
    }))
    .filter((item) => {
      if (!query) return true;
      return (
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query)
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
      name: feature.get("name") ?? "Site Boundary",
    }));
});

const handleDrawerClose = () => {
  uiStore.clearSelection();
  clearHighlightOverride();
  workHighlightSource?.clear(true);
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

  if (!workLotId && !siteBoundaryId) return;

  if (uiStore.tool !== "PAN") {
    uiStore.setTool("PAN");
  }

  if (workLotId) {
    zoomToWorkLot(workLotId);
    return;
  }

  if (siteBoundaryId) {
    zoomToSiteBoundary(siteBoundaryId);
  }
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
  const extent = feature.getGeometry().getExtent();
  view.fit(extent, { padding: [80, 80, 80, 80], duration: 500, maxZoom: 18 });
  const selectedId = String(feature.getId() ?? id);
  uiStore.selectSiteBoundary(selectedId);
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
    const workLotName =
      workForm.value.operatorName.trim() || existing?.operatorName || `Work Lot ${workLotId}`;
    workLotStore.updateWorkLot(workLotId, {
      operatorName: workLotName,
      category: workForm.value.category,
      relatedSiteBoundaryIds: autoRelatedIds,
      responsiblePerson: workForm.value.responsiblePerson,
      assessDate: workForm.value.assessDate,
      dueDate: workForm.value.dueDate || todayHongKong(),
      completionDate: workForm.value.completionDate,
      floatMonths: workForm.value.floatMonths,
      forceEviction: workForm.value.forceEviction,
      status: workForm.value.status,
      description: workForm.value.description,
      remark: workForm.value.remark,
      updatedBy: authStore.roleName,
      updatedAt: nowIso(),
    });
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
  if (!editingSiteBoundaryId.value) return;
  siteBoundaryStore.updateSiteBoundary(editingSiteBoundaryId.value, {
    name: siteBoundaryForm.value.name,
    contractNo: siteBoundaryForm.value.contractNo,
    futureUse: siteBoundaryForm.value.futureUse,
    plannedHandoverDate: siteBoundaryForm.value.plannedHandoverDate,
    completionDate: siteBoundaryForm.value.completionDate,
    others: siteBoundaryForm.value.others,
  });
  showSiteBoundaryDialog.value = false;
  editingSiteBoundaryId.value = "";
};

const cancelSiteBoundary = () => {
  showSiteBoundaryDialog.value = false;
  editingSiteBoundaryId.value = "";
};

watch(
  () => workLotStore.workLots,
  () => {
    refreshWorkSources();
    refreshSiteBoundaryState();
    siteBoundarySourceVersion.value += 1;
    refreshHighlights();
  },
  { deep: true }
);

watch(
  () => siteBoundaryStore.siteBoundaries,
  () => {
    refreshSiteBoundaryState();
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
    uiStore.showSiteBoundary,
    uiStore.showWorkLots,
    uiStore.showWorkLotsBusiness,
    uiStore.showWorkLotsDomestic,
    uiStore.showWorkLotsGovernment,
  ],
  () => {
    updateLayerVisibility(basemapLayer.value, labelLayer.value);
    updateHighlightVisibility();
    if (uiStore.tool !== "PAN") {
      rebuildInteractions();
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
      const exists = !!siteBoundarySource.getFeatureById(value);
      if (!exists) {
        uiStore.clearSelection();
        return;
      }
    }
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
  if (uiStore.showIntLand) {
    uiStore.setLayerVisibility("showIntLand", false);
  }
  await siteBoundaryStore.ensureLoaded();
  initMap([
    intLandLayer,
    siteBoundaryLayer,
    siteBoundaryHighlightLayer,
    workBusinessLayer,
    workHouseholdLayer,
    workGovernmentLayer,
    workHighlightLayer,
  ]);
  refreshWorkSources();
  loadIntLandGeojson();
  const shouldAutoFit =
    !getQueryValue(route.query.workLotId) && !getQueryValue(route.query.siteBoundaryId);
  loadSiteBoundaryGeojson().then(() => {
    siteBoundarySourceVersion.value += 1;
    syncWorkLotBoundaryLinks();
    refreshSiteBoundaryState();
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
  flex: 1;
  overflow: hidden;
}

.map-container {
  position: absolute;
  inset: 0;
}
</style>
