<template>
  <div class="drawer-header" v-if="selectedWorkLot">
    <div class="header-text">
      <div class="drawer-title" :title="workLotHeaderTitle">{{ workLotHeaderTitle }}</div>
      <div class="header-status-row">
        <el-tag effect="plain" :style="workStatusStyle(selectedWorkLot.status, selectedWorkLot.dueDate)">
          {{ selectedWorkLot.status }}
        </el-tag>
      </div>
    </div>
    <div class="header-controls">
      <div class="header-tags">
        <el-button
          class="focus-action-btn"
          :class="{ active: isWorkLotFocusActive }"
          type="primary"
          text
          size="small"
          @click="emit('focus-map-work-lot', selectedWorkLot.id)"
        >
          {{ isWorkLotFocusActive ? "Cancel Focus" : "Focus" }}
        </el-button>
        <el-button
          v-if="canEditWork"
          class="edit-icon-btn"
          type="primary"
          text
          size="small"
          @click="emit('edit-work-lot')"
        >
          Edit
        </el-button>
        <el-button
          v-if="canDeleteWork"
          class="delete-icon-btn"
          type="danger"
          text
          size="small"
          @click="emit('request-delete-work-lot')"
        >
          Delete
        </el-button>
      </div>
      <button
        type="button"
        class="header-close-btn"
        aria-label="Close details panel"
        @click="emit('close')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </div>

  <div class="drawer-header" v-else-if="selectedSiteBoundary">
    <div class="header-text">
      <div class="drawer-title" :title="siteBoundaryHeaderTitle">
        {{ siteBoundaryHeaderTitle }}
      </div>
    </div>
    <div class="header-controls">
      <div class="header-tags">
        <el-tag effect="plain">Site Boundary</el-tag>
        <el-button
          class="focus-action-btn"
          :class="{ active: isSiteBoundaryFocusActive }"
          type="primary"
          text
          size="small"
          @click="emit('focus-map-site-boundary', selectedSiteBoundary.id)"
        >
          {{ isSiteBoundaryFocusActive ? "Cancel Focus" : "Focus" }}
        </el-button>
        <el-button
          v-if="canEditSiteBoundary"
          class="edit-icon-btn"
          type="primary"
          text
          size="small"
          @click="emit('edit-site-boundary')"
        >
          Edit
        </el-button>
      </div>
      <button
        type="button"
        class="header-close-btn"
        aria-label="Close details panel"
        @click="emit('close')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </div>

  <div class="drawer-header" v-else-if="selectedPartOfSite">
    <div class="header-text">
      <div class="drawer-title" :title="partOfSiteHeaderTitle">
        {{ partOfSiteHeaderTitle }}
      </div>
    </div>
    <div class="header-controls">
      <div class="header-tags">
        <el-tag effect="plain">Part of Site</el-tag>
        <el-button
          class="focus-action-btn"
          :class="{ active: isPartOfSiteFocusActive }"
          type="primary"
          text
          size="small"
          @click="emit('focus-map-part-of-site', selectedPartOfSite.partId)"
        >
          {{ isPartOfSiteFocusActive ? "Cancel Focus" : "Focus" }}
        </el-button>
        <el-button
          v-if="canEditPartOfSite"
          class="edit-icon-btn"
          type="primary"
          text
          size="small"
          @click="emit('edit-part-of-site')"
        >
          Edit
        </el-button>
      </div>
      <button
        type="button"
        class="header-close-btn"
        aria-label="Close details panel"
        @click="emit('close')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </div>

  <div class="drawer-header" v-else-if="selectedSection">
    <div class="header-text">
      <div class="drawer-title" :title="sectionHeaderTitle">
        {{ sectionHeaderTitle }}
      </div>
    </div>
    <div class="header-controls">
      <div class="header-tags">
        <el-tag effect="plain">Section</el-tag>
        <el-button
          class="focus-action-btn"
          :class="{ active: isSectionFocusActive }"
          type="primary"
          text
          size="small"
          @click="emit('focus-map-section', selectedSection.sectionId)"
        >
          {{ isSectionFocusActive ? "Cancel Focus" : "Focus" }}
        </el-button>
        <el-button
          v-if="canEditSection"
          class="edit-icon-btn"
          type="primary"
          text
          size="small"
          @click="emit('edit-section')"
        >
          Edit
        </el-button>
      </div>
      <button
        type="button"
        class="header-close-btn"
        aria-label="Close details panel"
        @click="emit('close')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </div>

  <div class="drawer-header" v-else-if="selectedIntLand">
    <div class="header-text">
      <div class="drawer-title">Drawing Layer</div>
      <div class="drawer-subtitle">{{ selectedIntLand.id }}</div>
    </div>
    <div class="header-controls">
      <button
        type="button"
        class="header-close-btn"
        aria-label="Close details panel"
        @click="emit('close')"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  selectedWorkLot: { type: Object, default: null },
  selectedSiteBoundary: { type: Object, default: null },
  selectedPartOfSite: { type: Object, default: null },
  selectedSection: { type: Object, default: null },
  selectedIntLand: { type: Object, default: null },
  workLotHeaderTitle: { type: String, required: true },
  siteBoundaryHeaderTitle: { type: String, required: true },
  partOfSiteHeaderTitle: { type: String, required: true },
  sectionHeaderTitle: { type: String, required: true },
  workStatusStyle: { type: Function, required: true },
  isWorkLotFocusActive: { type: Boolean, default: false },
  isSiteBoundaryFocusActive: { type: Boolean, default: false },
  isPartOfSiteFocusActive: { type: Boolean, default: false },
  isSectionFocusActive: { type: Boolean, default: false },
  canEditWork: { type: Boolean, default: true },
  canEditSiteBoundary: { type: Boolean, default: true },
  canEditPartOfSite: { type: Boolean, default: true },
  canEditSection: { type: Boolean, default: true },
  canDeleteWork: { type: Boolean, default: true },
});

const emit = defineEmits([
  "close",
  "request-delete-work-lot",
  "edit-work-lot",
  "edit-site-boundary",
  "edit-part-of-site",
  "edit-section",
  "focus-map-work-lot",
  "focus-map-site-boundary",
  "focus-map-part-of-site",
  "focus-map-section",
]);
</script>

<style scoped src="./MapDrawerHeader.css"></style>
