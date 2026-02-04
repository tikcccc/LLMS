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
    >
      <div class="user-option">
        <div class="user-name">{{ option.name || option.label }}</div>
        <div v-if="option.email" class="user-email">{{ option.email }}</div>
      </div>
    </el-option>
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
      return { label: option, value: option, name: option, email: "" };
    }
    const name = option.name ?? option.label ?? option.value ?? "";
    const email = option.email ?? "";
    const label = option.label ?? (email ? `${name} · ${email}` : name);
    const value = option.value ?? name;
    return {
      label,
      value,
      name,
      email,
    };
  })
);
</script>

<style scoped>
.user-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.2;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.user-email {
  font-size: 12px;
  color: var(--muted);
}
</style>
