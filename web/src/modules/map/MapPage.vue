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

      <div class="attribution">
        <img class="logo" src="/landsd_logo.svg" alt="Lands Department logo" />
        <div class="text">© Lands Department, HKSAR. Tiles via CSDI Map API.</div>
      </div>
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

    <el-dialog v-model="showLandDialog" title="Create Land Lot" width="420px">
      <el-form :model="landForm" label-width="120px">
        <el-form-item label="Lot Number">
          <el-input v-model="landForm.lotNumber" placeholder="D.D. 99 Lot 123 RP" />
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="landForm.status">
            <el-option label="Active" value="Active" />
            <el-option label="Inactive" value="Inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelLand">Cancel</el-button>
        <el-button type="primary" @click="confirmLand">Save</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showWorkDialog" title="Create Work Lot" width="420px">
      <el-form :model="workForm" label-width="120px">
        <el-form-item label="Operator">
          <el-input v-model="workForm.operatorName" placeholder="Operator Name" />
        </el-form-item>
        <el-form-item label="Type">
          <el-select v-model="workForm.type">
            <el-option label="Business" value="Business" />
            <el-option label="Household" value="Household" />
          </el-select>
        </el-form-item>
        <el-form-item label="Status">
          <el-select v-model="workForm.status">
            <el-option label="Pending" value="Pending" />
            <el-option label="In-Progress" value="In-Progress" />
            <el-option label="Handover" value="Handover" />
            <el-option label="Difficult" value="Difficult" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelWork">Cancel</el-button>
        <el-button type="primary" @click="confirmWork">Save</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import XYZ from "ol/source/XYZ";
import VectorSource from "ol/source/Vector";
import Feature from "ol/Feature";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";
import Snap from "ol/interaction/Snap";
import GeoJSON from "ol/format/GeoJSON";
import { defaults as defaultControls } from "ol/control";
import { ElMessageBox, ElMessage } from "element-plus";

import { BASEMAP_URL, LABEL_URL, MAP_MIN_ZOOM } from "../../shared/config/mapApi";
import { registerHK80, EPSG_2326 } from "./ol/projection";
import { createHK80TileGrid, HK80_RESOLUTIONS, HK80_MAX_ZOOM } from "./ol/tilegridHK80";
import {
  landLotStyle,
  workLotStyle,
  highlightLandLotStyle,
  highlightWorkLotStyle,
} from "./ol/styles";
import MapToolbar from "./components/MapToolbar.vue";
import MapSidePanel from "./components/MapSidePanel.vue";
import MapDrawer from "./components/MapDrawer.vue";
import AddTaskDialog from "./components/AddTaskDialog.vue";
import { useAuthStore } from "../../stores/useAuthStore";
import { useLandLotStore } from "../../stores/useLandLotStore";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { useUiStore } from "../../stores/useUiStore";
import { generateId } from "../../shared/utils/id";
import { nowIso, todayHongKong } from "../../shared/utils/time";
import { buildUserOptions, getDefaultAssignee } from "../../shared/mock/users";

const mapEl = ref(null);
const mapRef = ref(null);
const format = new GeoJSON();

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

const leftTab = ref("layers");
const taskFilter = ref("All");
const searchQuery = ref("");
const landSearchQuery = ref("");
const workSearchQuery = ref("");
const hasDraft = ref(false);
const selectedTaskId = ref(null);
const selectedTasks = computed(() =>
  taskStore.tasks.filter((task) => task.workLotId === uiStore.selectedWorkLotId)
);
const selectedTask = computed(() =>
  taskStore.tasks.find((task) => task.id === selectedTaskId.value) || null
);
const showTaskDialog = ref(false);
const taskForm = ref({
  title: "",
  assignee: "",
  dueDate: "",
  description: "",
  status: "Open",
});

