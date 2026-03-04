<template>
  <div class="drawer-body">
    <el-collapse
      :model-value="activeCollapse"
      class="info-collapse"
      @update:model-value="emit('update:activeCollapse', $event)"
    >
      <el-collapse-item name="basic" title="Basic Information">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">System ID</span>
            <span class="info-value">{{ selectedPartOfSite.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Access Date</span>
            <span class="info-value">
              <TimeText :value="selectedPartOfSite.accessDate" mode="date" empty="—" />
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Area</span>
            <span class="info-value">{{ partOfSiteAreaText }}</span>
          </div>
          <div v-if="partOfSiteHasAdjustedArea" class="info-item">
            <span class="info-label">Raw Area</span>
            <span class="info-value">{{ partOfSiteRawAreaText }}</span>
          </div>
          <div v-if="partOfSiteHasAdjustedArea" class="info-item info-item-wide">
            <span class="info-label">Excluded Overlap</span>
            <span class="info-value">{{ partOfSiteOverlapAreaText }}</span>
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item name="relatedSections" title="Related Sections">
        <div v-if="relatedSections.length > 0" class="related-list">
          <button
            v-for="section in relatedSections"
            :key="section.id"
            class="related-item"
            type="button"
            @click="emit('focus-section', section.id)"
          >
            <div class="related-item-head">
              <span class="related-item-title" :title="section.title || section.id">
                {{ section.title || section.id }}
              </span>
              <el-tag size="small" effect="plain">Section</el-tag>
            </div>
            <div class="related-item-meta">
              {{ section.group || "—" }} · {{ section.systemId || "—" }}
            </div>
          </button>
        </div>
        <el-empty v-else :image-size="60" description="No related sections" />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import TimeText from "../../../components/TimeText.vue";

defineProps({
  selectedPartOfSite: { type: Object, required: true },
  relatedSections: { type: Array, default: () => [] },
  activeCollapse: { type: Array, default: () => [] },
  partOfSiteAreaText: { type: String, default: "—" },
  partOfSiteRawAreaText: { type: String, default: "—" },
  partOfSiteOverlapAreaText: { type: String, default: "—" },
  partOfSiteHasAdjustedArea: { type: Boolean, default: false },
});

const emit = defineEmits(["update:activeCollapse", "focus-section"]);
</script>
