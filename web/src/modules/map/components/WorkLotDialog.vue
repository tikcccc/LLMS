<template>
  <el-dialog
    :model-value="modelValue"
    title="Create Work Lot"
    width="420px"
    @close="handleCancel"
  >
    <el-form :model="formProxy" label-width="120px">
      <el-form-item label="Operator">
        <el-input v-model="operatorNameProxy" placeholder="Operator Name" />
      </el-form-item>
      <el-form-item label="Type">
        <el-select v-model="typeProxy">
          <el-option label="Business" value="Business" />
          <el-option label="Household" value="Household" />
        </el-select>
      </el-form-item>
      <el-form-item label="Status">
        <el-select v-model="statusProxy">
          <el-option label="Pending" value="Pending" />
          <el-option label="In-Progress" value="In-Progress" />
          <el-option label="Handover" value="Handover" />
          <el-option label="Difficult" value="Difficult" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="handleCancel">Cancel</el-button>
      <el-button type="primary" @click="handleConfirm">Save</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  operatorName: { type: String, default: "" },
  type: { type: String, default: "Business" },
  status: { type: String, default: "Pending" },
});

const emit = defineEmits([
  "update:modelValue",
  "update:operatorName",
  "update:type",
  "update:status",
  "confirm",
  "cancel",
]);

const operatorNameProxy = computed({
  get: () => props.operatorName,
  set: (value) => emit("update:operatorName", value),
});

const typeProxy = computed({
  get: () => props.type,
  set: (value) => emit("update:type", value),
});

const statusProxy = computed({
  get: () => props.status,
  set: (value) => emit("update:status", value),
});

const formProxy = computed(() => ({
  operatorName: operatorNameProxy.value,
  type: typeProxy.value,
  status: statusProxy.value,
}));

const handleCancel = () => {
  emit("update:modelValue", false);
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm");
};
</script>
