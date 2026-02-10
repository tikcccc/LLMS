<template>
  <el-dialog
    :model-value="modelValue"
    title="Create Work Lot"
    width="480px"
    @close="handleCancel"
  >
    <el-form :model="formProxy" label-width="120px" label-position="top">
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

      <el-form-item label="Responsible Person">
        <el-input v-model="responsiblePersonProxy" placeholder="Responsible person" />
      </el-form-item>

      <el-form-item label="Due Date">
        <el-date-picker
          v-model="dueDateProxy"
          type="date"
          value-format="YYYY-MM-DD"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="Status">
        <el-select v-model="statusProxy">
          <el-option
            v-for="status in WORK_LOT_STATUSES"
            :key="status"
            :label="status"
            :value="status"
          />
        </el-select>
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
      <el-button type="primary" @click="handleConfirm">Save</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from "vue";
import {
  WORK_LOT_CATEGORIES,
  WORK_LOT_STATUSES,
} from "../../../shared/utils/worklot";

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  operatorName: { type: String, default: "" },
  category: { type: String, required: true },
  responsiblePerson: { type: String, default: "" },
  dueDate: { type: String, default: "" },
  status: { type: String, required: true },
  description: { type: String, default: "" },
  remark: { type: String, default: "" },
});

const emit = defineEmits([
  "update:modelValue",
  "update:operatorName",
  "update:category",
  "update:responsiblePerson",
  "update:dueDate",
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

const dueDateProxy = computed({
  get: () => props.dueDate,
  set: (value) => emit("update:dueDate", value),
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
  responsiblePerson: responsiblePersonProxy.value,
  dueDate: dueDateProxy.value,
  status: statusProxy.value,
  description: descriptionProxy.value,
  remark: remarkProxy.value,
}));

const handleCancel = () => {
  emit("update:modelValue", false);
  emit("cancel");
};

const handleConfirm = () => {
  emit("confirm");
};
</script>
