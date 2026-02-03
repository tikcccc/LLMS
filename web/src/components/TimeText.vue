<template>
  <span :title="titleText">{{ displayText }}</span>
</template>

<script setup>
import { computed } from "vue";
import { formatHongKong } from "../shared/utils/time";

const props = defineProps({
  value: { type: [String, Number, Date], default: "" },
  mode: { type: String, default: "datetime" },
  withSeconds: { type: Boolean, default: false },
  empty: { type: String, default: "-" },
});

const displayText = computed(() => {
  const formatted = formatHongKong(props.value, { mode: props.mode, withSeconds: props.withSeconds });
  return formatted || props.empty;
});

const titleText = computed(() => (displayText.value === props.empty ? "" : displayText.value));
</script>