const assigneeOptions = computed(() => {
  const baseOptions = buildUserOptions();
  const knownNames = new Set(baseOptions.map((option) => option.value));
  const extraNames = new Set(
    taskStore.tasks.map((task) => task.assignee).filter(Boolean)
  );
  if (authStore.roleName) extraNames.add(authStore.roleName);
  const extraOptions = Array.from(extraNames)
    .filter((name) => !knownNames.has(name))
    .map((name) => ({ label: name, value: name, name }));
  return [...baseOptions, ...extraOptions];
});

const editTargetOptions = [
  { label: "Land", value: "land" },
  { label: "Work", value: "work" },
];

const showLandDialog = ref(false);
const showWorkDialog = ref(false);
const pendingGeometry = ref(null);

const landForm = ref({
  lotNumber: "",
  status: "Active",
});

const workForm = ref({
  operatorName: "",
  type: "Business",
  status: "Pending",
});

const newTaskTitle = ref("");
const newTaskAssignee = ref("");
const newTaskDueDate = ref("");
const newTaskDescription = ref("");

let landSource;
let workSource;
let landLayer;
let workLayer;
let landHighlightSource;
let workHighlightSource;
let landHighlightLayer;
let workHighlightLayer;
let basemapLayer;
let labelLayer;
let drawInteraction;
let modifyInteraction;
let selectInteraction;
let snapInteraction;
let draftFeature;
let draftSource;
let modifyBackup = new Map();

const updateLayerOpacity = () => {
  if (!landLayer || !workLayer) return;
  if (authStore.role === "SITE_ADMIN") {
    landLayer.setOpacity(1);
    workLayer.setOpacity(0.45);
  } else if (authStore.role === "SITE_OFFICER") {
    landLayer.setOpacity(0.45);
    workLayer.setOpacity(1);
  } else {
    landLayer.setOpacity(0.35);
    workLayer.setOpacity(0.7);
  }
};

const updateLayerVisibility = () => {
  if (basemapLayer) basemapLayer.setVisible(uiStore.showBasemap);
  if (labelLayer) labelLayer.setVisible(uiStore.showLabels);
  if (landLayer) landLayer.setVisible(uiStore.showLandLots);
  if (workLayer) workLayer.setVisible(uiStore.showWorkLots);
  if (landHighlightLayer) landHighlightLayer.setVisible(uiStore.showLandLots);
  if (workHighlightLayer) workHighlightLayer.setVisible(uiStore.showWorkLots);
};

const workStatusStyle = (status) => {
  if (status === "Handover") return { backgroundColor: "rgba(34,197,94,0.2)", borderColor: "rgba(34,197,94,0.5)", color: "#14532d" };
  if (status === "In-Progress") return { backgroundColor: "rgba(250,204,21,0.2)", borderColor: "rgba(250,204,21,0.5)", color: "#713f12" };
  if (status === "Difficult") return { backgroundColor: "rgba(239,68,68,0.2)", borderColor: "rgba(239,68,68,0.5)", color: "#7f1d1d" };
  return { backgroundColor: "rgba(148,163,184,0.2)", borderColor: "rgba(148,163,184,0.5)", color: "#334155" };
};

const landStatusStyle = (status) => {
  if (status === "Active") return { backgroundColor: "rgba(34,197,94,0.18)", borderColor: "rgba(34,197,94,0.5)", color: "#14532d" };
  return { backgroundColor: "rgba(148,163,184,0.2)", borderColor: "rgba(148,163,184,0.5)", color: "#334155" };
};

const abortDrawing = () => {
  if (drawInteraction) {
    drawInteraction.abortDrawing();
  }
};

const setTool = (tool) => {
  if (tool !== "PAN" && !canEditLayer.value) return;
  if (uiStore.tool === "DRAW" && tool !== "DRAW") {
    abortDrawing();
    clearDraft();
  }
  if (tool !== "PAN") {
    if (activeLayerType.value === "land" && !uiStore.showLandLots) {
      uiStore.setLayerVisibility("showLandLots", true);
    }
    if (activeLayerType.value === "work" && !uiStore.showWorkLots) {
      uiStore.setLayerVisibility("showWorkLots", true);
    }
    uiStore.clearSelection();
    refreshHighlights();
  }
  uiStore.setTool(tool);
};

