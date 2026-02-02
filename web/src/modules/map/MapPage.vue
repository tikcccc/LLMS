<template>
  <div class="page">
    <main class="map-shell">
      <div ref="mapEl" class="map-container"></div>

      <div class="toolbar">
        <el-button
          size="small"
          :type="uiStore.tool === 'PAN' ? 'primary' : 'default'"
          @click="setTool('PAN')"
        >
          Pan
        </el-button>
        <el-button
          size="small"
          :type="uiStore.tool === 'DRAW' ? 'primary' : 'default'"
          :disabled="!canEditLayer"
          @click="setTool('DRAW')"
        >
          Draw
        </el-button>
        <el-button
          size="small"
          :type="uiStore.tool === 'MODIFY' ? 'primary' : 'default'"
          :disabled="!canEditLayer"
          @click="setTool('MODIFY')"
        >
          Modify
        </el-button>
        <el-button
          size="small"
          :type="uiStore.tool === 'DELETE' ? 'primary' : 'default'"
          :disabled="!canEditLayer"
          @click="setTool('DELETE')"
        >
          Delete
        </el-button>
        <el-button size="small" :disabled="uiStore.tool === 'PAN' && !hasDraft" @click="cancelTool">
          Cancel
        </el-button>
        <div class="edit-target" v-if="canEditLayer">
          <span>Edit Target</span>
          <el-segmented
            v-model="uiStore.editTarget"
            size="small"
            :options="editTargetOptions"
            @change="onEditTargetChange"
          />
        </div>
      </div>

      <aside class="left-panel">
        <el-tabs v-model="leftTab" class="panel-tabs">
          <el-tab-pane label="Layers" name="layers">
            <div class="panel-section">
              <div class="panel-row">
                <span>Basemap</span>
                <el-switch v-model="uiStore.showBasemap" />
              </div>
              <div class="panel-row">
                <span>Labels (EN)</span>
                <el-switch v-model="uiStore.showLabels" />
              </div>
              <div class="panel-row">
                <span>Land Lots</span>
                <el-switch v-model="uiStore.showLandLots" />
              </div>
              <div class="panel-row">
                <span>Work Lots</span>
                <el-switch v-model="uiStore.showWorkLots" />
              </div>
            </div>

            <div class="legend">
              <div class="legend-title">Work Lot Status</div>
              <div class="legend-item">
                <span class="swatch pending"></span>
                Pending
              </div>
              <div class="legend-item">
                <span class="swatch progress"></span>
                In-Progress
              </div>
              <div class="legend-item">
                <span class="swatch handover"></span>
                Handover
              </div>
              <div class="legend-item">
                <span class="swatch difficult"></span>
                Difficult
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="Tasks" name="tasks">
            <div class="panel-section">
              <el-select v-model="taskFilter" size="small" style="width: 140px">
                <el-option label="All" value="All" />
                <el-option label="Open" value="Open" />
                <el-option label="Done" value="Done" />
              </el-select>
            </div>
            <div class="task-list-global">
              <button
                v-for="task in filteredTasks"
                :key="task.id"
                class="task-card"
                type="button"
                @click="focusTask(task)"
              >
                <div class="task-card-top">
                  <span class="task-title">{{ task.title }}</span>
                  <el-tag size="small" :type="task.status === 'Done' ? 'success' : 'info'">
                    {{ task.status }}
                  </el-tag>
                </div>
                <div class="task-card-meta">
                  <span>{{ workLotName(task.workLotId) }}</span>
                  <span>{{ task.assignee }}</span>
                </div>
              </button>
              <el-empty v-if="filteredTasks.length === 0" description="No tasks" />
            </div>
          </el-tab-pane>

          <el-tab-pane label="Land Lots" name="landlots">
            <div class="panel-section">
              <el-input
                v-model="landSearchQuery"
                placeholder="Search land lots"
                clearable
              />
            </div>
            <div class="list-scroll">
              <button
                v-for="lot in landLotResults"
                :key="lot.id"
                class="list-item"
                type="button"
                @click="focusLandLot(lot.id)"
              >
                <div class="list-title-row">
                  <span class="list-title">{{ lot.lotNumber }}</span>
                  <el-tag size="small" effect="plain" :style="landStatusStyle(lot.status)">
                    {{ lot.status }}
                  </el-tag>
                </div>
                <div class="list-meta">{{ lot.id }}</div>
              </button>
              <el-empty v-if="landLotResults.length === 0" description="No land lots" />
            </div>
          </el-tab-pane>

          <el-tab-pane label="Work Lots" name="worklots">
            <div class="panel-section">
              <el-input
                v-model="workSearchQuery"
                placeholder="Search work lots"
                clearable
              />
            </div>
            <div class="list-scroll">
              <button
                v-for="lot in workLotResults"
                :key="lot.id"
                class="list-item"
                type="button"
                @click="zoomToWorkLot(lot.id)"
              >
                <div class="list-title-row">
                  <span class="list-title">{{ lot.operatorName }}</span>
                  <el-tag size="small" effect="plain" :style="workStatusStyle(lot.status)">
                    {{ lot.status }}
                  </el-tag>
                </div>
                <div class="list-meta">{{ lot.id }}</div>
              </button>
              <el-empty v-if="workLotResults.length === 0" description="No work lots" />
            </div>
          </el-tab-pane>

          <el-tab-pane label="Search" name="search">
            <div class="panel-section">
              <el-input
                v-model="searchQuery"
                placeholder="Search work lots"
                clearable
                @keyup.enter="onSearchEnter"
              />
            </div>
            <div class="search-results">
              <button
                v-for="result in searchResults"
                :key="result.id"
                class="search-item"
                type="button"
                @click="zoomToWorkLot(result.id)"
              >
                <div class="search-title">{{ result.operatorName }}</div>
                <div class="search-meta">{{ result.id }}</div>
              </button>
              <el-empty v-if="searchResults.length === 0" description="No results" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </aside>

      <div class="attribution">
        <img class="logo" src="/landsd_logo.svg" alt="Lands Department logo" />
        <div class="text">© Lands Department, HKSAR. Tiles via CSDI Map API.</div>
      </div>
    </main>

    <el-drawer
      :model-value="!!selectedWorkLot || !!selectedLandLot"
      size="360px"
      @close="uiStore.clearSelection()"
    >
      <template #header>
        <div class="drawer-header" v-if="selectedWorkLot">
          <div class="drawer-title">{{ selectedWorkLot.operatorName }}</div>
          <el-tag effect="plain" :style="workStatusStyle(selectedWorkLot.status)">
            {{ selectedWorkLot.status }}
          </el-tag>
        </div>
        <div class="drawer-header" v-else-if="selectedLandLot">
          <div class="drawer-title">{{ selectedLandLot.lotNumber }}</div>
          <el-tag effect="plain" :style="landStatusStyle(selectedLandLot.status)">
            {{ selectedLandLot.status }}
          </el-tag>
        </div>
      </template>

      <div v-if="selectedWorkLot" class="drawer-body">
        <div class="info-block">
          <div class="info-row"><span>ID</span><strong>{{ selectedWorkLot.id }}</strong></div>
          <div class="info-row"><span>Type</span><strong>{{ selectedWorkLot.type }}</strong></div>
          <div class="info-row"><span>Updated</span><strong>{{ selectedWorkLot.updatedAt }}</strong></div>
          <div class="info-row"><span>Updated By</span><strong>{{ selectedWorkLot.updatedBy }}</strong></div>
        </div>

        <div class="info-block">
          <div class="info-row">
            <span>Related Land Lots</span>
            <strong>{{ relatedLandLots.map((lot) => lot.lotNumber).join(", ") || "-" }}</strong>
          </div>
          <div class="related-list">
            <button
              v-for="lot in relatedLandLots"
              :key="lot.id"
              type="button"
              class="chip"
              @click="focusLandLot(lot.id)"
            >
              {{ lot.lotNumber }}
            </button>
          </div>
        </div>

        <div class="task-block">
          <div class="task-header">Tasks</div>
          <el-input
            v-model="newTaskTitle"
            placeholder="Add task and press Enter"
            size="small"
            @keyup.enter="addTask"
          />
          <div v-if="selectedTasks.length" class="task-list">
            <div v-for="task in selectedTasks" :key="task.id" class="task-item">
              <el-checkbox
                :model-value="task.status === 'Done'"
                @change="() => taskStore.toggleDone(task.id)"
              >
                {{ task.title }}
              </el-checkbox>
              <div class="task-meta">{{ task.assignee }}</div>
            </div>
          </div>
          <el-empty v-else description="No tasks" />
        </div>
      </div>

      <div v-else-if="selectedLandLot" class="drawer-body">
        <div class="info-block">
          <div class="info-row"><span>ID</span><strong>{{ selectedLandLot.id }}</strong></div>
          <div class="info-row"><span>Status</span><strong>{{ selectedLandLot.status }}</strong></div>
          <div class="info-row"><span>Updated</span><strong>{{ selectedLandLot.updatedAt }}</strong></div>
          <div class="info-row"><span>Updated By</span><strong>{{ selectedLandLot.updatedBy }}</strong></div>
        </div>

        <div class="info-block">
          <div class="info-row">
            <span>Related Work Lots</span>
            <strong>{{ relatedWorkLots.map((lot) => lot.operatorName).join(", ") || "-" }}</strong>
          </div>
          <div class="related-list">
            <button
              v-for="lot in relatedWorkLots"
              :key="lot.id"
              type="button"
              class="chip"
              @click="zoomToWorkLot(lot.id)"
            >
              {{ lot.operatorName }}
            </button>
          </div>
        </div>
      </div>
    </el-drawer>

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
import Point from "ol/geom/Point";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";
import Snap from "ol/interaction/Snap";
import GeoJSON from "ol/format/GeoJSON";
import { defaults as defaultControls } from "ol/control";
import { getCenter } from "ol/extent";
import { ElMessageBox, ElMessage } from "element-plus";

