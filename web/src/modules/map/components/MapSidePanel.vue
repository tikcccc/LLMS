<template>
  <aside class="left-panel" :class="{ resizing: isResizing }" :style="panelStyle">
    <el-tabs v-model="leftTabProxy" class="panel-tabs">
      <el-tab-pane label="Layers" name="layers">
        <div class="panel-section">
          <div class="panel-row">
            <span>Basemap</span>
            <el-switch v-model="showBasemapProxy" />
          </div>
          <div class="panel-row">
            <span>Labels (EN)</span>
            <el-switch v-model="showLabelsProxy" />
          </div>
          <div class="panel-row">
            <span>Drawing Layer</span>
            <el-switch v-model="showIntLandProxy" />
          </div>
          <div class="panel-row">
            <span>Site Boundary</span>
            <el-switch v-model="showSiteBoundaryProxy" />
          </div>
          <div class="panel-row">
            <span>Work Lots</span>
            <el-switch v-model="showWorkLotsProxy" />
          </div>
        </div>

      </el-tab-pane>

      <el-tab-pane label="Scope Results" name="scope">
        <div class="scope-pane">
          <div class="scope-summary">
            <div class="scope-summary-top">
              <div class="scope-title">{{ scopeModeName }}</div>
              <el-tag size="small" effect="plain" type="info">
                {{ scopeSiteBoundaryResults.length + scopeWorkLotResults.length }} results
              </el-tag>
            </div>
            <div class="scope-metrics">
              <span class="scope-pill">
                {{ scopeSiteBoundaryResults.length }} site boundaries
              </span>
              <span class="scope-pill">
                {{ scopeWorkLotResults.length }} work lots
              </span>
            </div>
          </div>

          <template
            v-if="scopeSiteBoundaryResults.length > 0 || scopeWorkLotResults.length > 0"
          >
            <section v-if="scopeSiteBoundaryResults.length > 0" class="scope-block">
              <div class="list-subtitle">
                Site Boundaries
                <span class="subtitle-count">{{ scopeSiteBoundaryResults.length }}</span>
              </div>
              <div class="scope-list">
                <button
                  v-for="boundary in scopeSiteBoundaryResults"
                  :key="`scope-${boundary.id}`"
                  class="list-item"
                  type="button"
                  @click="emit('focus-site-boundary', boundary.id)"
                >
                  <div class="list-title-row">
                    <span class="list-title">{{ boundary.name }}</span>
                    <el-tag size="small" effect="plain">Site Boundary</el-tag>
                  </div>
                  <div class="list-meta">{{ boundary.id }} · {{ boundary.layer }}</div>
                </button>
              </div>
            </section>

            <section v-if="scopeWorkLotResults.length > 0" class="scope-block">
              <div class="list-subtitle">
                Work Lots
                <span class="subtitle-count">{{ scopeWorkLotResults.length }}</span>
              </div>
              <div class="scope-list">
                <button
                  v-for="lot in scopeWorkLotResults"
                  :key="`scope-work-${lot.id}`"
                  class="list-item"
                  type="button"
                  @click="emit('focus-work', lot.id)"
                >
                  <div class="list-title-row">
                    <span class="list-title">{{ lot.operatorName }}</span>
                    <el-tag size="small" effect="plain" :style="workStatusStyle(lot.status)">
                      {{ lot.status }}
                    </el-tag>
                  </div>
                  <div class="list-meta">{{ lot.id }}</div>
                </button>
              </div>
            </section>
          </template>

          <el-empty
            v-else
            class="scope-empty"
            description="Use Scope/Circle tool to draw a range"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Tasks" name="tasks">
        <div class="panel-section">
          <el-select v-model="taskFilterProxy" size="small" style="width: 140px">
            <el-option label="All" value="All" />
            <el-option label="Open" value="Open" />
            <el-option label="Done" value="Done" />
            <el-option label="Overdue" value="Overdue" />
          </el-select>
        </div>
        <div class="task-list-global">
          <button
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-card"
            type="button"
            @click="emit('focus-task', task)"
          >
            <div class="task-card-top">
              <span class="task-title">{{ task.title }}</span>
              <div class="task-tags">
                <el-tag size="small" :type="task.status === 'Done' ? 'success' : 'info'">
                  {{ task.status }}
                </el-tag>
                <el-tag v-if="isOverdue(task)" size="small" type="danger">Overdue</el-tag>
              </div>
            </div>
            <div class="task-card-meta">
              <span>{{ workLotName(task.workLotId) }}</span>
              <span>
                {{ task.assignee }} · <TimeText :value="task.dueDate" mode="date" />
              </span>
            </div>
          </button>
          <el-empty v-if="filteredTasks.length === 0" description="No tasks" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Work Lots" name="worklots">
        <div class="panel-section">
          <el-input v-model="workSearchProxy" placeholder="Search work lots" clearable />
        </div>
        <div class="list-scroll">
          <button
            v-for="lot in workLotResults"
            :key="lot.id"
            class="list-item"
            type="button"
            @click="emit('focus-work', lot.id)"
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

      <el-tab-pane label="Site Boundaries" name="siteboundaries">
        <div class="panel-section">
          <el-input
            v-model="siteBoundarySearchProxy"
            placeholder="Search site boundaries"
            clearable
          />
        </div>
        <div class="list-scroll">
          <button
            v-for="boundary in siteBoundaryResults"
            :key="boundary.id"
            class="list-item"
            type="button"
            @click="emit('focus-site-boundary', boundary.id)"
          >
            <div class="list-title-row">
              <span class="list-title">{{ boundary.name }}</span>
              <el-tag size="small" effect="plain">Site Boundary</el-tag>
            </div>
            <div class="list-meta">{{ boundary.id }} · {{ boundary.layer }}</div>
          </button>
          <el-empty v-if="siteBoundaryResults.length === 0" description="No site boundaries" />
        </div>
      </el-tab-pane>
    </el-tabs>
    <button
      class="resize-corner"
      type="button"
      aria-label="Resize side panel"
      @pointerdown="startResize"
      @dblclick="resetPanelSize"
    >
      <span class="resize-corner-icon"></span>
    </button>
  </aside>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import TimeText from "../../../components/TimeText.vue";

