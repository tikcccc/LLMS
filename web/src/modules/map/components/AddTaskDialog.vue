<template>
  <el-dialog
    :model-value="modelValue"
    title="Add Task"
    width="420px"
    @close="handleCancel"
  >
    <el-form label-position="top" class="task-form">
      <el-form-item label="Title">
        <el-input v-model="titleProxy" placeholder="Task title" />
      </el-form-item>
      <el-form-item label="Assignee">
        <UserSelect v-model="assigneeProxy" :options="assigneeOptions" />
      </el-form-item>
      <el-form-item label="Due Date">
        <el-date-picker
          v-model="dueDateProxy"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
          placeholder="Select date"
        />
      </el-form-item>
      <el-form-item label="Description">
        <el-input
          v-model="descriptionProxy"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="Optional details"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">Cancel</el-button>
        <el-button type="primary" :disabled="!titleProxy.trim()" @click="handleConfirm">
          Add Task
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from "vue";
import UserSelect from "../../../components/UserSelect.vue";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: "" },
  assignee: { type: String, default: "" },
  dueDate: { type: String, default: "" },
  description: { type: String, default: "" },
  assigneeOptions: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "update:modelValue",
  "update:title",
  "update:assignee",
  "update:dueDate",
  "update:description",
  "confirm",
  "cancel",
]);

const titleProxy = computed({
  get: () => props.title,
  set: (value) => emit("update:title", value),
});

const assigneeProxy = computed({
  get: () => props.assignee,
  set: (value) => emit("update:assignee", value),
});

const dueDateProxy = computed({
  get: () => props.dueDate,
  set: (value) => emit("update:dueDate", value),
});

const descriptionProxy = computed({
  get: () => props.description,
  set: (value) => emit("update:description", value),
});

const handleCancel = () => {
  emit("update:modelValue", false);
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm");
};
</script>

<style scoped>
.task-form {
  padding-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