import { BASEMAP_URL, LABEL_URL, MAP_MIN_ZOOM } from "../../shared/config/mapApi";
import { registerHK80, EPSG_2326 } from "./ol/projection";
import { createHK80TileGrid, HK80_RESOLUTIONS, HK80_MAX_ZOOM } from "./ol/tilegridHK80";
import {
  landLotStyle,
  workLotStyle,
  landLotIconStyle,
  workLotIconStyle,
  highlightLandLotStyle,
  highlightWorkLotStyle,
} from "./ol/styles";
import { useAuthStore } from "../../stores/useAuthStore";
import { useLandLotStore } from "../../stores/useLandLotStore";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { useUiStore } from "../../stores/useUiStore";
import { useRelationStore } from "../../stores/useRelationStore";
import { generateId } from "../../shared/utils/id";
import { nowIso } from "../../shared/utils/time";

const mapEl = ref(null);
const mapRef = ref(null);
const format = new GeoJSON();

const authStore = useAuthStore();
const landLotStore = useLandLotStore();
const workLotStore = useWorkLotStore();
const taskStore = useTaskStore();
const uiStore = useUiStore();
const relationStore = useRelationStore();

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

const relatedLandLots = computed(() => {
  if (!uiStore.selectedWorkLotId) return [];
  const landLotIds = relationStore.relations
    .filter((rel) => rel.workLotId === uiStore.selectedWorkLotId)
    .map((rel) => rel.landLotId);
  return landLotStore.landLots.filter((lot) => landLotIds.includes(lot.id));
});

