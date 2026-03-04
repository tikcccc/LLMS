<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="520px"
    destroy-on-close
    @close="handleCancel"
  >
    <el-form :model="formProxy" label-position="top">
      <el-form-item label="System ID">
        <el-input :model-value="systemId" disabled />
      </el-form-item>

      <el-form-item label="Section ID">
        <el-input :model-value="sectionId" disabled />
      </el-form-item>

      <el-form-item label="Completion Date">
        <el-date-picker
          v-model="completionDateProxy"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Area (m²)">
        <el-input-number
          v-model="areaProxy"
          :min="0"
          :step="1"
          :precision="2"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">Cancel</el-button>
      <el-button type="primary" @click="handleConfirm">{{ confirmText }}</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: "Edit Section" },
  confirmText: { type: String, default: "Save" },
  systemId: { type: String, default: "" },
  sectionId: { type: String, default: "" },
  completionDate: { type: String, default: "" },
  area: { type: Number, default: null },
});

const emit = defineEmits([
  "update:modelValue",
  "update:completionDate",
  "update:area",
  "confirm",
  "cancel",
]);

const completionDateProxy = computed({
  get: () => props.completionDate,
  set: (value) => emit("update:completionDate", value),
});

const areaProxy = computed({
  get: () => props.area,
  set: (value) => emit("update:area", value),
});

const formProxy = computed(() => ({
  systemId: props.systemId,
  sectionId: props.sectionId,
  completionDate: completionDateProxy.value,
  area: areaProxy.value,
}));

const handleCancel = () => {
  emit("update:modelValue", false);
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm");
};
</script>
