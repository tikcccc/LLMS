<template>
  <aside class="map-legend" :class="{ 'is-collapsed': collapsed }" role="note" aria-label="Map legend">
    <div class="legend-header">
      <div class="legend-title">Map Legend</div>
      <button
        type="button"
        class="legend-toggle"
        aria-label="Toggle map legend"
        :aria-expanded="String(!collapsed)"
        @click="toggleCollapsed"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path
            d="M6 9l6 6 6-6"
            :class="{ 'legend-toggle-path-collapsed': collapsed }"
          />
        </svg>
      </button>
    </div>

    <section v-if="!collapsed" class="legend-group">
      <div class="legend-group-title">Site Boundaries (Aggregated)</div>
      <div class="legend-item">
        <span class="legend-swatch state-gray"></span>
        <span>Pending Clearance</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch state-yellow"></span>
        <span>In Progress</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch state-green"></span>
        <span>Handover Ready / Handed Over</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch state-red"></span>
        <span>Critical / Risk or Overdue</span>
      </div>
    </section>

    <section v-if="!collapsed" class="legend-group">
      <div class="legend-group-title">Work Lots (Operators)</div>
      <div class="legend-item">
        <span class="legend-swatch state-gray"></span>
        <span>Waiting for Assessment</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch state-yellow"></span>
        <span>EGA Approved / Waiting for Clearance</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch state-green"></span>
        <span>Completed</span>
      </div>
      <div class="legend-item">
        <span class="legend-swatch state-red"></span>
        <span>Overdue (Due Date passed)</span>
      </div>
    </section>

    <section v-if="!collapsed" class="legend-group">
      <div class="legend-group-title">Work Lot Category (Line Type)</div>
      <div class="legend-item">
        <span class="legend-line line-bu"></span>
        <span>Business Undertaking (BU)</span>
      </div>
      <div class="legend-item">
        <span class="legend-line line-hh"></span>
        <span>Household (HH)</span>
      </div>
      <div class="legend-item">
        <span class="legend-line line-gl"></span>
        <span>Government Land (GL)</span>
      </div>
    </section>
  </aside>
</template>

<script setup>
import { onMounted, ref } from "vue";

const LEGEND_COLLAPSE_STORAGE_KEY = "ND_LLM_V1_map_legend_collapsed";
const collapsed = ref(false);

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LEGEND_COLLAPSE_STORAGE_KEY, collapsed.value ? "1" : "0");
};

onMounted(() => {
  if (typeof window === "undefined") return;
  const stored = window.localStorage.getItem(LEGEND_COLLAPSE_STORAGE_KEY);
  collapsed.value = stored === "1";
});
</script>

<style scoped>
.map-legend {
  position: absolute;
  right: 24px;
  bottom: 44px;
  z-index: 68;
  width: 286px;
  max-height: calc(100% - 120px);
  overflow-y: auto;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(6px);
  padding: 10px 12px;
}

.map-legend.is-collapsed {
  width: auto;
  min-width: 140px;
  max-height: none;
  overflow: hidden;
  padding: 8px 10px;
}

.legend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 8px;
}

.map-legend.is-collapsed .legend-header {
  margin-bottom: 0;
}

.legend-title {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.legend-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 7px;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: #fff;
  color: #334155;
  cursor: pointer;
}

.legend-toggle svg {
  width: 14px;
  height: 14px;
}

.legend-toggle-path-collapsed {
  transform-origin: 50% 50%;
  transform: rotate(180deg);
}

.legend-group + .legend-group {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
}

.legend-group-title {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #334155;
  line-height: 1.3;
}

.legend-item + .legend-item {
  margin-top: 4px;
}

.legend-swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 2px solid transparent;
  flex: 0 0 auto;
}

.state-gray {
  background: rgba(148, 163, 184, 0.2);
  border-color: rgba(100, 116, 139, 0.95);
}

.state-yellow {
  background: rgba(245, 158, 11, 0.2);
  border-color: rgba(180, 83, 9, 0.95);
}

.state-green {
  background: rgba(34, 197, 94, 0.2);
  border-color: rgba(22, 163, 74, 0.95);
}

.state-red {
  background: rgba(248, 113, 113, 0.2);
  border-color: rgba(220, 38, 38, 0.95);
}

.legend-line {
  width: 18px;
  border-top: 3px solid #475569;
  flex: 0 0 auto;
}

.line-bu {
  border-top-style: solid;
}

.line-hh {
  border-top-style: dashed;
}

.line-gl {
  border-top-style: dotted;
}

@media (max-width: 900px) {
  .map-legend {
    right: 10px;
    top: 72px;
    bottom: auto;
    width: min(300px, calc(100% - 20px));
    max-height: 44vh;
  }
}
</style>