const relatedWorkLots = computed(() => {
  if (!uiStore.selectedLandLotId) return [];
  const workLotIds = relationStore.relations
    .filter((rel) => rel.landLotId === uiStore.selectedLandLotId)
    .map((rel) => rel.workLotId);
  return workLotStore.workLots.filter((lot) => workLotIds.includes(lot.id));
});

const selectedTasks = computed(() =>
  taskStore.tasks.filter((task) => task.workLotId === uiStore.selectedWorkLotId)
);

const leftTab = ref("layers");
const taskFilter = ref("All");
const searchQuery = ref("");
const landSearchQuery = ref("");
const workSearchQuery = ref("");
const hasDraft = ref(false);

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

let landSource;
let workSource;
let landLayer;
let workLayer;
let landIconSource;
let workIconSource;
let landIconLayer;
let workIconLayer;
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

const geojsonToGeometry = (geometry) =>
  format.readGeometry(geometry, { dataProjection: EPSG_2326, featureProjection: EPSG_2326 });

const geometriesIntersect = (geomA, geomB) => {
  if (!geomA || !geomB) return false;
  return geomA.intersectsExtent(geomB.getExtent());
};

const updateLayerOpacity = () => {
  if (!landLayer || !workLayer) return;
  if (authStore.role === "SITE_ADMIN") {
    landLayer.setOpacity(1);
    workLayer.setOpacity(0.45);
    if (landIconLayer) landIconLayer.setOpacity(1);
    if (workIconLayer) workIconLayer.setOpacity(0.45);
  } else if (authStore.role === "SITE_OFFICER") {
    landLayer.setOpacity(0.45);
    workLayer.setOpacity(1);
    if (landIconLayer) landIconLayer.setOpacity(0.45);
    if (workIconLayer) workIconLayer.setOpacity(1);
  } else {
    landLayer.setOpacity(0.35);
    workLayer.setOpacity(0.7);
    if (landIconLayer) landIconLayer.setOpacity(0.35);
    if (workIconLayer) workIconLayer.setOpacity(0.7);
  }
};

