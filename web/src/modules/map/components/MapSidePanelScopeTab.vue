<template>
  <div class="scope-pane">
    <div class="scope-summary">
      <div class="scope-summary-top">
        <div class="scope-title">{{ scopeModeName }}</div>
        <el-tag size="small" effect="plain" type="info">{{ totalResults }} results</el-tag>
      </div>
      <div class="scope-metrics">
        <span class="scope-pill">{{ scopePartOfSitesResults.length }} part of sites</span>
        <span class="scope-pill">{{ scopeSectionResults.length }} sections</span>
        <span class="scope-pill">{{ scopeSiteBoundaryResults.length }} site boundaries</span>
        <span class="scope-pill">{{ scopeWorkLotResults.length }} work lots</span>
      </div>
    </div>

    <template v-if="totalResults > 0">
      <section v-if="scopeSectionResults.length > 0" class="scope-block">
        <div class="list-subtitle">
          Sections
          <span class="subtitle-count">{{ scopeSectionResults.length }}</span>
        </div>
        <div class="scope-list">
          <button
            v-for="section in scopeSectionResults"
            :key="`scope-section-${section.id}`"
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
        </div>
      </section>

      <section v-if="scopePartOfSitesResults.length > 0" class="scope-block">
        <div class="list-subtitle">
          Part of Sites
          <span class="subtitle-count">{{ scopePartOfSitesResults.length }}</span>
        </div>
        <div class="scope-list">
          <button
            v-for="part in scopePartOfSitesResults"
            :key="`scope-part-${part.id}`"
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
        </div>
      </section>

      <section v-if="scopeSiteBoundaryResults.length > 0" class="scope-block">
        <div class="list-subtitle">
          Site Boundaries
          <span class="subtitle-count">{{ scopeSiteBoundaryResults.length }}</span>
        </div>
        <div class="scope-list">
          <button
            v-for="boundary in scopeSiteBoundaryResults"
            :key="`scope-${boundary.id}`"
            class="list-item"
            type="button"
            @click="emit('focus-site-boundary', boundary.id)"
          >
            <div class="list-title-row">
              <span class="list-title">{{ boundary.name }}</span>
              <el-tag size="small" effect="plain">Site Boundary</el-tag>
            </div>
          </button>
        </div>
      </section>

      <section v-if="scopeWorkLotResults.length > 0" class="scope-block">
        <div class="list-subtitle">
          Work Lots
          <span class="subtitle-count">{{ scopeWorkLotResults.length }}</span>
        </div>
        <div class="scope-list">
          <button
            v-for="lot in scopeWorkLotResults"
            :key="`scope-work-${lot.id}`"
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
          </button>
        </div>
      </section>
    </template>

    <el-empty v-else class="scope-empty" description="Use Scope/Circle tool to draw a range" />
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  scopeModeName: { type: String, required: true },
  scopePartOfSitesResults: { type: Array, default: () => [] },
  scopeSectionResults: { type: Array, default: () => [] },
  scopeWorkLotResults: { type: Array, default: () => [] },
  scopeSiteBoundaryResults: { type: Array, default: () => [] },
  workStatusStyle: { type: Function, required: true },
});

const emit = defineEmits(["focus-work", "focus-site-boundary", "focus-part-of-site", "focus-section"]);
const totalResults = computed(
  () =>
    props.scopeSectionResults.length +
    props.scopeSiteBoundaryResults.length +
    props.scopeWorkLotResults.length +
    props.scopePartOfSitesResults.length
);
</script>

<style scoped src="./MapSidePanel.css"></style>
