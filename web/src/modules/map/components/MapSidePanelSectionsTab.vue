<template>
  <div class="panel-tab-pane">
    <div class="panel-section">
      <el-input
        :model-value="searchQuery"
        placeholder="Search sections"
        clearable
        @update:model-value="emit('update:searchQuery', $event)"
      />
    </div>
    <div class="list-scroll">
      <button
        v-for="section in results"
        :key="`section-tab-${section.id}`"
        class="list-item"
        type="button"
        @click="emit('focus-section', section.id)"
      >
        <div class="list-title-row">
          <span class="list-title">{{ section.title }}</span>
          <el-tag size="small" effect="plain">Section</el-tag>
        </div>
        <div class="list-meta subtle">{{ section.group || "—" }} · {{ section.systemId || "—" }}</div>
      </button>
      <el-empty v-if="results.length === 0" description="No sections" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: { type: String, default: "" },
  results: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:searchQuery", "focus-section"]);
</script>

<style scoped src="./MapSidePanel.css"></style>
