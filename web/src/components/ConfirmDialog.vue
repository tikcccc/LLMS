<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    :modal="true"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    :modal-class="modalClass || 'confirm-dialog-mask'"
    @close="handleCancel"
  >
    <div class="confirm-body">
      <div class="confirm-message">{{ message }}</div>
      <div v-if="description" class="confirm-description">{{ description }}</div>
    </div>
    <template #footer>
      <div class="confirm-footer">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button :type="confirmType" @click="handleConfirm">{{ confirmText }}</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: "Confirm" },
  message: { type: String, default: "" },
  description: { type: String, default: "" },
  confirmText: { type: String, default: "Confirm" },
  cancelText: { type: String, default: "Cancel" },
  confirmType: { type: String, default: "primary" },
  width: { type: String, default: "420px" },
  modalClass: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "confirm", "cancel"]);

const handleCancel = () => {
  emit("update:modelValue", false);
  emit("cancel");
};

const handleConfirm = () => {
  emit("update:modelValue", false);
  emit("confirm");
};
</script>

<style scoped>
.confirm-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 2px;
}

.confirm-message {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
}

.confirm-description {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.4;
}

.confirm-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>

<style>
.confirm-dialog-mask {
  background-color: rgba(15, 23, 42, 0.4);
}
</style>
