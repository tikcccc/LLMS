<template>
  <div class="toolbar" role="toolbar" aria-label="Map toolbar">
    <div class="toolbar-head">
      <div class="mode-segment" role="tablist" aria-label="Work mode">
        <button
          v-for="mode in modeOptions"
          :key="mode.value"
          type="button"
          class="mode-btn"
          :class="{
            active: activeMode === mode.value,
            disabled: mode.value === 'edit' && !canEditLayer,
          }"
          :aria-selected="activeMode === mode.value"
          :disabled="mode.value === 'edit' && !canEditLayer"
          @click="switchMode(mode.value)"
        >
          {{ mode.label }}
        </button>
      </div>

      <button
        v-if="isMobile"
        type="button"
        class="mobile-tools-toggle"
        @click="toggleMobileTools"
      >
        {{ mobileToolsExpanded ? "Hide" : "Tools" }}
      </button>
    </div>

    <div v-show="showToolRow" class="tool-row">
      <template v-if="activeMode === 'browse'">
        <el-tooltip content="Pan & Select (V)" placement="bottom" :show-after="450">
          <el-button
            size="small"
            class="tool-btn"
            :type="tool === 'PAN' ? 'primary' : 'default'"
            :class="{ active: tool === 'PAN' }"
            @click="emit('set-tool', 'PAN')"
          >
            Pan
          </el-button>
        </el-tooltip>

        <el-tooltip content="Measure Distance (L)" placement="bottom" :show-after="450">
          <el-button
            size="small"
            class="tool-btn"
            :type="tool === 'MEASURE' ? 'primary' : 'default'"
            :class="{ active: tool === 'MEASURE' }"
            @click="emit('set-tool', 'MEASURE')"
          >
            Measure
          </el-button>
        </el-tooltip>
      </template>

      <template v-else-if="activeMode === 'scope'">
        <el-tooltip content="Scope Brush (D)" placement="bottom" :show-after="450">
          <el-button
            size="small"
            class="tool-btn"
            :type="tool === 'DRAW' ? 'primary' : 'default'"
            :class="{ active: tool === 'DRAW' }"
            @click="emit('set-tool', 'DRAW')"
          >
            Scope
          </el-button>
        </el-tooltip>

        <el-tooltip content="Scope Circle (C)" placement="bottom" :show-after="450">
          <el-button
            size="small"
            class="tool-btn"
            :type="tool === 'DRAW_CIRCLE' ? 'primary' : 'default'"
            :class="{ active: tool === 'DRAW_CIRCLE' }"
            @click="emit('set-tool', 'DRAW_CIRCLE')"
          >
            Circle Scope
          </el-button>
        </el-tooltip>

        <el-tooltip content="Clear scope result (ESC)" placement="bottom" :show-after="450">
          <el-button
            size="small"
            type="warning"
            class="tool-btn"
            :disabled="!canClearScope"
            @click="emit('cancel-tool')"
          >
            Clear
          </el-button>
        </el-tooltip>
      </template>

      <template v-else>
        <div class="layer-select-wrap">
          <span class="layer-select-label">Draw Target</span>
          <el-select
            v-model="activeLayerTypeProxy"
            size="small"
            class="layer-select"
            :disabled="!canEditLayer"
            aria-label="Select draw target"
          >
            <el-option
              v-for="item in layerTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>

        <el-tooltip content="Create Polygon (P)" placement="bottom" :show-after="450">
          <el-button
            size="small"
            class="tool-btn"
            :disabled="!canEditLayer"
            :type="tool === 'POLYGON' ? 'primary' : 'default'"
            :class="{ active: tool === 'POLYGON' }"
            @click="emit('set-tool', 'POLYGON')"
          >
            Polygon
          </el-button>
        </el-tooltip>

        <el-tooltip content="Create Circle (O)" placement="bottom" :show-after="450">
          <el-button
            size="small"
            class="tool-btn"
            :disabled="!canEditLayer"
            :type="tool === 'POLYGON_CIRCLE' ? 'primary' : 'default'"
            :class="{ active: tool === 'POLYGON_CIRCLE' }"
            @click="emit('set-tool', 'POLYGON_CIRCLE')"
          >
            Circle Lot
          </el-button>
        </el-tooltip>

        <el-tooltip content="Modify Geometry (M)" placement="bottom" :show-after="450">
          <el-button
            size="small"
            class="tool-btn"
            :disabled="!canEditLayer"
            :type="tool === 'MODIFY' ? 'primary' : 'default'"
            :class="{ active: tool === 'MODIFY' }"
            @click="emit('set-tool', 'MODIFY')"
          >
            Modify
          </el-button>
        </el-tooltip>

        <el-tooltip content="Delete Mode (X)" placement="bottom" :show-after="450">
          <el-button
            size="small"
            class="tool-btn danger-btn"
            :disabled="!canEditLayer"
            :type="tool === 'DELETE' ? 'danger' : 'default'"
            :class="{ active: tool === 'DELETE', deleting: tool === 'DELETE' }"
            @click="emit('set-tool', 'DELETE')"
          >
            Delete
          </el-button>
        </el-tooltip>
      </template>

      <el-tooltip v-if="showCancelControl" content="Cancel (ESC)" placement="bottom" :show-after="450">
        <el-button
          size="small"
          type="warning"
          class="tool-btn"
          @click="emit('cancel-tool')"
        >
          Cancel
        </el-button>
      </el-tooltip>

      <el-tooltip v-if="showSave" content="Save modify result" placement="bottom" :show-after="450">
        <el-button
          size="small"
          type="success"
          class="tool-btn"
          @click="emit('save-modify')"
        >
          Save
        </el-button>
      </el-tooltip>

      <el-tooltip
        v-if="showPartOfSitesExport"
        content="Export current Part of Sites GeoJSON"
        placement="bottom"
        :show-after="450"
      >
        <el-button
          size="small"
          class="tool-btn"
          :disabled="!canExportPartOfSites"
          @click="emit('export-part-of-sites')"
        >
          Export GeoJSON
        </el-button>
      </el-tooltip>

      <el-tooltip
        v-if="showSectionsExport"
        content="Export current Sections GeoJSON"
        placement="bottom"
        :show-after="450"
      >
        <el-button
          size="small"
          class="tool-btn"
          :disabled="!canExportSections"
          @click="emit('export-sections')"
        >
          Export Sections
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const props = defineProps({
  tool: { type: String, required: true },
  canEditLayer: { type: Boolean, required: true },
  activeLayerType: { type: String, default: "work" },
  hasDraft: { type: Boolean, required: true },
  hasScopeQuery: { type: Boolean, default: false },
  canSaveModify: { type: Boolean, default: false },
  canExportPartOfSites: { type: Boolean, default: false },
  canExportSections: { type: Boolean, default: false },
});

