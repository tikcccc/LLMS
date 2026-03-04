<template>
  <aside
    class="left-panel"
    :class="{
      resizing: isResizing,
      mobile: isMobile,
      'mobile-open': mobilePanelOpen,
      'desktop-collapsed': isDesktopCollapsed,
    }"
    :style="panelStyle"
  >
    <button
      v-if="!isMobile"
      class="sidebar-collapse-btn"
      type="button"
      :aria-label="isDesktopCollapsed ? 'Expand map side panel' : 'Collapse map side panel'"
      @click="toggleDesktopCollapsed"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        :class="{ collapsed: isDesktopCollapsed }"
      >
        <path d="M15 6l-6 6 6 6" />
      </svg>
    </button>

    <div v-if="isMobile" class="mobile-sheet-header">
      <button
        class="mobile-sheet-grip-btn"
        type="button"
        aria-label="Toggle map side panel"
        @click="toggleMobilePanel"
      >
        <span class="mobile-sheet-grip"></span>
      </button>
      <div class="mobile-sheet-title">{{ mobilePanelTitle }}</div>
      <button
        class="mobile-sheet-close-btn"
        type="button"
        aria-label="Collapse map side panel"
        @click="closeMobilePanel"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>

    <el-tabs
      v-show="(isMobile && mobilePanelOpen) || (!isMobile && !isDesktopCollapsed)"
      v-model="leftTabProxy"
      class="panel-tabs"
    >
      <el-tab-pane label="Layers" name="layers">
        <MapSidePanelLayersTab
          v-model:show-basemap="showBasemapProxy"
          v-model:show-labels="showLabelsProxy"
          v-model:layer-filter-keyword="layerFilterKeyword"
          v-model:show-global-c1="showGlobalC1Proxy"
          v-model:show-global-c2="showGlobalC2Proxy"
          v-model:show-int-land="showIntLandProxy"
          v-model:show-part-of-sites="showPartOfSitesProxy"
          v-model:show-part-of-sites-c1="showPartOfSitesC1Proxy"
          v-model:show-part-of-sites-c2="showPartOfSitesC2Proxy"
          v-model:show-sections="showSectionsProxy"
          v-model:show-sections-c1="showSectionsC1Proxy"
          v-model:show-sections-c2="showSectionsC2Proxy"
          v-model:show-site-boundary="showSiteBoundaryProxy"
          v-model:show-site-boundary-c1="showSiteBoundaryC1Proxy"
          v-model:show-site-boundary-c2="showSiteBoundaryC2Proxy"
          v-model:show-work-lots="showWorkLotsProxy"
          v-model:show-work-lots-c1="showWorkLotsC1Proxy"
          v-model:show-work-lots-c2="showWorkLotsC2Proxy"
          :filtered-part-of-sites-options="filteredPartOfSitesOptions"
          :filtered-section-options="filteredSectionOptions"
          :filtered-site-boundary-options="filteredSiteBoundaryOptions"
          :filtered-work-lot-options="filteredWorkLotOptions"
          :part-of-sites-display-selected-ids="partOfSitesDisplaySelectedIds"
          :section-display-selected-ids="sectionDisplaySelectedIds"
          :site-boundary-display-selected-ids="siteBoundaryDisplaySelectedIds"
          :work-lot-display-selected-ids="workLotDisplaySelectedIds"
          :part-of-sites-selected-count="partOfSitesSelectedCount"
          :section-selected-count="sectionSelectedCount"
          :site-boundary-selected-count="siteBoundarySelectedCount"
          :work-lot-selected-count="workLotSelectedCount"
          :part-of-sites-total="partOfSitesTotal"
          :section-total="sectionTotal"
          :site-boundary-total="siteBoundaryTotal"
          :work-lot-total="workLotTotal"
          :part-of-sites-expanded="partOfSitesExpanded"
          :sections-expanded="sectionsExpanded"
          :site-boundaries-expanded="siteBoundariesExpanded"
          :work-lots-expanded="workLotsExpanded"
          :compact-boundary-status="compactBoundaryStatus"
          :compact-work-status="compactWorkStatus"
          :site-boundary-status-color="siteBoundaryStatusColor"
          :work-status-color="workStatusColor"
          @select-all-part-of-sites="selectAllPartOfSites"
          @clear-part-of-sites="clearPartOfSites"
          @part-of-sites-selection-change="onPartOfSitesSelectionChange"
          @toggle-part-of-sites-expanded="togglePartOfSitesExpanded"
          @select-all-sections="selectAllSections"
          @clear-sections="clearSections"
          @section-selection-change="onSectionSelectionChange"
          @toggle-sections-expanded="toggleSectionsExpanded"
          @select-all-site-boundaries="selectAllSiteBoundaries"
          @clear-site-boundaries="clearSiteBoundaries"
          @site-boundary-selection-change="onSiteBoundarySelectionChange"
          @toggle-site-boundaries-expanded="toggleSiteBoundariesExpanded"
          @select-all-work-lots="selectAllWorkLots"
          @clear-work-lots="clearWorkLots"
          @work-lot-selection-change="onWorkLotSelectionChange"
          @toggle-work-lots-expanded="toggleWorkLotsExpanded"
          @focus-work="emit('focus-work', $event)"
          @focus-site-boundary="emit('focus-site-boundary', $event)"
          @focus-part-of-site="emit('focus-part-of-site', $event)"
          @focus-section="emit('focus-section', $event)"
        />
      </el-tab-pane>

      <el-tab-pane v-if="hasScopeQuery" label="Scope Results" name="scope">
        <MapSidePanelScopeTab
          :scope-mode-name="scopeModeName"
          :scope-part-of-sites-results="scopePartOfSitesResults"
          :scope-section-results="scopeSectionResults"
          :scope-work-lot-results="scopeWorkLotResults"
          :scope-site-boundary-results="scopeSiteBoundaryResults"
          :work-status-style="workStatusStyle"
          @focus-work="emit('focus-work', $event)"
          @focus-site-boundary="emit('focus-site-boundary', $event)"
          @focus-part-of-site="emit('focus-part-of-site', $event)"
          @focus-section="emit('focus-section', $event)"
        />
      </el-tab-pane>

      <el-tab-pane label="Part of Sites" name="partofsites">
        <MapSidePanelPartOfSitesTab
          v-model:search-query="partOfSitesSearchProxy"
          :results="partOfSitesResults"
          @focus-part-of-site="emit('focus-part-of-site', $event)"
        />
      </el-tab-pane>

      <el-tab-pane label="Sections" name="sections">
        <MapSidePanelSectionsTab
          v-model:search-query="sectionSearchProxy"
          :results="sectionResults"
          @focus-section="emit('focus-section', $event)"
        />
      </el-tab-pane>

      <el-tab-pane label="Work Lots" name="worklots">
        <MapSidePanelWorkLotsTab
          v-model:search-query="workSearchProxy"
          :results="workLotResults"
          :work-status-style="workStatusStyle"
          @focus-work="emit('focus-work', $event)"
        />
      </el-tab-pane>

      <el-tab-pane label="Site Boundaries" name="siteboundaries">
        <MapSidePanelSiteBoundariesTab
          v-model:search-query="siteBoundarySearchProxy"
          :results="siteBoundaryResults"
          :site-boundary-status-style="siteBoundaryStatusStyle"
          :site-boundary-work-lot-count-text="siteBoundaryWorkLotCountText"
          @focus-site-boundary="emit('focus-site-boundary', $event)"
        />
      </el-tab-pane>
    </el-tabs>

    <button
      v-if="!isMobile && !isDesktopCollapsed"
      class="resize-handle"
      type="button"
      aria-label="Resize side panel width"
      @pointerdown="startResize"
      @dblclick="resetPanelSize"
    >
      <span class="resize-handle-icon"></span>
    </button>
  </aside>
