<template>
  <aside
    class="left-panel"
    :class="{ resizing: isResizing, mobile: isMobile, 'mobile-open': mobilePanelOpen }"
    :style="panelStyle"
  >
    <div v-if="isMobile" class="mobile-sheet-header">
      <button
        class="mobile-sheet-grip-btn"
        type="button"
        aria-label="Toggle map side panel"
        @click="toggleMobilePanel"
      >
        <span class="mobile-sheet-grip"></span>
      </button>
      <div class="mobile-sheet-title">{{ mobilePanelTitle }}</div>
      <button
        class="mobile-sheet-close-btn"
        type="button"
        aria-label="Collapse map side panel"
        @click="closeMobilePanel"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>

    <el-tabs v-show="!isMobile || mobilePanelOpen" v-model="leftTabProxy" class="panel-tabs">
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
            <span>Work Lots (Group)</span>
            <el-switch v-model="showWorkLotsProxy" />
          </div>
          <div class="panel-row panel-row-nested">
            <span>BU Business Undertaking</span>
            <el-switch v-model="showWorkLotsBusinessProxy" />
          </div>
          <div class="panel-row panel-row-nested">
            <span>Domestic</span>
            <el-switch v-model="showWorkLotsDomesticProxy" />
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
                  <div class="list-meta">{{ lot.id }} · {{ workCategoryLabel(lot.category) }}</div>
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
            <div class="list-meta">{{ lot.id }} · {{ workCategoryLabel(lot.category) }}</div>
            <div class="list-meta subtle">
              {{ lot.responsiblePerson || "Unassigned" }} · Due {{ lot.dueDate || "—" }}
            </div>
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
      v-if="!isMobile"
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  leftTab: { type: String, required: true },
  workSearchQuery: { type: String, required: true },
  siteBoundarySearchQuery: { type: String, required: true },
  showBasemap: { type: Boolean, required: true },
  showLabels: { type: Boolean, required: true },
  showIntLand: { type: Boolean, required: true },
  showSiteBoundary: { type: Boolean, required: true },
  showWorkLots: { type: Boolean, required: true },
  showWorkLotsBusiness: { type: Boolean, required: true },
  showWorkLotsDomestic: { type: Boolean, required: true },
  workLotResults: { type: Array, required: true },
  siteBoundaryResults: { type: Array, required: true },
  scopeWorkLotResults: { type: Array, required: true },
  scopeSiteBoundaryResults: { type: Array, required: true },
  scopeModeName: { type: String, required: true },
  workStatusStyle: { type: Function, required: true },
  workCategoryLabel: { type: Function, required: true },
});

const emit = defineEmits([
  "update:leftTab",
  "update:workSearchQuery",
  "update:siteBoundarySearchQuery",
  "update:showBasemap",
  "update:showLabels",
  "update:showIntLand",
  "update:showSiteBoundary",
  "update:showWorkLots",
  "update:showWorkLotsBusiness",
  "update:showWorkLotsDomestic",
  "focus-work",
  "focus-site-boundary",
]);

const leftTabProxy = computed({
  get: () => props.leftTab,
  set: (value) => emit("update:leftTab", value),
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
  set: (value) => {
    emit("update:showWorkLots", value);
    emit("update:showWorkLotsBusiness", value);
    emit("update:showWorkLotsDomestic", value);
  },
});
const showWorkLotsBusinessProxy = computed({
  get: () => props.showWorkLotsBusiness,
  set: (value) => {
    emit("update:showWorkLotsBusiness", value);
    emit("update:showWorkLots", value || props.showWorkLotsDomestic);
  },
});
const showWorkLotsDomesticProxy = computed({
  get: () => props.showWorkLotsDomestic,
  set: (value) => {
    emit("update:showWorkLotsDomestic", value);
    emit("update:showWorkLots", value || props.showWorkLotsBusiness);
  },
});

const MOBILE_BREAKPOINT = 900;
const mobilePanelOpen = ref(true);
const isMobile = ref(false);

