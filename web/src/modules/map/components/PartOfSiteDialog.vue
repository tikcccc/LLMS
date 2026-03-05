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

      <el-form-item label="Part ID">
        <el-input :model-value="partId" disabled />
      </el-form-item>

      <el-form-item label="Contract Package">
        <el-select v-model="contractPackageProxy">
          <el-option
            v-for="item in CONTRACT_PACKAGE_VALUES"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Access Date">
        <el-date-picker
          v-model="accessDateProxy"
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
import { CONTRACT_PACKAGE_VALUES } from "../../../shared/utils/contractPackage";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: "Edit Part of Site" },
  confirmText: { type: String, default: "Save" },
  systemId: { type: String, default: "" },
  partId: { type: String, default: "" },
  contractPackage: { type: String, default: "C2" },
  accessDate: { type: String, default: "" },
  area: { type: Number, default: null },
});

const emit = defineEmits([
  "update:modelValue",
  "update:contractPackage",
  "update:accessDate",
  "update:area",
  "confirm",
  "cancel",
]);

const contractPackageProxy = computed({
  get: () => props.contractPackage,
  set: (value) => emit("update:contractPackage", value),
});

const accessDateProxy = computed({
  get: () => props.accessDate,
  set: (value) => emit("update:accessDate", value),
});

const areaProxy = computed({
  get: () => props.area,
  set: (value) => emit("update:area", value),
});

const formProxy = computed(() => ({
  systemId: props.systemId,
  partId: props.partId,
  contractPackage: contractPackageProxy.value,
  accessDate: accessDateProxy.value,
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