</template>

<script setup>
import MapSidePanelLayersTab from "./MapSidePanelLayersTab.vue";
import MapSidePanelPartOfSitesTab from "./MapSidePanelPartOfSitesTab.vue";
import MapSidePanelScopeTab from "./MapSidePanelScopeTab.vue";
import MapSidePanelSectionsTab from "./MapSidePanelSectionsTab.vue";
import MapSidePanelSiteBoundariesTab from "./MapSidePanelSiteBoundariesTab.vue";
import MapSidePanelWorkLotsTab from "./MapSidePanelWorkLotsTab.vue";
import { useMapSidePanelFilters } from "./composables/useMapSidePanelFilters";
import { useMapSidePanelLayout } from "./composables/useMapSidePanelLayout";

const props = defineProps({
  leftTab: { type: String, required: true },
  workSearchQuery: { type: String, required: true },
  siteBoundarySearchQuery: { type: String, required: true },
  partOfSitesSearchQuery: { type: String, required: true },
  sectionSearchQuery: { type: String, required: true },
  layerFilterState: { type: Object, required: true },
  layerFilterOptions: { type: Object, required: true },
  partOfSitesResults: { type: Array, required: true },
  sectionResults: { type: Array, required: true },
  workLotResults: { type: Array, required: true },
  siteBoundaryResults: { type: Array, required: true },
  scopePartOfSitesResults: { type: Array, required: true },
  scopeSectionResults: { type: Array, required: true },
  scopeWorkLotResults: { type: Array, required: true },
  scopeSiteBoundaryResults: { type: Array, required: true },
  hasScopeQuery: { type: Boolean, default: false },
  scopeModeName: { type: String, required: true },
  workStatusStyle: { type: Function, required: true },
});

