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
        :work-lot-results="workLotResults"
        :site-boundary-results="siteBoundaryResults"
        :scope-work-lot-results="scopeWorkLotResults"
        :scope-site-boundary-results="scopeSiteBoundaryResults"
        :scope-mode-name="scopeModeName"
        :work-status-style="workStatusStyle"
        :work-category-label="workCategoryLabel"
        @focus-work="zoomToWorkLot"
        @focus-site-boundary="zoomToSiteBoundary"
      />

      <MapScaleBar :map="mapRef" />
    </main>

    <MapDrawer
      :selected-work-lot="drawerWorkLot"
      :selected-site-boundary="selectedSiteBoundary"
      :work-status-style="workStatusStyle"
      :work-category-label="workCategoryLabel"
      :can-delete-work="canEditWork"
      @close="handleDrawerClose"
      @delete-work-lot="deleteSelectedWorkLot"
    />

    <WorkLotDialog
      v-model="showWorkDialog"
      v-model:operatorName="workForm.operatorName"
      v-model:category="workForm.category"
      v-model:responsiblePerson="workForm.responsiblePerson"
      v-model:dueDate="workForm.dueDate"
      v-model:status="workForm.status"
      v-model:description="workForm.description"
      v-model:remark="workForm.remark"
      @confirm="confirmWork"
      @cancel="cancelWork"
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
import MapScaleBar from "./components/MapScaleBar.vue";

import { useAuthStore } from "../../stores/useAuthStore";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useUiStore } from "../../stores/useUiStore";
import { generateId } from "../../shared/utils/id";
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
import { workStatusStyle } from "./utils/statusStyle";

const authStore = useAuthStore();
const workLotStore = useWorkLotStore();
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
  workDomesticLayer,
  intLandLayer,
  siteBoundarySource,
  siteBoundaryLayer,
  updateLayerOpacity,
  updateLayerVisibility,
  createWorkFeature,
  refreshWorkSources,
  getWorkFeatureById,
  loadIntLandGeojson,
  loadSiteBoundaryGeojson,
} = useMapLayers({
  workLotStore,
  authStore,
  uiStore,
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

const workForm = ref({
  operatorName: "",
  category: WORK_LOT_CATEGORY.BU,
  responsiblePerson: "",
  dueDate: todayHongKong(),
  status: WORK_LOT_STATUS.WAITING_CLEARANCE,
  description: "",
  remark: "",
});

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
          lot.operatorName,
          workCategoryLabel(lot.category),
          lot.responsiblePerson,
          lot.dueDate,
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
  return {
    id: feature.getId() ?? id,
    name: feature.get("name") ?? "Site Boundary",
    layer: feature.get("layer") ?? "—",
    entity: feature.get("entity") ?? "Polygon",
    area,
  };
});

const siteBoundaryResults = computed(() => {
  siteBoundarySourceVersion.value;
  if (!siteBoundarySource) return [];

  const query = siteBoundarySearchQuery.value.trim().toLowerCase();
  return siteBoundarySource
    .getFeatures()
    .map((feature, index) => ({
      id: String(feature.getId() ?? `SB-${index + 1}`),
      name: feature.get("name") ?? "Site Boundary",
      layer: feature.get("layer") ?? "—",
      entity: feature.get("entity") ?? "Polygon",
    }))
    .filter((item) => {
      if (!query) return true;
      return (
        item.id.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query) ||
        item.layer.toLowerCase().includes(query) ||
        item.entity.toLowerCase().includes(query)
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
      layer: feature.get("layer") ?? "—",
      entity: feature.get("entity") ?? "Polygon",
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
    if (category === WORK_LOT_CATEGORY.DOMESTIC && !uiStore.showWorkLotsDomestic) {
      uiStore.setLayerVisibility("showWorkLotsDomestic", true);
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
    setTool("DRAW_CIRCLE");
  }
  updateLayerOpacity();
  rebuildInteractions();
};

const confirmWork = () => {
  if (!pendingGeometry.value) return;
  const id = generateId("WL");
  const workLotName = workForm.value.operatorName.trim() || `Work Lot ${id}`;
  workLotStore.addWorkLot({
    id,
    operatorName: workLotName,
    category: workForm.value.category,
    responsiblePerson: workForm.value.responsiblePerson,
    dueDate: workForm.value.dueDate || todayHongKong(),
    status: workForm.value.status,
    description: workForm.value.description,
    remark: workForm.value.remark,
    geometry: pendingGeometry.value,
    updatedBy: authStore.roleName,
    updatedAt: nowIso(),
  });
  workForm.value = {
    operatorName: "",
    category: WORK_LOT_CATEGORY.BU,
    responsiblePerson: "",
    dueDate: todayHongKong(),
    status: WORK_LOT_STATUS.WAITING_CLEARANCE,
    description: "",
    remark: "",
  };
  showWorkDialog.value = false;
  clearDraft();
};

const cancelWork = () => {
  cancelDraft();
};

watch(
  () => workLotStore.workLots,
  () => {
    refreshWorkSources();
    refreshHighlights();
  },
  { deep: true }
);

watch(
  () => uiStore.tool,
  () => rebuildInteractions()
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

onMounted(() => {
  if (uiStore.tool === "DRAW") {
    uiStore.setTool("DRAW_CIRCLE");
  }
  if (
    !canEditLayer.value &&
    ["POLYGON", "POLYGON_CIRCLE", "MODIFY", "DELETE"].includes(uiStore.tool)
  ) {
    uiStore.setTool("DRAW_CIRCLE");
  }
  initMap([
    intLandLayer,
    siteBoundaryLayer,
    siteBoundaryHighlightLayer,
    workBusinessLayer,
    workDomesticLayer,
    workHighlightLayer,
  ]);
  refreshWorkSources();
  loadIntLandGeojson();
  const shouldAutoFit =
    !getQueryValue(route.query.workLotId) && !getQueryValue(route.query.siteBoundaryId);
  loadSiteBoundaryGeojson().then(() => {
    siteBoundarySourceVersion.value += 1;
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
