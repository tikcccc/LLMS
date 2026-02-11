<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="480px"
    @close="handleCancel"
  >
    <el-form :model="formProxy" label-width="120px" label-position="top">
      <el-form-item v-if="workLotId" label="System ID">
        <el-input :model-value="workLotId" disabled />
      </el-form-item>

      <el-form-item label="Work Lot Name">
        <el-input v-model="operatorNameProxy" placeholder="Work Lot Name" />
      </el-form-item>

      <el-form-item label="Category">
        <el-select v-model="categoryProxy">
          <el-option
            v-for="option in WORK_LOT_CATEGORIES"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item v-if="workLotId" label="Related Lands (Auto)">
        <el-input
          :model-value="relatedLandText"
          disabled
          placeholder="Auto by geometry / scope relation"
        />
      </el-form-item>

      <el-form-item label="Responsible Person">
        <UserSelect
          v-model="responsiblePersonProxy"
          :options="responsiblePersonOptions"
          placeholder="Select responsible person"
        />
      </el-form-item>

      <el-form-item label="Assess Date">
        <el-date-picker
          v-model="assessDateProxy"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Due Date">
        <el-date-picker
          v-model="dueDateProxy"
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

      <el-form-item label="Operational Status">
        <el-select v-model="statusProxy">
          <el-option
            v-for="status in WORK_LOT_STATUSES"
            :key="status"
            :label="status"
            :value="status"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="Float (Months)">
        <el-input-number
          v-model="floatMonthsProxy"
          :min="-24"
          :max="60"
          :step="0.5"
          :precision="1"
          controls-position="right"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Need Force Eviction">
        <el-switch v-model="forceEvictionProxy" />
      </el-form-item>

      <el-form-item label="Description">
        <el-input
          v-model="descriptionProxy"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          placeholder="Main land acquisition description in this site boundary"
        />
      </el-form-item>

      <el-form-item label="Remark">
        <el-input
          v-model="remarkProxy"
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
import UserSelect from "../../../components/UserSelect.vue";
import { buildUserOptions } from "../../../shared/mock/users";
import {
  WORK_LOT_CATEGORIES,
  WORK_LOT_STATUSES,
} from "../../../shared/utils/worklot";

const responsiblePersonOptions = buildUserOptions();

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: "Create Work Lot" },
  confirmText: { type: String, default: "Save" },
  workLotId: { type: String, default: "" },
  operatorName: { type: String, default: "" },
  category: { type: String, required: true },
  relatedSiteBoundaryIds: { type: Array, default: () => [] },
  relatedSiteBoundaryNames: { type: Array, default: () => [] },
  responsiblePerson: { type: String, default: "" },
  assessDate: { type: String, default: "" },
  dueDate: { type: String, default: "" },
  completionDate: { type: String, default: "" },
  floatMonths: { type: Number, default: null },
  forceEviction: { type: Boolean, default: false },
  status: { type: String, required: true },
  description: { type: String, default: "" },
  remark: { type: String, default: "" },
});

const emit = defineEmits([
  "update:modelValue",
  "update:operatorName",
  "update:category",
  "update:responsiblePerson",
  "update:assessDate",
  "update:dueDate",
  "update:completionDate",
  "update:floatMonths",
  "update:forceEviction",
  "update:status",
  "update:description",
  "update:remark",
  "confirm",
  "cancel",
]);

const operatorNameProxy = computed({
  get: () => props.operatorName,
  set: (value) => emit("update:operatorName", value),
});

const categoryProxy = computed({
  get: () => props.category,
  set: (value) => emit("update:category", value),
});

const responsiblePersonProxy = computed({
  get: () => props.responsiblePerson,
  set: (value) => emit("update:responsiblePerson", value),
});

const assessDateProxy = computed({
  get: () => props.assessDate,
  set: (value) => emit("update:assessDate", value),
});

const dueDateProxy = computed({
  get: () => props.dueDate,
  set: (value) => emit("update:dueDate", value),
});

const completionDateProxy = computed({
  get: () => props.completionDate,
  set: (value) => emit("update:completionDate", value),
});

const floatMonthsProxy = computed({
  get: () => props.floatMonths,
  set: (value) => emit("update:floatMonths", value),
});

const forceEvictionProxy = computed({
  get: () => props.forceEviction,
  set: (value) => emit("update:forceEviction", value),
});

const statusProxy = computed({
  get: () => props.status,
  set: (value) => emit("update:status", value),
});

const descriptionProxy = computed({
  get: () => props.description,
  set: (value) => emit("update:description", value),
});

const remarkProxy = computed({
  get: () => props.remark,
  set: (value) => emit("update:remark", value),
});

const formProxy = computed(() => ({
  operatorName: operatorNameProxy.value,
  category: categoryProxy.value,
  relatedSiteBoundaryIds: props.relatedSiteBoundaryIds,
  responsiblePerson: responsiblePersonProxy.value,
  assessDate: assessDateProxy.value,
  dueDate: dueDateProxy.value,
  completionDate: completionDateProxy.value,
  floatMonths: floatMonthsProxy.value,
  forceEviction: forceEvictionProxy.value,
  status: statusProxy.value,
  description: descriptionProxy.value,
  remark: remarkProxy.value,
}));

const relatedLandText = computed(() =>
  (props.relatedSiteBoundaryNames?.length
    ? props.relatedSiteBoundaryNames
    : props.relatedSiteBoundaryIds
  )
    .map((item) => String(item))
    .join(", ")
);

const handleCancel = () => {
  emit("update:modelValue", false);
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm");
};
</script>
