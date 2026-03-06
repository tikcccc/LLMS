<template>
  <div class="panel-tab-pane">
    <div class="panel-section">
      <el-input
        :model-value="searchQuery"
        placeholder="Search site boundaries"
        clearable
        @update:model-value="emit('update:searchQuery', $event)"
      />
    </div>
    <div class="list-scroll">
      <button
        v-for="boundary in results"
        :key="boundary.id"
        class="list-item"
        type="button"
        @click="emit('focus-site-boundary', boundary.id)"
      >
        <div class="list-title-row">
          <span class="list-title">{{ boundary.name }}</span>
          <el-tag
            size="small"
            effect="plain"
            :style="siteBoundaryStatusStyle(boundary.boundaryStatusKey, boundary.overdue)"
          >
            {{ boundary.boundaryStatus || "Pending Clearance" }}
          </el-tag>
        </div>
        <div class="list-meta subtle">
          {{ siteBoundaryWorkLotCountText(boundary) }} · Handover {{ boundary.plannedHandoverDate || "—" }}
        </div>
      </button>
      <el-empty v-if="results.length === 0" description="No site boundaries" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: { type: String, default: "" },
  results: { type: Array, default: () => [] },
  siteBoundaryStatusStyle: { type: Function, required: true },
  siteBoundaryWorkLotCountText: { type: Function, required: true },
});

const emit = defineEmits(["update:searchQuery", "focus-site-boundary"]);
</script>

<style scoped src="./MapSidePanel.css"></style>