const updateLayerVisibility = () => {
  if (basemapLayer) basemapLayer.setVisible(uiStore.showBasemap);
  if (labelLayer) labelLayer.setVisible(uiStore.showLabels);
  if (landLayer) landLayer.setVisible(uiStore.showLandLots);
  if (workLayer) workLayer.setVisible(uiStore.showWorkLots);
  if (landIconLayer) landIconLayer.setVisible(uiStore.showLandLots);
  if (workIconLayer) workIconLayer.setVisible(uiStore.showWorkLots);
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
  const feature = format.readFeature(
    {
      type: "Feature",
      geometry: lot.geometry,
      properties: {
        operatorName: lot.operatorName,
        status: lot.status,
      },
    },
    { dataProjection: EPSG_2326, featureProjection: EPSG_2326 }
  );
  feature.setId(lot.id);
  feature.set("layerType", "work");
  feature.set("refId", lot.id);
  return feature;
};

const createIconFeature = (lot, type) => {
  if (!lot?.geometry) return null;
  const geometry = geojsonToGeometry(lot.geometry);
  if (!geometry) return null;
  const interiorPoint = geometry.getInteriorPoint ? geometry.getInteriorPoint() : null;
  const pointGeometry = interiorPoint ?? new Point(getCenter(geometry.getExtent()));
  const feature = new Feature({
    geometry: pointGeometry,
    status: lot.status,
  });
  feature.setId(`${type}-icon-${lot.id}`);
  feature.set("layerType", type);
  feature.set("refId", lot.id);
  return feature;
};

const refreshLandSource = () => {
  if (!landSource) return;
  landSource.clear(true);
  landLotStore.landLots
    .map(createLandFeature)
    .filter(Boolean)
    .forEach((feature) => landSource.addFeature(feature));
  refreshLandIcons();
};

const refreshWorkSource = () => {
  if (!workSource) return;
  workSource.clear(true);
  workLotStore.workLots
    .map(createWorkFeature)
    .filter(Boolean)
    .forEach((feature) => workSource.addFeature(feature));
  refreshWorkIcons();
};

const refreshLandIcons = () => {
  if (!landIconSource) return;
  landIconSource.clear(true);
  landLotStore.landLots
    .map((lot) => createIconFeature(lot, "land"))
    .filter(Boolean)
    .forEach((feature) => landIconSource.addFeature(feature));
};

const refreshWorkIcons = () => {
  if (!workIconSource) return;
  workIconSource.clear(true);
  workLotStore.workLots
    .map((lot) => createIconFeature(lot, "work"))
    .filter(Boolean)
    .forEach((feature) => workIconSource.addFeature(feature));
};

const refreshHighlights = () => {
  if (!landHighlightSource || !workHighlightSource) return;
  landHighlightSource.clear(true);
  workHighlightSource.clear(true);

  relatedLandLots.value
    .map(createLandFeature)
    .filter(Boolean)
    .forEach((feature) => landHighlightSource.addFeature(feature));

  relatedWorkLots.value
    .map(createWorkFeature)
    .filter(Boolean)
    .forEach((feature) => workHighlightSource.addFeature(feature));
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
      updateRelationsForLandLot(id, geometry);
    } else if (activeLayerType.value === "work") {
      workLotStore.updateWorkLot(id, { geometry, updatedAt, updatedBy: authStore.roleName });
      updateRelationsForWorkLot(id, geometry);
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
        relationStore.removeRelationsByLandLot(id);
      } else {
        workLotStore.removeWorkLot(id);
        relationStore.removeRelationsByWorkLot(id);
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
    const selectLayers = [workLayer, landLayer, workIconLayer, landIconLayer].filter(Boolean);
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
  updateRelationsForLandLot(id, pendingGeometry.value);
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
  updateRelationsForWorkLot(id, pendingGeometry.value);
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
  taskStore.addTask(selectedWorkLot.value.id, title, authStore.roleName);
  newTaskTitle.value = "";
};

const updateRelationsForWorkLot = (workLotId, geometry) => {
  const workGeom = geojsonToGeometry(geometry);
  const landLotIds = landLotStore.landLots
    .filter((lot) => geometriesIntersect(workGeom, geojsonToGeometry(lot.geometry)))
    .map((lot) => lot.id);
  relationStore.replaceRelationsForWorkLot(workLotId, landLotIds, authStore.roleName, "spatial");
};