const clearDraft = () => {
  if (draftFeature && draftSource) {
    draftSource.removeFeature(draftFeature);
  }
  draftFeature = null;
  draftSource = null;
  pendingGeometry.value = null;
  showLandDialog.value = false;
  showWorkDialog.value = false;
  hasDraft.value = false;
};

const cancelDraft = () => {
  abortDrawing();
  clearDraft();
  uiStore.setTool("PAN");
};

const cancelTool = () => {
  if (uiStore.tool === "DRAW") {
    cancelDraft();
    return;
  }
  if (uiStore.tool === "MODIFY") {
    restoreModifyBackup();
  }
  if (uiStore.tool === "DELETE" && selectInteraction) {
    selectInteraction.getFeatures().clear();
  }
  uiStore.setTool("PAN");
};

const onRoleChange = () => {
  if (!canEditLayer.value && uiStore.tool !== "PAN") {
    cancelTool();
  }
  updateLayerOpacity();
  rebuildInteractions();
};

const onEditTargetChange = () => {
  if (uiStore.tool !== "PAN") {
    setTool(uiStore.tool);
  }
};

const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) {
    return workLotStore.workLots.slice(0, 6);
  }
  return workLotStore.workLots
    .filter(
      (lot) =>
        lot.operatorName.toLowerCase().includes(query) ||
        lot.id.toLowerCase().includes(query)
    )
    .slice(0, 8);
});

const filteredTasks = computed(() => {
  if (taskFilter.value === "All") return taskStore.tasks;
  if (taskFilter.value === "Overdue") {
    return taskStore.tasks.filter((task) => isOverdue(task));
  }
  return taskStore.tasks.filter((task) => task.status === taskFilter.value);
});

const landLotResults = computed(() => {
  const query = landSearchQuery.value.trim().toLowerCase();
  if (!query) return landLotStore.landLots.slice(0, 8);
  return landLotStore.landLots.filter(
    (lot) =>
      lot.lotNumber.toLowerCase().includes(query) || lot.id.toLowerCase().includes(query)
  );
});

const workLotResults = computed(() => {
  const query = workSearchQuery.value.trim().toLowerCase();
  if (!query) return workLotStore.workLots.slice(0, 8);
  return workLotStore.workLots.filter(
    (lot) =>
      lot.operatorName.toLowerCase().includes(query) || lot.id.toLowerCase().includes(query)
  );
});

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
  const feature = workSource.getFeatureById(id) || createWorkFeature(workLotStore.workLots.find((lot) => lot.id === id));
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
  const feature = landSource.getFeatureById(id) || createLandFeature(landLotStore.landLots.find((lot) => lot.id === id));
  if (!feature) return;
  const extent = feature.getGeometry().getExtent();
  view.fit(extent, { padding: [80, 80, 80, 80], duration: 500, maxZoom: 18 });
  uiStore.selectLandLot(id);
};

const workLotName = (id) => {
  const lot = workLotStore.workLots.find((item) => item.id === id);
  return lot ? lot.operatorName : id;
};

const focusTask = (task) => {
  zoomToWorkLot(task.workLotId);
  leftTab.value = "tasks";
  selectedTaskId.value = task.id;
};

const isOverdue = (task) => {
  if (!task?.dueDate) return false;
  if (task.status === "Done") return false;
  const today = todayHongKong();
  return task.dueDate < today;
};

const getWorkLotTaskAlert = (workLotId) => {
  const tasks = taskStore.tasks.filter((task) => task.workLotId === workLotId);
  if (tasks.length === 0) return null;
  if (tasks.some((task) => isOverdue(task))) return "overdue";
  if (tasks.some((task) => task.status !== "Done")) return "inProgress";
  return "completed";
};

