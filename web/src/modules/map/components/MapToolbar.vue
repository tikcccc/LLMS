<template>
  <div class="toolbar">
    <div class="tool-group">
      <el-tooltip content="Pan & Select (V)" placement="bottom" :show-after="500">
        <el-button 
          size="small" 
          :type="tool === 'PAN' ? 'primary' : 'default'" 
          @click="emit('set-tool', 'PAN')"
          class="tool-btn"
          :class="{ active: tool === 'PAN' }"
        >
          <span class="tool-icon">🖐️</span>
          <span class="tool-label">Pan</span>
        </el-button>
      </el-tooltip>

      <el-tooltip content="Scope Brush (D)" placement="bottom" :show-after="500">
        <el-button
          size="small"
          :type="tool === 'DRAW' ? 'primary' : 'default'"
          @click="emit('set-tool', 'DRAW')"
          class="tool-btn"
          :class="{ active: tool === 'DRAW' }"
        >
          <span class="tool-icon">🖌️</span>
          <span class="tool-label">Scope</span>
        </el-button>
      </el-tooltip>

      <el-tooltip content="Scope Circle (C)" placement="bottom" :show-after="500">
        <el-button
          size="small"
          :type="tool === 'DRAW_CIRCLE' ? 'primary' : 'default'"
          @click="emit('set-tool', 'DRAW_CIRCLE')"
          class="tool-btn"
          :class="{ active: tool === 'DRAW_CIRCLE' }"
        >
          <span class="tool-icon">🧭</span>
          <span class="tool-label">Scope Circle</span>
        </el-button>
      </el-tooltip>
    </div>

    <div class="divider"></div>

    <div class="tool-group">
      <el-tooltip content="Create Polygon Work Lot (P)" placement="bottom" :show-after="500">
        <el-button
          size="small"
          :type="tool === 'POLYGON' ? 'primary' : 'default'"
          :disabled="!canEditLayer"
          @click="emit('set-tool', 'POLYGON')"
          class="tool-btn"
          :class="{ active: tool === 'POLYGON' }"
        >
          <span class="tool-icon">✏️</span>
          <span class="tool-label">Polygon</span>
        </el-button>
      </el-tooltip>

      <el-tooltip content="Create Circular Work Lot (O)" placement="bottom" :show-after="500">
        <el-button
          size="small"
          :type="tool === 'POLYGON_CIRCLE' ? 'primary' : 'default'"
          :disabled="!canEditLayer"
          @click="emit('set-tool', 'POLYGON_CIRCLE')"
          class="tool-btn"
          :class="{ active: tool === 'POLYGON_CIRCLE' }"
        >
          <span class="tool-icon">⚪</span>
          <span class="tool-label">Circle Lot</span>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="Modify Geometry (M)" placement="bottom" :show-after="500">
        <el-button
          size="small"
          :type="tool === 'MODIFY' ? 'primary' : 'default'"
          :disabled="!canEditLayer"
          @click="emit('set-tool', 'MODIFY')"
          class="tool-btn"
          :class="{ active: tool === 'MODIFY' }"
        >
          <span class="tool-icon">✂️</span>
          <span class="tool-label">Modify</span>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="Delete Feature (X)" placement="bottom" :show-after="500">
        <el-button
          size="small"
          :type="tool === 'DELETE' ? 'primary' : 'default'"
          :disabled="!canEditLayer"
          @click="emit('set-tool', 'DELETE')"
          class="tool-btn"
          :class="{ active: tool === 'DELETE', 'delete-mode': tool === 'DELETE' }"
        >
          <span class="tool-icon">🗑️</span>
          <span class="tool-label">Delete</span>
        </el-button>
      </el-tooltip>
    </div>

    <div class="divider" v-if="showCancelOrTarget"></div>

    <el-button 
      v-if="showCancel"
      size="small" 
      type="warning"
      @click="emit('cancel-tool')"
      class="cancel-btn"
      title="Press ESC to cancel"
    >
      <span class="tool-icon">↩️</span>
      <span class="tool-label">Cancel</span>
      <span class="tool-shortcut">ESC</span>
    </el-button>

    <el-button
      v-if="showSave"
      size="small"
      type="success"
      @click="emit('save-modify')"
      class="save-btn"
      title="Save changes"
    >
      <span class="tool-icon">💾</span>
      <span class="tool-label">Save</span>
    </el-button>

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

const showCancel = computed(() => {
  if (props.tool === "DRAW" || props.tool === "DRAW_CIRCLE") {
    return props.hasDraft || props.hasScopeQuery;
  }
  return props.tool !== 'PAN' || props.hasDraft;
});

const showSave = computed(() => {
  return props.tool === "MODIFY" && props.canSaveModify;
});

const showCancelOrTarget = computed(() => {
  return showCancel.value;
});
</script>

<style scoped>
.toolbar {
  position: absolute;
  top: 20px;
  left: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--panel);
  padding: 10px 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  max-width: calc(100vw - 48px);
  z-index: 100;
}

.tool-group {
  display: flex;
  gap: 4px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  transition: all 0.2s ease;
  position: relative;
}

.tool-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tool-btn.active {
  box-shadow: 0 0 0 2px rgba(15, 118, 110, 0.3);
}

.tool-btn.delete-mode {
  animation: deleteWarning 1.5s ease-in-out infinite;
}

@keyframes deleteWarning {
  0%, 100% {
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
  }
  50% {
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.6);
  }
}

.tool-icon {
  font-size: 14px;
  line-height: 1;
}

.tool-label {
  font-size: 13px;
  font-weight: 500;
}

.divider {
  width: 1px;
  height: 24px;
  background: var(--border);
}

.cancel-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  animation: pulse 2s ease-in-out infinite;
  position: relative;
}

.tool-shortcut {
  font-size: 10px;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 2px;
  letter-spacing: 0.5px;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.85;
    transform: scale(0.98);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }

  .tool-label {
    display: none;
  }

  .tool-btn {
    padding: 8px;
  }

  .cancel-btn .tool-label {
    display: inline;
  }
  
  .tool-shortcut {
    display: none;
  }
}
</style>
