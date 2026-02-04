<template>
  <div class="page">
    <main class="map-shell">
      <div ref="mapEl" class="map-container"></div>

      <MapToolbar
        :tool="uiStore.tool"
        :can-edit-layer="canEditLayer"
        :has-draft="hasDraft"
        :edit-target="uiStore.editTarget"
        :edit-target-options="editTargetOptions"
        @set-tool="setTool"
        @cancel-tool="cancelTool"
        @update:editTarget="uiStore.setEditTarget"
        @edit-target-change="onEditTargetChange"
      />

      <MapSidePanel
        v-model:leftTab="leftTab"
        v-model:taskFilter="taskFilter"
        v-model:searchQuery="searchQuery"
        v-model:landSearchQuery="landSearchQuery"
        v-model:workSearchQuery="workSearchQuery"
        v-model:showBasemap="uiStore.showBasemap"
        v-model:showLabels="uiStore.showLabels"
        v-model:showLandLots="uiStore.showLandLots"
        v-model:showWorkLots="uiStore.showWorkLots"
        :filtered-tasks="filteredTasks"
        :land-lot-results="landLotResults"
        :work-lot-results="workLotResults"
        :search-results="searchResults"
        :work-lot-name="workLotName"
        :is-overdue="isOverdue"
        :land-status-style="landStatusStyle"
        :work-status-style="workStatusStyle"
        @focus-task="focusTask"
        @focus-work="zoomToWorkLot"
        @focus-land="focusLandLot"
        @search-enter="onSearchEnter"
      />

      <MapAttribution />
    </main>

    <MapDrawer
      :selected-work-lot="selectedWorkLot"
      :selected-land-lot="selectedLandLot"
      :selected-tasks="selectedTasks"
      :selected-task="selectedTask"
      :task-form="taskForm"
      :assignee-options="assigneeOptions"
      :work-status-style="workStatusStyle"
      :land-status-style="landStatusStyle"
      :is-overdue="isOverdue"
      @close="uiStore.clearSelection()"
      @open-add-task="openAddTaskDialog"
      @view-task="selectTask"
      @clear-task="clearTaskSelection"
      @reset-task-form="resetTaskForm"
      @save-task="saveTaskDetail"
      @delete-task="deleteTask"
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

    <LandLotDialog
      v-model="showLandDialog"
      v-model:lotNumber="landForm.lotNumber"
      v-model:status="landForm.status"
      @confirm="confirmLand"
      @cancel="cancelLand"
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
import "ol/ol.css";
import { ElMessage } from "element-plus";

import MapToolbar from "./components/MapToolbar.vue";
import MapSidePanel from "./components/MapSidePanel.vue";
import MapDrawer from "./components/MapDrawer.vue";
import AddTaskDialog from "./components/AddTaskDialog.vue";
import LandLotDialog from "./components/LandLotDialog.vue";
import WorkLotDialog from "./components/WorkLotDialog.vue";
import MapAttribution from "./components/MapAttribution.vue";

import { useAuthStore } from "../../stores/useAuthStore";
import { useLandLotStore } from "../../stores/useLandLotStore";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { useUiStore } from "../../stores/useUiStore";
import { generateId } from "../../shared/utils/id";
import { nowIso } from "../../shared/utils/time";
import { useMapCore } from "./composables/useMapCore";
import { useMapLayers } from "./composables/useMapLayers";
import { useMapInteractions } from "./composables/useMapInteractions";
import { useTaskPanel } from "./composables/useTaskPanel";
import { landStatusStyle, workStatusStyle } from "./utils/statusStyle";
import { isOverdue } from "./utils/taskUtils";

const authStore = useAuthStore();
const landLotStore = useLandLotStore();
const workLotStore = useWorkLotStore();
const taskStore = useTaskStore();
const uiStore = useUiStore();

const canEditLand = computed(() => authStore.role === "SITE_ADMIN");
const canEditWork = computed(
  () => authStore.role === "SITE_ADMIN" || authStore.role === "SITE_OFFICER"
);
const canEditLayer = computed(() => canEditLand.value || canEditWork.value);
const activeLayerType = computed(() => {
  if (authStore.role === "SITE_ADMIN") return uiStore.editTarget;
  if (canEditLand.value) return "land";
  if (canEditWork.value) return "work";
  return null;
});

const selectedWorkLot = computed(() =>
  workLotStore.workLots.find((lot) => lot.id === uiStore.selectedWorkLotId) || null
);

const selectedLandLot = computed(() =>
  landLotStore.landLots.find((lot) => lot.id === uiStore.selectedLandLotId) || null
);

const { mapEl, mapRef, basemapLayer, labelLayer, initMap } = useMapCore();