const createLandFeature = (lot) => {
  if (!lot?.geometry) return null;
  const feature = format.readFeature(
    {
      type: "Feature",
      geometry: lot.geometry,
      properties: {
        lotNumber: lot.lotNumber,
        status: lot.status,
      },
    },
    { dataProjection: EPSG_2326, featureProjection: EPSG_2326 }
  );
  feature.setId(lot.id);
  feature.set("layerType", "land");
  feature.set("refId", lot.id);
  return feature;
};

const createWorkFeature = (lot) => {
  if (!lot?.geometry) return null;
  const taskAlert = getWorkLotTaskAlert(lot.id);
  const feature = format.readFeature(
    {
      type: "Feature",
      geometry: lot.geometry,
      properties: {
        operatorName: lot.operatorName,
        status: lot.status,
        taskAlert,
      },
    },
    { dataProjection: EPSG_2326, featureProjection: EPSG_2326 }
  );
  feature.setId(lot.id);
  feature.set("layerType", "work");
  feature.set("refId", lot.id);
  feature.set("taskAlert", taskAlert);
  return feature;
};


const refreshLandSource = () => {
  if (!landSource) return;
  landSource.clear(true);
  landLotStore.landLots
    .map(createLandFeature)
    .filter(Boolean)
    .forEach((feature) => landSource.addFeature(feature));
};

const refreshWorkSource = () => {
  if (!workSource) return;
  workSource.clear(true);
  workLotStore.workLots
    .map(createWorkFeature)
    .filter(Boolean)
    .forEach((feature) => workSource.addFeature(feature));
};

const refreshHighlights = () => {
  if (!landHighlightSource || !workHighlightSource) return;
  landHighlightSource.clear(true);
  workHighlightSource.clear(true);

  if (selectedLandLot.value) {
    const feature = createLandFeature(selectedLandLot.value);
    if (feature) landHighlightSource.addFeature(feature);
  }

  if (selectedWorkLot.value) {
    const feature = createWorkFeature(selectedWorkLot.value);
    if (feature) workHighlightSource.addFeature(feature);
  }
};

const restoreModifyBackup = () => {
  if (!modifyBackup.size) return;
  modifyBackup.forEach((geometry, id) => {
    const feature =
      landSource?.getFeatureById(id) ||
      workSource?.getFeatureById(id);
    if (feature) {
      feature.setGeometry(geometry);
    }
  });
  modifyBackup.clear();
  refreshHighlights();
  uiStore.clearSelection();
};

const handleDrawEnd = (event) => {
  draftFeature = event.feature;
  hasDraft.value = true;
  const geometry = format.writeGeometryObject(event.feature.getGeometry(), {
    dataProjection: EPSG_2326,
    featureProjection: EPSG_2326,
  });
  pendingGeometry.value = geometry;
  if (activeLayerType.value === "land") {
    showLandDialog.value = true;
  } else if (activeLayerType.value === "work") {
    showWorkDialog.value = true;
  }
};

const handleModifyEnd = (event) => {
  const updatedAt = nowIso();
  event.features.forEach((feature) => {
    const geometry = format.writeGeometryObject(feature.getGeometry(), {
      dataProjection: EPSG_2326,
      featureProjection: EPSG_2326,
    });
    const id = feature.getId();
    if (activeLayerType.value === "land") {
      landLotStore.updateLandLot(id, { geometry, updatedAt, updatedBy: authStore.roleName });
    } else if (activeLayerType.value === "work") {
      workLotStore.updateWorkLot(id, { geometry, updatedAt, updatedBy: authStore.roleName });
    }
  });
  modifyBackup.clear();
};

const handleSelect = (event) => {
  if (uiStore.tool !== "PAN") return;
  const selected = event.selected[0];
  if (!selected) {
    uiStore.clearSelection();
    refreshHighlights();
    return;
  }
  const layerType = selected.get("layerType");
  const refId = selected.get("refId") || selected.getId();
  if (layerType === "land") {
    uiStore.selectLandLot(refId);
    selectedTaskId.value = null;
  } else {
    uiStore.selectWorkLot(refId);
  }
};

