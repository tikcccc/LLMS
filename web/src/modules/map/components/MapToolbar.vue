<template>
  <div class="toolbar" role="toolbar" aria-label="Map toolbar">
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

    <div class="tool-row">
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
        <el-tooltip content="Create Polygon Lot (P)" placement="bottom" :show-after="450">
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

        <el-tooltip content="Create Circle Lot (O)" placement="bottom" :show-after="450">
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
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tool: { type: String, required: true },
  canEditLayer: { type: Boolean, required: true },
  hasDraft: { type: Boolean, required: true },
  hasScopeQuery: { type: Boolean, default: false },
  canSaveModify: { type: Boolean, default: false },
});

const emit = defineEmits([
  "set-tool",
  "cancel-tool",
  "save-modify",
]);

const modeOptions = [
  { label: "Browse", value: "browse" },
  { label: "Scope", value: "scope" },
  { label: "Edit", value: "edit" },
];

const activeMode = computed(() => {
  if (props.tool === "PAN" || props.tool === "MEASURE") return "browse";
  if (props.tool === "DRAW" || props.tool === "DRAW_CIRCLE") return "scope";
  return "edit";
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
</script>

<style scoped>
.toolbar {
  position: absolute;
  top: 16px;
  left: 24px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
  width: max-content;
  max-width: calc(100vw - 48px);
  padding: 8px 10px;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.34);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.96));
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(8px);
  overflow-x: auto;
  white-space: nowrap;
}

.toolbar::-webkit-scrollbar {
  height: 6px;
}

.toolbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.35);
  border-radius: 999px;
}

.mode-segment {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.92);
  flex: 0 0 auto;
}

.mode-btn {
  border: 0;
  min-height: 30px;
  min-width: 72px;
  padding: 0 10px;
  border-radius: 7px;
  background: transparent;
  color: #475569;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.mode-btn:hover {
  background: rgba(148, 163, 184, 0.14);
}

.mode-btn.active {
  color: #0f766e;
  background: rgba(15, 118, 110, 0.14);
  box-shadow: inset 0 0 0 1px rgba(15, 118, 110, 0.26);
}

.mode-btn.disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.tool-row {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.tool-btn {
  min-height: 30px;
  border-radius: 8px;
  padding: 0 10px;
  font-size: 11px;
}

.tool-btn.active {
  box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.22);
}

.danger-btn.deleting {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.28);
}

@media (max-width: 768px) {
  .toolbar {
    top: 12px;
    left: 12px;
    right: 12px;
    max-width: none;
    width: auto;
  }
}
</style>
