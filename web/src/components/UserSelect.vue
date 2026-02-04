<template>
  <el-select
    v-model="modelProxy"
    filterable
    clearable
    :placeholder="placeholder"
    :size="size"
    style="width: 100%"
  >
    <el-option
      v-for="option in normalizedOptions"
      :key="option.value"
      :label="option.label"
      :value="option.value"
    />
  </el-select>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: "Select user" },
  size: { type: String, default: "default" },
});

const emit = defineEmits(["update:modelValue"]);

const modelProxy = computed({
  get: () => props.modelValue,
  set: (value) => emit("update:modelValue", value),
});

const normalizedOptions = computed(() =>
  props.options.map((option) => {
    if (typeof option === "string") {
      return { label: option, value: option };
    }
    return {
      label: option.label ?? option.value ?? "",
      value: option.value ?? option.label ?? "",
    };
  })
);
</script>