const {
  format,
  landSource,
  workSource,
  landLayer,
  workLayer,
  landHighlightLayer,
  workHighlightLayer,
  updateLayerOpacity,
  updateLayerVisibility,
  createLandFeature,
  createWorkFeature,
  refreshLandSource,
  refreshWorkSource,
  refreshHighlights,
} = useMapLayers({
  landLotStore,
  workLotStore,
  taskStore,
  selectedLandLot,
  selectedWorkLot,
  authStore,
  uiStore,
});

const editTargetOptions = [
  { label: "Land", value: "land" },
  { label: "Work", value: "work" },
];

const hasDraft = ref(false);
const pendingGeometry = ref(null);
const showLandDialog = ref(false);
const showWorkDialog = ref(false);

const landForm = ref({
  lotNumber: "",
  status: "Active",
});

const workForm = ref({
  operatorName: "",
  type: "Business",
  status: "Pending",
});

const {
  leftTab,
  taskFilter,
  searchQuery,
  landSearchQuery,
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
  landLotResults,
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
  landLotStore,
  taskStore,
  uiStore,
  selectedWorkLot,
});

const {
  setTool,
  cancelTool,
  clearDraft,
  cancelDraft,
  rebuildInteractions,
  selectInteraction,
} = useMapInteractions({
  mapRef,
  uiStore,
  authStore,
  canEditLayer,
  activeLayerType,
  landSource,
  workSource,
  landLayer,
  workLayer,
  refreshHighlights,
  landLotStore,
  workLotStore,
  format,
  pendingGeometry,
  showLandDialog,
  showWorkDialog,
  hasDraft,
  clearTaskSelection,
});

const onEditTargetChange = () => {
  if (uiStore.tool !== "PAN") {
    setTool(uiStore.tool);
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

const focusLandLot = (id) => {
  if (!mapRef.value || !landSource) return;
  if (!uiStore.showLandLots) {
    uiStore.setLayerVisibility("showLandLots", true);
  }
  const view = mapRef.value.getView();
  const feature =
    landSource.getFeatureById(id) ||
    createLandFeature(landLotStore.landLots.find((lot) => lot.id === id));
  if (!feature) return;
  const extent = feature.getGeometry().getExtent();
  view.fit(extent, { padding: [80, 80, 80, 80], duration: 500, maxZoom: 18 });
  uiStore.selectLandLot(id);
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

const confirmLand = () => {
  if (!pendingGeometry.value) return;
  const id = generateId("LL");
  landLotStore.addLandLot({
    id,
    lotNumber: landForm.value.lotNumber || `Lot ${id}`,
    geometry: pendingGeometry.value,
    status: landForm.value.status,
    updatedBy: authStore.roleName,
    updatedAt: nowIso(),
  });
  landForm.value = { lotNumber: "", status: "Active" };
  showLandDialog.value = false;
  clearDraft();
  uiStore.setTool("PAN");
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

const cancelLand = () => {
  cancelDraft();
};

const cancelWork = () => {
  cancelDraft();
};

watch(
  () => landLotStore.landLots,
  () => {
    refreshLandSource();
    refreshHighlights();
  },
  { deep: true }
);

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
  () => [uiStore.showBasemap, uiStore.showLabels, uiStore.showLandLots, uiStore.showWorkLots],
  () => {
    updateLayerVisibility(basemapLayer.value, labelLayer.value);
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
  () => uiStore.editTarget,
  () => {
    if (authStore.role === "SITE_ADMIN") {
      if (uiStore.tool !== "PAN") {
        rebuildInteractions();
      }
    }
  }
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
  () => uiStore.selectedLandLotId,
  (value) => {
    if (!value) return;
    const exists = landLotStore.landLots.some((lot) => lot.id === value);
    if (!exists) uiStore.clearSelection();
  }
);

watch(
  () => [uiStore.selectedWorkLotId, uiStore.selectedLandLotId],
  ([workId, landId]) => {
    refreshHighlights();
    if (!workId && !landId && selectInteraction.value?.getFeatures) {
      selectInteraction.value.getFeatures().clear();
    }
  }
);

const handleKeydown = (event) => {
  if (event.key === "Escape" && uiStore.tool !== "PAN") {
    cancelTool();
  }
};

onMounted(() => {
  landLotStore.seedIfEmpty();
  workLotStore.seedIfEmpty();
  taskStore.seedIfEmpty();
  initMap([landLayer, workLayer, landHighlightLayer, workHighlightLayer]);
  refreshLandSource();
  refreshWorkSource();
  updateLayerOpacity();
  updateLayerVisibility(basemapLayer.value, labelLayer.value);
  refreshHighlights();
  rebuildInteractions();
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
