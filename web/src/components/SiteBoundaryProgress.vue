<template>
  <div class="site-boundary-progress">
    <el-progress
      :percentage="normalizedPercentage"
      :status="progressStatus"
      :stroke-width="strokeWidth"
    />
    <div v-if="showMeta" class="site-boundary-progress-meta">
      {{ normalizedCompleted }}/{{ normalizedTotal }} operators completed
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  percentage: { type: Number, default: 0 },
  completed: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  statusKey: { type: String, default: "" },
  overdue: { type: Boolean, default: false },
  strokeWidth: { type: Number, default: 10 },
  showMeta: { type: Boolean, default: true },
});

const normalizedPercentage = computed(() => {
  const value = Number(props.percentage);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
});

const normalizedCompleted = computed(() => {
  const value = Number(props.completed);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
});

const normalizedTotal = computed(() => {
  const value = Number(props.total);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value);
});

const progressStatus = computed(() => {
  if (props.overdue && props.statusKey !== "HANDED_OVER") {
    return "exception";
  }
  if (props.statusKey === "CRITICAL_RISK") {
    return "exception";
  }
  if (props.statusKey === "HANDED_OVER") {
    return "success";
  }
  return undefined;
});
</script>

<style scoped>
.site-boundary-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.site-boundary-progress-meta {
  font-size: 11px;
  color: var(--muted);
}
</style>
