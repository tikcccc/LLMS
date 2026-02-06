<template>
  <div class="page">
    <main class="map-shell">
      <div ref="mapEl" class="map-container"></div>

      <MapToolbar
        :tool="uiStore.tool"
        :can-edit-layer="canEditLayer"
        :has-draft="hasDraft"
        :can-save-modify="!!modifySelectedId"
        @set-tool="setTool"
        @cancel-tool="cancelTool"
        @save-modify="saveModify"
      />

      <MapSidePanel
        v-model:leftTab="leftTab"
        v-model:taskFilter="taskFilter"
        v-model:searchQuery="searchQuery"
        v-model:workSearchQuery="workSearchQuery"
        v-model:showBasemap="uiStore.showBasemap"
        v-model:showLabels="uiStore.showLabels"
        v-model:showIntLand="uiStore.showIntLand"
        v-model:showSiteBoundary="uiStore.showSiteBoundary"
        v-model:showWorkLots="uiStore.showWorkLots"
        :filtered-tasks="filteredTasks"
        :work-lot-results="workLotResults"
        :search-results="searchResults"
        :work-lot-name="workLotName"
        :is-overdue="isOverdue"
        :work-status-style="workStatusStyle"
        @focus-task="focusTask"
        @focus-work="zoomToWorkLot"
        @search-enter="onSearchEnter"
      />

      <MapAttribution />
    </main>

    <MapDrawer
      :selected-work-lot="drawerWorkLot"
      :selected-site-boundary="selectedSiteBoundary"
      :selected-tasks="selectedTasks"
      :selected-task="selectedTask"
      :task-form="taskForm"
      :assignee-options="assigneeOptions"
      :work-status-style="workStatusStyle"
      :is-overdue="isOverdue"
      :can-delete-work="canEditWork"
      @close="handleDrawerClose"
      @open-add-task="openAddTaskDialog"
      @view-task="selectTask"
      @clear-task="clearTaskSelection"
      @reset-task-form="resetTaskForm"
      @save-task="saveTaskDetail"
      @delete-task="deleteTask"
      @delete-work-lot="deleteSelectedWorkLot"
    />

    <AddTaskDialog
      v-model="showTaskDialog"
      v-model:title="newTaskTitle"
      v-model:assignee="newTaskAssignee"
      v-model:dueDate="newTaskDueDate"
      v-model:description="newTaskDescription"
      :assignee-options="assigneeOptions"
      @confirm="confirmAddTask"
      @cancel="clearNewTask"
    />

    <WorkLotDialog
      v-model="showWorkDialog"
      v-model:operatorName="workForm.operatorName"
      v-model:type="workForm.type"
      v-model:status="workForm.status"
      @confirm="confirmWork"
      @cancel="cancelWork"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import "ol/ol.css";
import { ElMessage } from "element-plus";
import { isEmpty as isEmptyExtent } from "ol/extent";

import MapToolbar from "./components/MapToolbar.vue";
import MapSidePanel from "./components/MapSidePanel.vue";
import MapDrawer from "./components/MapDrawer.vue";
import AddTaskDialog from "./components/AddTaskDialog.vue";
import WorkLotDialog from "./components/WorkLotDialog.vue";
import MapAttribution from "./components/MapAttribution.vue";

import { useAuthStore } from "../../stores/useAuthStore";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { useUiStore } from "../../stores/useUiStore";
import { generateId } from "../../shared/utils/id";
import { nowIso } from "../../shared/utils/time";
import { useMapCore } from "./composables/useMapCore";
import { useMapHighlights } from "./composables/useMapHighlights";
import { useMapLayers } from "./composables/useMapLayers";
import { useMapInteractions } from "./composables/useMapInteractions";
import { useTaskPanel } from "./composables/useTaskPanel";
import { workStatusStyle } from "./utils/statusStyle";
import { isOverdue } from "./utils/taskUtils";

const authStore = useAuthStore();
const workLotStore = useWorkLotStore();
const taskStore = useTaskStore();
const uiStore = useUiStore();
const route = useRoute();

const canEditWork = computed(
  () => authStore.role === "SITE_ADMIN" || authStore.role === "SITE_OFFICER"
);
const canEditLayer = computed(() => canEditWork.value);
const activeLayerType = computed(() => (canEditWork.value ? "work" : null));

const selectedWorkLot = computed(() =>
  workLotStore.workLots.find((lot) => lot.id === uiStore.selectedWorkLotId) || null
);

const drawerWorkLot = computed(() =>
  uiStore.tool === "MODIFY" ? null : selectedWorkLot.value
);

const { mapEl, mapRef, basemapLayer, labelLayer, initMap } = useMapCore();

const {
  format,
  workSource,
  workLayer,
  intLandLayer,
  siteBoundarySource,
  siteBoundaryLayer,
  updateLayerOpacity,
  updateLayerVisibility,
  createWorkFeature,
  refreshWorkSource,
  loadIntLandGeojson,
  loadSiteBoundaryGeojson,
} = useMapLayers({
  workLotStore,
  taskStore,
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
  type: "Business",
  status: "Pending",
});

