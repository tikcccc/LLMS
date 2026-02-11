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
        <el-input :model-value="boundaryId" disabled />
      </el-form-item>

      <el-form-item label="Name">
        <el-input v-model="nameProxy" placeholder="e.g. HKSTP No.1" />
      </el-form-item>

      <el-form-item label="Contract No.">
        <el-input v-model="contractNoProxy" placeholder="Contract No." />
      </el-form-item>

      <el-form-item label="Future Use">
        <el-input v-model="futureUseProxy" placeholder="Future use" />
      </el-form-item>

      <el-form-item label="Handover Date">
        <el-date-picker
          v-model="plannedHandoverDateProxy"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Completion Date">
        <el-date-picker
          v-model="completionDateProxy"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Remarks">
        <el-input
          v-model="othersProxy"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 4 }"
          placeholder="Additional notes"
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
  title: { type: String, default: "Edit Site Boundary" },
  confirmText: { type: String, default: "Save" },
  boundaryId: { type: String, default: "" },
  name: { type: String, default: "" },
  contractNo: { type: String, default: "" },
  futureUse: { type: String, default: "" },
  plannedHandoverDate: { type: String, default: "" },
  completionDate: { type: String, default: "" },
  others: { type: String, default: "" },
});

const emit = defineEmits([
  "update:modelValue",
  "update:name",
  "update:contractNo",
  "update:futureUse",
  "update:plannedHandoverDate",
  "update:completionDate",
  "update:others",
  "confirm",
  "cancel",
]);

const nameProxy = computed({
  get: () => props.name,
  set: (value) => emit("update:name", value),
});

const contractNoProxy = computed({
  get: () => props.contractNo,
  set: (value) => emit("update:contractNo", value),
});

const futureUseProxy = computed({
  get: () => props.futureUse,
  set: (value) => emit("update:futureUse", value),
});

const plannedHandoverDateProxy = computed({
  get: () => props.plannedHandoverDate,
  set: (value) => emit("update:plannedHandoverDate", value),
});

const completionDateProxy = computed({
  get: () => props.completionDate,
  set: (value) => emit("update:completionDate", value),
});

const othersProxy = computed({
  get: () => props.others,
  set: (value) => emit("update:others", value),
});

const formProxy = computed(() => ({
  boundaryId: props.boundaryId,
  name: nameProxy.value,
  contractNo: contractNoProxy.value,
  futureUse: futureUseProxy.value,
  plannedHandoverDate: plannedHandoverDateProxy.value,
  completionDate: completionDateProxy.value,
  others: othersProxy.value,
}));

const handleCancel = () => {
  emit("update:modelValue", false);
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm");
};
</script>