const handleDeleteSelect = (event) => {
  const selected = event.selected[0];
  if (!selected) return;
  const id = selected.getId();
  const layerType = activeLayerType.value;
  if (!layerType) return;
  ElMessageBox.confirm(`Delete ${id}?`, "Confirm", { type: "warning" })
    .then(() => {
      if (layerType === "land") {
        landLotStore.removeLandLot(id);
      } else {
        workLotStore.removeWorkLot(id);
      }
      uiStore.clearSelection();
      refreshHighlights();
    })
    .catch(() => {
      // user canceled
    })
    .finally(() => {
      event.target.getFeatures().clear();
    });
};

const clearInteractions = () => {
  if (!mapRef.value) return;
  const interactions = mapRef.value.getInteractions().getArray();
  interactions
    .filter((interaction) => interaction.get && interaction.get("managed"))
    .forEach((interaction) => {
      if (typeof interaction.abortDrawing === "function") {
        interaction.abortDrawing();
      }
      if (interaction.getFeatures) {
        interaction.getFeatures().clear();
      }
      mapRef.value.removeInteraction(interaction);
    });
  drawInteraction = null;
  modifyInteraction = null;
  selectInteraction = null;
  snapInteraction = null;
};

const rebuildInteractions = () => {
  if (!mapRef.value) return;
  clearInteractions();

  if (uiStore.tool === "PAN") {
    const selectLayers = [workLayer, landLayer].filter(Boolean);
    selectInteraction = new Select({ layers: selectLayers });
    selectInteraction.set("managed", true);
    selectInteraction.on("select", handleSelect);
    mapRef.value.addInteraction(selectInteraction);
    return;
  }

  const layerType = activeLayerType.value;
  if (!layerType) return;

  const targetSource = layerType === "land" ? landSource : workSource;
  const targetLayer = layerType === "land" ? landLayer : workLayer;

  if (uiStore.tool === "DRAW") {
    drawInteraction = new Draw({ source: targetSource, type: "Polygon" });
    drawInteraction.set("managed", true);
    drawInteraction.on("drawstart", (event) => {
      draftFeature = event.feature;
      draftSource = targetSource;
      hasDraft.value = true;
    });
    drawInteraction.on("drawend", handleDrawEnd);
    mapRef.value.addInteraction(drawInteraction);
  }

  if (uiStore.tool === "MODIFY") {
    modifyInteraction = new Modify({ source: targetSource });
    modifyInteraction.set("managed", true);
    modifyInteraction.on("modifystart", (event) => {
      modifyBackup.clear();
      event.features.forEach((feature) => {
        const geometry = feature.getGeometry();
        if (geometry) {
          modifyBackup.set(feature.getId(), geometry.clone());
        }
      });
    });
    modifyInteraction.on("modifyend", handleModifyEnd);
    mapRef.value.addInteraction(modifyInteraction);
  }

  if (uiStore.tool === "DELETE") {
    selectInteraction = new Select({ layers: [targetLayer] });
    selectInteraction.set("managed", true);
    selectInteraction.on("select", handleDeleteSelect);
    mapRef.value.addInteraction(selectInteraction);
  }

  if (authStore.role === "SITE_OFFICER" && layerType === "work" && ["DRAW", "MODIFY"].includes(uiStore.tool)) {
    if (uiStore.showLandLots) {
      snapInteraction = new Snap({ source: landSource });
      snapInteraction.set("managed", true);
      mapRef.value.addInteraction(snapInteraction);
    }
  }
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

const addTask = () => {
  if (!selectedWorkLot.value) return;
  const title = newTaskTitle.value.trim();
  if (!title) return;
  taskStore.addTask(
    selectedWorkLot.value.id,
    title,
    newTaskAssignee.value || getDefaultAssignee(authStore.role) || authStore.roleName,
    {
    dueDate: newTaskDueDate.value,
    description: newTaskDescription.value,
    }
  );
  newTaskTitle.value = "";
  newTaskAssignee.value = "";
  newTaskDueDate.value = "";
  newTaskDescription.value = "";
};

const clearNewTask = () => {
  newTaskTitle.value = "";
  newTaskAssignee.value = "";
  newTaskDueDate.value = "";
  newTaskDescription.value = "";
};

const openAddTaskDialog = () => {
  if (!selectedWorkLot.value) return;
  if (!newTaskAssignee.value) {
    newTaskAssignee.value = getDefaultAssignee(authStore.role) || authStore.roleName;
  }
  if (!newTaskDescription.value) {
    newTaskDescription.value = "";
  }
  showTaskDialog.value = true;
};

const confirmAddTask = () => {
  addTask();
  showTaskDialog.value = false;
};

const selectTask = (taskId) => {
  selectedTaskId.value = taskId;
};

const clearTaskSelection = () => {
  selectedTaskId.value = null;
};

const resetTaskForm = () => {
  if (!selectedTask.value) return;
  taskForm.value = {
    title: selectedTask.value.title,
    assignee: selectedTask.value.assignee,
    dueDate: selectedTask.value.dueDate,
    description: selectedTask.value.description || "",
    status: selectedTask.value.status,
  };
};

const saveTaskDetail = () => {
  if (!selectedTask.value) return;
  taskStore.updateTask(selectedTask.value.id, { ...taskForm.value });
};

const deleteTask = () => {
  if (!selectedTask.value) return;
  taskStore.removeTask(selectedTask.value.id);
  selectedTaskId.value = null;
};

const initMap = () => {
  registerHK80();

  const tileGrid = createHK80TileGrid();

  basemapLayer = new TileLayer({
    source: new XYZ({
      url: BASEMAP_URL,
      crossOrigin: "anonymous",
      tileGrid,
      projection: EPSG_2326,
    }),
  });

  labelLayer = new TileLayer({
    source: new XYZ({
      url: LABEL_URL,
      crossOrigin: "anonymous",
      tileGrid,
      projection: EPSG_2326,
    }),
  });

  landSource = new VectorSource();
  workSource = new VectorSource();
  landHighlightSource = new VectorSource();
  workHighlightSource = new VectorSource();

  landLayer = new VectorLayer({ source: landSource, style: landLotStyle });
  workLayer = new VectorLayer({ source: workSource, style: workLotStyle });
  landHighlightLayer = new VectorLayer({ source: landHighlightSource, style: highlightLandLotStyle });
  workHighlightLayer = new VectorLayer({ source: workHighlightSource, style: highlightWorkLotStyle });

  landLayer.setZIndex(10);
  workLayer.setZIndex(20);
  landHighlightLayer.setZIndex(25);
  workHighlightLayer.setZIndex(26);

  mapRef.value = new Map({
    target: mapEl.value,
    layers: [
      basemapLayer,
      labelLayer,
      landLayer,
      workLayer,
      landHighlightLayer,
      workHighlightLayer,
    ],
    view: new View({
      projection: EPSG_2326,
      center: [835100, 815800],
      zoom: 12,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: HK80_MAX_ZOOM,
      resolutions: HK80_RESOLUTIONS,
      constrainResolution: true,
    }),
    controls: defaultControls({ attribution: false }),
  });

  refreshLandSource();
  refreshWorkSource();
  updateLayerOpacity();
  updateLayerVisibility();
  refreshHighlights();
  rebuildInteractions();
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
    updateLayerVisibility();
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
  () => uiStore.selectedWorkLotId,
  () => {
    selectedTaskId.value = null;
  }
);

watch(
  () => [uiStore.selectedWorkLotId, uiStore.selectedLandLotId],
  ([workId, landId]) => {
    refreshHighlights();
    if (!workId && !landId && selectInteraction?.getFeatures) {
      selectInteraction.getFeatures().clear();
    }
  }
);

watch(
  () => selectedTaskId.value,
  (value) => {
    if (!value) return;
    resetTaskForm();
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
  initMap();
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

.attribution {
  position: absolute;
  bottom: 22px;
  right: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border);
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.attribution .logo {
  height: 22px;
  width: auto;
}
</style>
