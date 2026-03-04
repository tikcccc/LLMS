<template>
  <div>
    <div class="panel-section">
      <el-input
        :model-value="searchQuery"
        placeholder="Search part of sites"
        clearable
        @update:model-value="emit('update:searchQuery', $event)"
      />
    </div>
    <div class="list-scroll">
      <button
        v-for="part in results"
        :key="`part-tab-${part.id}`"
        class="list-item"
        type="button"
        @click="emit('focus-part-of-site', part.id)"
      >
        <div class="list-title-row">
          <span class="list-title">{{ part.title }}</span>
          <el-tag size="small" effect="plain">Part of Site</el-tag>
        </div>
        <div class="list-meta subtle">{{ part.group || "—" }} · {{ part.systemId || "—" }}</div>
      </button>
      <el-empty v-if="results.length === 0" description="No part of sites" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  searchQuery: { type: String, default: "" },
  results: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:searchQuery", "focus-part-of-site"]);
</script>

<style scoped src="./MapSidePanel.css"></style>