const emit = defineEmits([
  "set-tool",
  "set-active-layer",
  "cancel-tool",
  "save-modify",
  "export-part-of-sites",
  "export-sections",
]);

const MOBILE_BREAKPOINT = 768;
const isMobile = ref(false);
const mobileToolsExpanded = ref(true);
let mobileQueryList = null;

const modeOptions = [
  { label: "Browse", value: "browse" },
  { label: "Scope", value: "scope" },
  { label: "Draw", value: "edit" },
];
const layerTypeOptions = [
  { label: "Work Lot", value: "work" },
  { label: "Site Boundary", value: "siteBoundary" },
  { label: "Part of Sites", value: "partOfSites" },
  { label: "Section", value: "section" },
];

const activeMode = computed(() => {
  if (props.tool === "PAN" || props.tool === "MEASURE") return "browse";
  if (props.tool === "DRAW" || props.tool === "DRAW_CIRCLE") return "scope";
  return "edit";
});
const activeLayerTypeProxy = computed({
  get: () =>
    layerTypeOptions.some((item) => item.value === props.activeLayerType)
      ? props.activeLayerType
      : "work",
  set: (value) => emit("set-active-layer", value),
});

const canClearScope = computed(() => props.hasDraft || props.hasScopeQuery);

const showCancel = computed(() => {
  if (props.tool === "DRAW" || props.tool === "DRAW_CIRCLE") {
    return props.hasDraft || props.hasScopeQuery;
  }
  return props.tool !== "PAN" || props.hasDraft;
});

const showSave = computed(() => props.tool === "MODIFY" && props.canSaveModify);

const showCancelControl = computed(() => {
  if (activeMode.value === "scope") return false;
  return showCancel.value;
});
const showPartOfSitesExport = computed(
  () => activeMode.value === "edit" && activeLayerTypeProxy.value === "partOfSites"
);
const showSectionsExport = computed(
  () => activeMode.value === "edit" && activeLayerTypeProxy.value === "section"
);

const showToolRow = computed(() => !isMobile.value || mobileToolsExpanded.value);

const syncMobileState = (matches) => {
  isMobile.value = matches;
  mobileToolsExpanded.value = !matches;
};

const handleMobileQueryChange = (event) => {
  syncMobileState(event.matches);
};

const toggleMobileTools = () => {
  mobileToolsExpanded.value = !mobileToolsExpanded.value;
};

const switchMode = (mode) => {
  if (mode === "browse") {
    emit("set-tool", "PAN");
    return;
  }
  if (mode === "scope") {
    emit("set-tool", "DRAW_CIRCLE");
    return;
  }
  if (!props.canEditLayer) return;
  if (["POLYGON", "POLYGON_CIRCLE", "MODIFY", "DELETE"].includes(props.tool)) {
    emit("set-tool", props.tool);
    return;
  }
  emit("set-tool", "POLYGON");
};

watch(
  () => props.tool,
  (tool) => {
    if (!isMobile.value) return;
    if (tool !== "PAN") {
      mobileToolsExpanded.value = true;
    }
  }
);

onMounted(() => {
  if (typeof window === "undefined") return;
  mobileQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  syncMobileState(mobileQueryList.matches);
  if (typeof mobileQueryList.addEventListener === "function") {
    mobileQueryList.addEventListener("change", handleMobileQueryChange);
  } else if (typeof mobileQueryList.addListener === "function") {
    mobileQueryList.addListener(handleMobileQueryChange);
  }
});

onBeforeUnmount(() => {
  if (!mobileQueryList) return;
  if (typeof mobileQueryList.removeEventListener === "function") {
    mobileQueryList.removeEventListener("change", handleMobileQueryChange);
  } else if (typeof mobileQueryList.removeListener === "function") {
    mobileQueryList.removeListener(handleMobileQueryChange);
  }
});
</script>

<style scoped src="./MapToolbar.css"></style>
