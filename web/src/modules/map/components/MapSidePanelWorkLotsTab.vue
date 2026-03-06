<template>
  <div class="panel-tab-pane">
    <div class="panel-section">
      <el-input
        :model-value="searchQuery"
        placeholder="Search work lots"
        clearable
        @update:model-value="emit('update:searchQuery', $event)"
      />
    </div>
    <div class="list-scroll">
      <button
        v-for="lot in results"
        :key="lot.id"
        class="list-item"
        type="button"
        @click="emit('focus-work', lot.id)"
      >
        <div class="list-title-row">
          <span class="list-title">{{ lot.operatorName }}</span>
          <el-tag size="small" effect="plain" :style="workStatusStyle(lot.status, lot.dueDate)">
            {{ lot.status }}
          </el-tag>
        </div>
        <div class="list-meta subtle">
          {{
            Array.isArray(lot.relatedSiteBoundaryIds) && lot.relatedSiteBoundaryIds.length
              ? `${lot.relatedSiteBoundaryIds.length} related lands`
              : "No related land"
          }}
          · {{ lot.responsiblePerson || "Unassigned" }} · Due {{ lot.dueDate || "—" }}
        </div>
      </button>
      <el-empty v-if="results.length === 0" description="No work lots" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: { type: String, default: "" },
  results: { type: Array, default: () => [] },
  workStatusStyle: { type: Function, required: true },
});

const emit = defineEmits(["update:searchQuery", "focus-work"]);
</script>

<style scoped src="./MapSidePanel.css"></style>