const emit = defineEmits([
  "update:leftTab",
  "update:workSearchQuery",
  "update:siteBoundarySearchQuery",
  "update:partOfSitesSearchQuery",
  "update:sectionSearchQuery",
  "update:layerFilterState",
  "focus-work",
  "focus-site-boundary",
  "focus-part-of-site",
  "focus-section",
  "panel-close",
]);

const {
  leftTabProxy,
  workSearchProxy,
  siteBoundarySearchProxy,
  partOfSitesSearchProxy,
  sectionSearchProxy,
  showBasemapProxy,
  showLabelsProxy,
  showIntLandProxy,
  showPartOfSitesProxy,
  showPartOfSitesC1Proxy,
  showPartOfSitesC2Proxy,
  showSectionsProxy,
  showSectionsC1Proxy,
  showSectionsC2Proxy,
  showSiteBoundaryProxy,
  showSiteBoundaryC1Proxy,
  showSiteBoundaryC2Proxy,
  showWorkLotsProxy,
  showWorkLotsC1Proxy,
  showWorkLotsC2Proxy,
  showGlobalC1Proxy,
  showGlobalC2Proxy,
  layerFilterKeyword,
  filteredPartOfSitesOptions,
  filteredSectionOptions,
  filteredSiteBoundaryOptions,
  filteredWorkLotOptions,
  partOfSitesDisplaySelectedIds,
  sectionDisplaySelectedIds,
  siteBoundaryDisplaySelectedIds,
  workLotDisplaySelectedIds,
  partOfSitesSelectedCount,
  sectionSelectedCount,
  siteBoundarySelectedCount,
  workLotSelectedCount,
  partOfSitesTotal,
  sectionTotal,
  siteBoundaryTotal,
  workLotTotal,
  selectAllPartOfSites,
  clearPartOfSites,
  onPartOfSitesSelectionChange,
  selectAllSections,
  clearSections,
  onSectionSelectionChange,
  selectAllSiteBoundaries,
  clearSiteBoundaries,
  onSiteBoundarySelectionChange,
  selectAllWorkLots,
  clearWorkLots,
  onWorkLotSelectionChange,
  compactBoundaryStatus,
  compactWorkStatus,
  siteBoundaryStatusStyle,
  siteBoundaryStatusColor,
  workStatusColor,
  siteBoundaryWorkLotCountText,
} = useMapSidePanelFilters({ props, emit });

const {
  mobilePanelOpen,
  isMobile,
  isResizing,
  isDesktopCollapsed,
  partOfSitesExpanded,
  sectionsExpanded,
  siteBoundariesExpanded,
  workLotsExpanded,
  mobilePanelTitle,
  panelStyle,
  startResize,
  resetPanelSize,
  toggleMobilePanel,
  toggleDesktopCollapsed,
  togglePartOfSitesExpanded,
  toggleSectionsExpanded,
  toggleSiteBoundariesExpanded,
  toggleWorkLotsExpanded,
  closeMobilePanel,
} = useMapSidePanelLayout({ props, emit });
</script>

<style scoped src="./MapSidePanel.css"></style>