const props = defineProps({
  leftTab: { type: String, required: true },
  taskFilter: { type: String, required: true },
  workSearchQuery: { type: String, required: true },
  siteBoundarySearchQuery: { type: String, required: true },
  showBasemap: { type: Boolean, required: true },
  showLabels: { type: Boolean, required: true },
  showIntLand: { type: Boolean, required: true },
  showSiteBoundary: { type: Boolean, required: true },
  showWorkLots: { type: Boolean, required: true },
  filteredTasks: { type: Array, required: true },
  workLotResults: { type: Array, required: true },
  siteBoundaryResults: { type: Array, required: true },
  scopeWorkLotResults: { type: Array, required: true },
  scopeSiteBoundaryResults: { type: Array, required: true },
  scopeModeName: { type: String, required: true },
  workLotName: { type: Function, required: true },
  isOverdue: { type: Function, required: true },
  workStatusStyle: { type: Function, required: true },
});

const emit = defineEmits([
  "update:leftTab",
  "update:taskFilter",
  "update:workSearchQuery",
  "update:siteBoundarySearchQuery",
  "update:showBasemap",
  "update:showLabels",
  "update:showIntLand",
  "update:showSiteBoundary",
  "update:showWorkLots",
  "focus-task",
  "focus-work",
  "focus-site-boundary",
]);

const leftTabProxy = computed({
  get: () => props.leftTab,
  set: (value) => emit("update:leftTab", value),
});
const taskFilterProxy = computed({
  get: () => props.taskFilter,
  set: (value) => emit("update:taskFilter", value),
});
const workSearchProxy = computed({
  get: () => props.workSearchQuery,
  set: (value) => emit("update:workSearchQuery", value),
});
const siteBoundarySearchProxy = computed({
  get: () => props.siteBoundarySearchQuery,
  set: (value) => emit("update:siteBoundarySearchQuery", value),
});
const showBasemapProxy = computed({
  get: () => props.showBasemap,
  set: (value) => emit("update:showBasemap", value),
});
const showLabelsProxy = computed({
  get: () => props.showLabels,
  set: (value) => emit("update:showLabels", value),
});
const showIntLandProxy = computed({
  get: () => props.showIntLand,
  set: (value) => emit("update:showIntLand", value),
});
const showSiteBoundaryProxy = computed({
  get: () => props.showSiteBoundary,
  set: (value) => emit("update:showSiteBoundary", value),
});
const showWorkLotsProxy = computed({
  get: () => props.showWorkLots,
  set: (value) => emit("update:showWorkLots", value),
});

const PANEL_WIDTH_STORAGE_KEY = "ND_LLM_V1_map_side_panel_width";
const PANEL_HEIGHT_STORAGE_KEY = "ND_LLM_V1_map_side_panel_height";

const PANEL_MIN_WIDTH = 280;
const PANEL_DEFAULT_WIDTH = 320;
const PANEL_MAX_WIDTH = 560;

const PANEL_MIN_HEIGHT = 300;
const PANEL_DEFAULT_HEIGHT = 520;
const PANEL_MAX_HEIGHT = 860;

const readStoredSize = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const clampPanelWidth = (width) => {
  if (!Number.isFinite(width)) return PANEL_DEFAULT_WIDTH;
  if (typeof window === "undefined") {
    return Math.min(Math.max(width, PANEL_MIN_WIDTH), PANEL_MAX_WIDTH);
  }
  const viewportMax = Math.max(PANEL_MIN_WIDTH, window.innerWidth - 56);
  const hardMax = Math.min(PANEL_MAX_WIDTH, viewportMax);
  return Math.min(Math.max(width, PANEL_MIN_WIDTH), hardMax);
};

