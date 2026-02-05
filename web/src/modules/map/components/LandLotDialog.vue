<template>
  <el-dialog
    :model-value="modelValue"
    title="Create Test Layer"
    width="420px"
    @close="handleCancel"
  >
    <el-form :model="formProxy" label-width="120px">
      <el-form-item label="Lot Number">
        <el-input v-model="lotNumberProxy" placeholder="D.D. 99 Lot 123 RP" />
      </el-form-item>
      <el-form-item label="Status">
        <el-select v-model="statusProxy">
          <el-option label="Active" value="Active" />
          <el-option label="Inactive" value="Inactive" />
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
  lotNumber: { type: String, default: "" },
  status: { type: String, default: "Active" },
});

const emit = defineEmits([
  "update:modelValue",
  "update:lotNumber",
  "update:status",
  "confirm",
  "cancel",
]);

const lotNumberProxy = computed({
  get: () => props.lotNumber,
  set: (value) => emit("update:lotNumber", value),
});

const statusProxy = computed({
  get: () => props.status,
  set: (value) => emit("update:status", value),
});

const formProxy = computed(() => ({
  lotNumber: lotNumberProxy.value,
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