const TAB_TITLES = {
  layers: "Layers",
  scope: "Scope Results",
  worklots: "Work Lots",
  siteboundaries: "Site Boundaries",
};

const mobilePanelTitle = computed(() => TAB_TITLES[leftTabProxy.value] || "Panel");

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
  if (typeof window === "undefined" || window.innerWidth <= MOBILE_BREAKPOINT) return;
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

let mobileQueryList = null;

const applyMobileMode = (mobile) => {
  isMobile.value = mobile;
  if (mobile) {
    mobilePanelOpen.value = false;
    stopResize();
    return;
  }
  mobilePanelOpen.value = true;
};

const toggleMobilePanel = () => {
  if (!isMobile.value) return;
  mobilePanelOpen.value = !mobilePanelOpen.value;
};

const closeMobilePanel = () => {
  if (!isMobile.value) return;
  mobilePanelOpen.value = false;
};

const handleMobileMediaChange = (event) => {
  applyMobileMode(event.matches);
};

const handleWindowResize = () => {
  panelWidth.value = clampPanelWidth(panelWidth.value);
  panelHeight.value = clampPanelHeight(panelHeight.value);
  persistPanelSize();
};

watch(
  () => props.leftTab,
  () => {
    if (isMobile.value) {
      mobilePanelOpen.value = true;
    }
  }
);

onMounted(() => {
  if (typeof window === "undefined") return;
  mobileQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  applyMobileMode(mobileQueryList.matches);
  if (typeof mobileQueryList.addEventListener === "function") {
    mobileQueryList.addEventListener("change", handleMobileMediaChange);
  } else if (typeof mobileQueryList.addListener === "function") {
    mobileQueryList.addListener(handleMobileMediaChange);
  }
  window.addEventListener("resize", handleWindowResize);
});

onBeforeUnmount(() => {
  stopResize();
  if (typeof window === "undefined") return;
  if (mobileQueryList) {
    if (typeof mobileQueryList.removeEventListener === "function") {
      mobileQueryList.removeEventListener("change", handleMobileMediaChange);
    } else if (typeof mobileQueryList.removeListener === "function") {
      mobileQueryList.removeListener(handleMobileMediaChange);
    }
  }
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

.mobile-sheet-header {
  display: none;
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

.panel-row-nested {
  padding-left: 16px;
  color: #475569;
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

.list-meta.subtle {
  margin-top: 2px;
  color: #64748b;
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
    top: auto;
    left: 10px;
    right: 10px;
    bottom: 10px;
    width: auto;
    height: min(70vh, 560px);
    max-height: calc(100% - 88px);
    min-width: 0;
    max-width: none;
    border-radius: 14px;
    transition: transform 0.22s ease, box-shadow 0.22s ease;
    z-index: 95;
  }

  .left-panel.mobile:not(.mobile-open) {
    transform: translateY(calc(100% - 52px));
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  }

  .mobile-sheet-header {
    height: 52px;
    padding: 6px 10px 6px 10px;
    border-bottom: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.98);
    display: grid;
    grid-template-columns: 44px 1fr 32px;
    align-items: center;
    gap: 8px;
  }

  .mobile-sheet-grip-btn {
    border: 0;
    background: transparent;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }

  .mobile-sheet-grip {
    width: 26px;
    height: 4px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.8);
  }

  .mobile-sheet-title {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    letter-spacing: 0.02em;
  }

  .mobile-sheet-close-btn {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    padding: 0;
  }

  .mobile-sheet-close-btn svg {
    width: 15px;
    height: 15px;
  }

  .panel-tabs {
    min-height: 0;
  }

  .panel-tabs :deep(.el-tabs__header) {
    padding: 4px 10px 0 10px;
  }

  .panel-tabs :deep(.el-tabs__content) {
    padding: 8px 10px 12px 10px;
  }

  .resize-corner {
    display: none;
  }
}
</style>
