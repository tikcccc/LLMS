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
      
      <el-tooltip content="Draw Polygon (D)" placement="bottom" :show-after="500">
        <el-button
          size="small"
          :type="tool === 'DRAW' ? 'primary' : 'default'"
          :disabled="!canEditLayer"
          @click="emit('set-tool', 'DRAW')"
          class="tool-btn"
          :class="{ active: tool === 'DRAW' }"
        >
          <span class="tool-icon">✏️</span>
          <span class="tool-label">Draw</span>
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

    <div class="edit-target" v-if="showEditTarget && tool === 'PAN'">
      <div class="edit-target-status">
        <span class="edit-target-label">Edit:</span>
        <span class="edit-target-value">{{ editTargetLabel }}</span>
        <button class="edit-target-switch" type="button" @click="togglePicker">
          Switch
        </button>
      </div>
      <el-segmented
        v-if="showPicker"
        v-model="editTargetProxy"
        size="small"
        :options="editTargetOptions"
        @change="handleTargetChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  tool: { type: String, required: true },
  canEditLayer: { type: Boolean, required: true },
  hasDraft: { type: Boolean, required: true },
  canSaveModify: { type: Boolean, default: false },
  showEditTarget: { type: Boolean, default: true },
  editTarget: { type: String, required: true },
  editTargetOptions: { type: Array, required: true },
});

const emit = defineEmits([
  "set-tool",
  "cancel-tool",
  "save-modify",
  "update:editTarget",
  "edit-target-change",
]);

const editTargetProxy = computed({
  get: () => props.editTarget,
  set: (value) => emit("update:editTarget", value),
});

const showPicker = ref(false);

const editTargetLabel = computed(() => {
  const match = props.editTargetOptions.find(
    (option) => option.value === props.editTarget
  );
  return match?.label ?? props.editTarget;
});

const togglePicker = () => {
  showPicker.value = !showPicker.value;
};

const handleTargetChange = () => {
  emit("edit-target-change");
  showPicker.value = false;
};

watch(
  () => props.tool,
  (value) => {
    if (value !== "PAN") {
      showPicker.value = false;
    }
  }
);

const showCancel = computed(() => {
  return props.tool !== 'PAN' || props.hasDraft;
});

const showSave = computed(() => {
  return props.tool === "MODIFY" && props.canSaveModify;
});

const showCancelOrTarget = computed(() => {
  return showCancel.value || (props.showEditTarget && props.tool === 'PAN');
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

.edit-target {
  display: flex;
  align-items: center;
  gap: 8px;
}

.edit-target-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  color: #1f2937;
}

.edit-target-label {
  font-weight: 600;
  color: #475569;
}

.edit-target-value {
  font-weight: 600;
}

.edit-target-switch {
  border: none;
  background: transparent;
  color: #0f766e;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  padding: 2px 4px;
}

.edit-target-switch:hover {
  color: #115e59;
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

.edit-target {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-left: 4px;
}

.edit-target-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  white-space: nowrap;
}

.edit-target :deep(.el-segmented) {
  background: #f8fafc;
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