const updateRelationsForLandLot = (landLotId, geometry) => {
  const landGeom = geojsonToGeometry(geometry);
  const workLotIds = workLotStore.workLots
    .filter((lot) => geometriesIntersect(landGeom, geojsonToGeometry(lot.geometry)))
    .map((lot) => lot.id);
  relationStore.replaceRelationsForLandLot(landLotId, workLotIds, authStore.roleName, "spatial");
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
  landIconSource = new VectorSource();
  workIconSource = new VectorSource();
  landHighlightSource = new VectorSource();
  workHighlightSource = new VectorSource();

  landLayer = new VectorLayer({ source: landSource, style: landLotStyle });
  workLayer = new VectorLayer({ source: workSource, style: workLotStyle });
  landHighlightLayer = new VectorLayer({ source: landHighlightSource, style: highlightLandLotStyle });
  workHighlightLayer = new VectorLayer({ source: workHighlightSource, style: highlightWorkLotStyle });
  landIconLayer = new VectorLayer({ source: landIconSource, style: landLotIconStyle });
  workIconLayer = new VectorLayer({ source: workIconSource, style: workLotIconStyle });

  landLayer.setZIndex(10);
  workLayer.setZIndex(20);
  landHighlightLayer.setZIndex(25);
  workHighlightLayer.setZIndex(26);
  landIconLayer.setZIndex(30);
  workIconLayer.setZIndex(31);

  mapRef.value = new Map({
    target: mapEl.value,
    layers: [
      basemapLayer,
      labelLayer,
      landLayer,
      workLayer,
      landHighlightLayer,
      workHighlightLayer,
      landIconLayer,
      workIconLayer,
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
  () => [uiStore.selectedWorkLotId, uiStore.selectedLandLotId],
  () => refreshHighlights()
);

watch(
  () => relationStore.relations,
  () => refreshHighlights(),
  { deep: true }
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
  relationStore.seedIfEmpty(landLotStore.landLots, workLotStore.workLots);
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

.toolbar {
  position: absolute;
  top: 20px;
  left: 24px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  background: var(--panel);
  padding: 8px;
  border-radius: 12px;
  box-shadow: var(--shadow);
}

.edit-target {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 6px;
  font-size: 12px;
  color: var(--muted);
}

.edit-target :deep(.el-segmented) {
  background: #f8fafc;
}

.left-panel {
  position: absolute;
  top: 78px;
  left: 24px;
  width: 320px;
  max-height: calc(100% - 140px);
  background: var(--panel);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 8px 12px 0 12px;
}

.panel-tabs :deep(.el-tabs__content) {
  padding: 8px 12px 16px 12px;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.panel-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.legend {
  border-top: 1px solid var(--border);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.legend-title {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.2);
}

.swatch.pending {
  background: rgba(148, 163, 184, 0.5);
}

.swatch.progress {
  background: rgba(250, 204, 21, 0.5);
}

.swatch.handover {
  background: rgba(34, 197, 94, 0.5);
}

.swatch.difficult {
  background: rgba(239, 68, 68, 0.5);
}

.task-list-global {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.task-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  text-align: left;
  cursor: pointer;
}

.task-card:hover {
  border-color: rgba(15, 118, 110, 0.4);
  background: #f1f5f9;
}

.task-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.task-title {
  font-size: 13px;
  font-weight: 600;
}

.task-card-meta {
  font-size: 11px;
  color: var(--muted);
  display: flex;
  justify-content: space-between;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.list-scroll {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow-y: auto;
}

.list-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  text-align: left;
  background: #f8fafc;
  cursor: pointer;
}

.list-item:hover {
  border-color: rgba(15, 118, 110, 0.4);
  background: #f1f5f9;
}

.list-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.list-title {
  font-size: 13px;
  font-weight: 600;
}

.list-meta {
  font-size: 11px;
  color: var(--muted);
}

.search-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  text-align: left;
  background: #f8fafc;
  cursor: pointer;
}

.search-item:hover {
  border-color: rgba(15, 118, 110, 0.4);
  background: #f1f5f9;
}

.search-title {
  font-size: 13px;
  font-weight: 600;
}

.search-meta {
  font-size: 11px;
  color: var(--muted);
}

.related-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.chip {
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 10px;
  background: #ffffff;
  font-size: 11px;
  cursor: pointer;
}

.chip:hover {
  border-color: rgba(15, 118, 110, 0.4);
  background: #f1f5f9;
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

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-block {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-row span {
  color: var(--muted);
}

.task-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-header {
  font-size: 14px;
  font-weight: 600;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-meta {
  font-size: 11px;
  color: var(--muted);
}

@media (max-width: 900px) {
  .left-panel {
    width: calc(100% - 48px);
  }
}
</style>