const {
  leftTab,
  taskFilter,
  searchQuery,
  workSearchQuery,
  selectedTasks,
  selectedTask,
  showTaskDialog,
  taskForm,
  assigneeOptions,
  newTaskTitle,
  newTaskAssignee,
  newTaskDueDate,
  newTaskDescription,
  searchResults,
  filteredTasks,
  workLotResults,
  workLotName,
  clearNewTask,
  openAddTaskDialog,
  confirmAddTask,
  selectTask,
  clearTaskSelection,
  resetTaskForm,
  saveTaskDetail,
  deleteTask,
} = useTaskPanel({
  authStore,
  workLotStore,
  taskStore,
  uiStore,
  selectedWorkLot,
});

const deleteSelectedWorkLot = () => {
  if (!selectedWorkLot.value) return;
  const workLotId = selectedWorkLot.value.id;
  workLotStore.removeWorkLot(workLotId);
  taskStore.removeTasksByWorkLot(workLotId);
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
  workSource,
  workLayer,
  siteBoundaryLayer,
  refreshHighlights,
  setHighlightFeature,
  clearHighlightOverride,
  workLotStore,
  taskStore,
  format,
  pendingGeometry,
  showWorkDialog,
  hasDraft,
});

const selectedSiteBoundary = computed(() => {
  const id = uiStore.selectedSiteBoundaryId;
  if (!id || !siteBoundarySource) return null;
  const feature = siteBoundarySource.getFeatureById(id);
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

const handleDrawerClose = () => {
  uiStore.clearSelection();
  clearHighlightOverride();
  workHighlightSource?.clear(true);
  siteBoundaryHighlightSource?.clear(true);
  if (selectInteraction.value?.getFeatures) {
    selectInteraction.value.getFeatures().clear();
  }
};

const onSearchEnter = () => {
  if (!searchQuery.value.trim()) return;
  const query = searchQuery.value.trim().toLowerCase();
  const match = workLotStore.workLots.find(
    (lot) =>
      lot.operatorName.toLowerCase().includes(query) ||
      lot.id.toLowerCase().includes(query)
  );
  if (match) {
    zoomToWorkLot(match.id);
  } else {
    ElMessage({ type: "warning", message: "No work lot matched." });
  }
};

const getQueryValue = (value) =>
  Array.isArray(value) ? value[0] : value ?? null;

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
  const taskId = getQueryValue(route.query.taskId);

  if (!workLotId && !taskId) return;

  if (uiStore.tool !== "PAN") {
    uiStore.setTool("PAN");
  }

  if (workLotId) {
    zoomToWorkLot(workLotId);
    if (taskId) {
      selectTask(taskId);
    }
    return;
  }

  if (taskId) {
    const task = taskStore.tasks.find((item) => item.id === taskId);
    if (task?.workLotId) {
      zoomToWorkLot(task.workLotId);
      selectTask(taskId);
    }
  }
};

const zoomToWorkLot = (id) => {
  if (!mapRef.value || !workSource) return;
  if (!uiStore.showWorkLots) {
    uiStore.setLayerVisibility("showWorkLots", true);
  }
  const view = mapRef.value.getView();
  const feature =
    workSource.getFeatureById(id) ||
    createWorkFeature(workLotStore.workLots.find((lot) => lot.id === id));
  if (!feature) return;
  const extent = feature.getGeometry().getExtent();
  view.fit(extent, { padding: [80, 80, 80, 80], duration: 500, maxZoom: 18 });
  uiStore.selectWorkLot(id);
};

const focusTask = (task) => {
  zoomToWorkLot(task.workLotId);
  leftTab.value = "tasks";
  selectTask(task.id);
};

const onRoleChange = () => {
  if (!canEditLayer.value && uiStore.tool !== "PAN") {
    cancelTool();
  }
  updateLayerOpacity();
  rebuildInteractions();
};

const confirmWork = () => {
  if (!pendingGeometry.value) return;
  const id = generateId("WL");
  workLotStore.addWorkLot({
    id,
    operatorName: workForm.value.operatorName || `Work Lot ${id}`,
    type: workForm.value.type,
    status: workForm.value.status,
    geometry: pendingGeometry.value,
    updatedBy: authStore.roleName,
    updatedAt: nowIso(),
  });
  workForm.value = { operatorName: "", type: "Business", status: "Pending" };
  showWorkDialog.value = false;
  clearDraft();
  uiStore.setTool("PAN");
};

const cancelWork = () => {
  cancelDraft();
};

watch(
  () => workLotStore.workLots,
  () => {
    refreshWorkSource();
    refreshHighlights();
  },
  { deep: true }
);

watch(
  () => taskStore.tasks,
  () => {
    refreshWorkSource();
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
  if (event.key === "Escape" && uiStore.tool !== "PAN") {
    cancelTool();
  }
};

onMounted(() => {
  workLotStore.seedIfEmpty();
  taskStore.seedIfEmpty();
  initMap([
    intLandLayer,
    siteBoundaryLayer,
    siteBoundaryHighlightLayer,
    workLayer,
    workHighlightLayer,
  ]);
  refreshWorkSource();
  loadIntLandGeojson();
  const shouldAutoFit =
    !getQueryValue(route.query.workLotId) && !getQueryValue(route.query.taskId);
  loadSiteBoundaryGeojson().then(() => {
    if (shouldAutoFit) {
      fitToSiteBoundary();
    }
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