const clampPanelHeight = (height) => {
  if (!Number.isFinite(height)) return PANEL_DEFAULT_HEIGHT;
  if (typeof window === "undefined") {
    return Math.min(Math.max(height, PANEL_MIN_HEIGHT), PANEL_MAX_HEIGHT);
  }
  const viewportMax = Math.max(PANEL_MIN_HEIGHT, window.innerHeight - 96);
  const hardMax = Math.min(PANEL_MAX_HEIGHT, viewportMax);
  return Math.min(Math.max(height, PANEL_MIN_HEIGHT), hardMax);
};

const panelWidth = ref(
  clampPanelWidth(readStoredSize(PANEL_WIDTH_STORAGE_KEY, PANEL_DEFAULT_WIDTH))
);
const panelHeight = ref(
  clampPanelHeight(readStoredSize(PANEL_HEIGHT_STORAGE_KEY, PANEL_DEFAULT_HEIGHT))
);
const isResizing = ref(false);
const panelStyle = computed(() => ({
  "--panel-width": `${panelWidth.value}px`,
  "--panel-height": `${panelHeight.value}px`,
}));

let dragStartX = 0;
let dragStartY = 0;
let dragStartWidth = panelWidth.value;
let dragStartHeight = panelHeight.value;

const persistPanelSize = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidth.value));
  window.localStorage.setItem(PANEL_HEIGHT_STORAGE_KEY, String(panelHeight.value));
};

const handleResizeMove = (event) => {
  if (!isResizing.value) return;
  const deltaX = event.clientX - dragStartX;
  const deltaY = event.clientY - dragStartY;
  panelWidth.value = clampPanelWidth(dragStartWidth + deltaX);
  panelHeight.value = clampPanelHeight(dragStartHeight + deltaY);
};

const stopResize = () => {
  if (!isResizing.value) return;
  isResizing.value = false;
  window.removeEventListener("pointermove", handleResizeMove);
  window.removeEventListener("pointerup", stopResize);
  window.removeEventListener("pointercancel", stopResize);
  persistPanelSize();
};

const startResize = (event) => {
  if (typeof window === "undefined" || window.innerWidth <= 900) return;
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  isResizing.value = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragStartWidth = panelWidth.value;
  dragStartHeight = panelHeight.value;
  window.addEventListener("pointermove", handleResizeMove);
  window.addEventListener("pointerup", stopResize);
  window.addEventListener("pointercancel", stopResize);
};

const resetPanelSize = () => {
  panelWidth.value = clampPanelWidth(PANEL_DEFAULT_WIDTH);
  panelHeight.value = clampPanelHeight(PANEL_DEFAULT_HEIGHT);
  persistPanelSize();
};

const handleWindowResize = () => {
  panelWidth.value = clampPanelWidth(panelWidth.value);
  panelHeight.value = clampPanelHeight(panelHeight.value);
  persistPanelSize();
};

onMounted(() => {
  if (typeof window === "undefined") return;
  window.addEventListener("resize", handleWindowResize);
});

onBeforeUnmount(() => {
  stopResize();
  if (typeof window === "undefined") return;
  window.removeEventListener("resize", handleWindowResize);
});
</script>

<style scoped>
.left-panel {
  position: absolute;
  top: 78px;
  left: 24px;
  width: var(--panel-width, 320px);
  height: var(--panel-height, 520px);
  min-width: 280px;
  max-width: min(560px, calc(100% - 48px));
  max-height: calc(100% - 96px);
  background: var(--panel);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.resize-corner {
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 16px;
  height: 16px;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: nwse-resize;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  touch-action: none;
  z-index: 2;
}

.resize-corner-icon {
  width: 10px;
  height: 10px;
  border-right: 2px solid rgba(148, 163, 184, 0.86);
  border-bottom: 2px solid rgba(148, 163, 184, 0.86);
  border-bottom-right-radius: 2px;
}

.left-panel.resizing,
.left-panel.resizing * {
  cursor: nwse-resize !important;
  user-select: none;
}

.resize-corner:hover .resize-corner-icon,
.resize-corner:focus-visible .resize-corner-icon {
  background: rgba(59, 130, 246, 0.86);
  border-right-color: rgba(59, 130, 246, 0.92);
  border-bottom-color: rgba(59, 130, 246, 0.92);
}

.panel-tabs {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 8px 12px 0 12px;
}

.panel-tabs :deep(.el-tabs__content) {
  padding: 8px 12px 16px 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel-tabs :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
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

.task-list-global {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
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

.task-tags {
  display: flex;
  gap: 6px;
  align-items: center;
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

.list-scroll {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
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

.scope-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #f8fafc;
}

.scope-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.scope-summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.scope-metrics {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.scope-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(241, 245, 249, 0.92);
  font-size: 11px;
  color: var(--muted);
}

.scope-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scope-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.scope-meta {
  font-size: 11px;
  color: var(--muted);
}

.list-subtitle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.subtitle-count {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0;
  text-transform: none;
}

.scope-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scope-empty {
  padding: 12px 0;
}

@media (max-width: 900px) {
  .left-panel {
    width: calc(100% - 48px);
    height: calc(100% - 140px);
    min-width: 0;
    max-width: none;
  }

  .resize-corner {
    display: none;
  }
}
</style>
