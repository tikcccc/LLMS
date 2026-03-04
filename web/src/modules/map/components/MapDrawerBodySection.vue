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
            <span class="info-value">{{ selectedSection.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Completion Date</span>
            <span class="info-value">
              <TimeText :value="selectedSection.completionDate" mode="date" empty="—" />
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Related Parts</span>
            <span class="info-value">{{ selectedSection.partCount || 0 }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Area</span>
            <span class="info-value">{{ sectionAreaText }}</span>
          </div>
          <div v-if="sectionHasAdjustedArea" class="info-item">
            <span class="info-label">Raw Area</span>
            <span class="info-value">{{ sectionRawAreaText }}</span>
          </div>
          <div v-if="sectionHasAdjustedArea" class="info-item info-item-wide">
            <span class="info-label">Excluded Overlap</span>
            <span class="info-value">{{ sectionOverlapAreaText }}</span>
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item name="relatedParts" title="Related Part of Sites">
        <div v-if="relatedPartOfSites.length > 0" class="related-list">
          <button
            v-for="part in relatedPartOfSites"
            :key="part.id"
            class="related-item"
            type="button"
            @click="emit('focus-part-of-site', part.id)"
          >
            <div class="related-item-head">
              <span class="related-item-title" :title="part.title || part.id">
                {{ part.title || part.id }}
              </span>
              <el-tag size="small" effect="plain">Part of Site</el-tag>
            </div>
            <div class="related-item-meta">
              {{ part.group || "—" }} · {{ part.systemId || "—" }}
            </div>
          </button>
        </div>
        <el-empty v-else :image-size="60" description="No related part of sites" />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import TimeText from "../../../components/TimeText.vue";

defineProps({
  selectedSection: { type: Object, required: true },
  relatedPartOfSites: { type: Array, default: () => [] },
  activeCollapse: { type: Array, default: () => [] },
  sectionAreaText: { type: String, default: "—" },
  sectionRawAreaText: { type: String, default: "—" },
  sectionOverlapAreaText: { type: String, default: "—" },
  sectionHasAdjustedArea: { type: Boolean, default: false },
});

const emit = defineEmits(["update:activeCollapse", "focus-part-of-site"]);
</script>
