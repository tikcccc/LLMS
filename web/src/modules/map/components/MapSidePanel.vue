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
        <div class="layer-filter-pane">
          <div class="panel-row">
            <span>Basemap</span>
            <el-switch v-model="showBasemapProxy" />
          </div>
          <div class="panel-row">
            <span>Labels (EN)</span>
            <el-switch v-model="showLabelsProxy" />
          </div>

          <div class="layer-filter-toolbar">
            <el-input
              v-model="layerFilterKeyword"
              clearable
              placeholder="Search lot id / name"
            />
          </div>

          <section class="layer-block">
            <div class="layer-block-head">
              <div class="layer-title-wrap">
                <div class="layer-title">Phase (Global)</div>
                <div class="layer-subtitle">Apply C1/C2 to all layer groups</div>
              </div>
              <div class="layer-actions">
                <el-checkbox v-model="showGlobalC1Proxy" size="small" class="phase-toggle">
                  C1
                </el-checkbox>
                <el-checkbox v-model="showGlobalC2Proxy" size="small" class="phase-toggle">
                  C2
                </el-checkbox>
              </div>
            </div>
          </section>

          <section class="layer-block">
            <div class="layer-block-head">
              <div class="layer-title-wrap">
                <div class="layer-title">Drawing Layer</div>
                <div class="layer-subtitle">Single full-layer toggle</div>
              </div>
              <el-switch v-model="showIntLandProxy" />
            </div>
          </section>

          <section class="layer-block">
            <div class="layer-block-head">
              <div class="layer-title-wrap">
                <div class="layer-title">Part of Sites</div>
                <div class="layer-subtitle">
                  {{ partOfSitesSelectedCount }}/{{ partOfSitesTotal }} selected
                </div>
              </div>
              <div class="layer-actions">
                <el-switch v-model="showPartOfSitesProxy" size="small" />
                <el-checkbox v-model="showPartOfSitesC1Proxy" size="small" class="phase-toggle">
                  C1
                </el-checkbox>
                <el-checkbox v-model="showPartOfSitesC2Proxy" size="small" class="phase-toggle">
                  C2
                </el-checkbox>
                <button
                  type="button"
                  class="inline-action"
                  :disabled="partOfSitesTotal === 0"
                  @click="selectAllPartOfSites"
                >
                  All
                </button>
                <button
                  type="button"
                  class="inline-action"
                  :disabled="partOfSitesTotal === 0"
                  @click="clearPartOfSites"
                >
                  None
                </button>
                <button
                  type="button"
                  class="section-toggle-btn"
                  :aria-label="
                    partOfSitesExpanded ? 'Collapse part of sites list' : 'Expand part of sites list'
                  "
                  :aria-expanded="String(partOfSitesExpanded)"
                  @click="togglePartOfSitesExpanded"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    :class="{ expanded: partOfSitesExpanded }"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="partOfSitesExpanded">
              <div v-if="filteredPartOfSitesOptions.length > 0" class="check-list">
                <el-checkbox-group
                  :model-value="partOfSitesDisplaySelectedIds"
                  @update:model-value="onPartOfSitesSelectionChange"
                >
                  <el-checkbox
                    v-for="item in filteredPartOfSitesOptions"
                    :key="`part-${item.id}`"
                    :label="item.id"
                    :value="item.id"
                    class="check-item"
                  >
                    <span
                      class="check-item-focus"
                      @click.stop.prevent="emit('focus-part-of-site', item.id)"
                      @keydown.enter.stop.prevent="emit('focus-part-of-site', item.id)"
                      @keydown.space.stop.prevent="emit('focus-part-of-site', item.id)"
                      role="button"
                      tabindex="0"
                    >
                      <span class="check-label">{{ item.id }}</span>
                    </span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <el-empty
                v-else
                :image-size="48"
                :description="
                  partOfSitesTotal === 0 ? 'No part of sites loaded' : 'No matching lot'
                "
              />
            </div>
          </section>

          <section class="layer-block">
            <div class="layer-block-head">
              <div class="layer-title-wrap">
                <div class="layer-title">Sections</div>
                <div class="layer-subtitle">
                  {{ sectionSelectedCount }}/{{ sectionTotal }} selected
                </div>
              </div>
              <div class="layer-actions">
                <el-switch v-model="showSectionsProxy" size="small" />
                <el-checkbox v-model="showSectionsC1Proxy" size="small" class="phase-toggle">
                  C1
                </el-checkbox>
                <el-checkbox v-model="showSectionsC2Proxy" size="small" class="phase-toggle">
                  C2
                </el-checkbox>
                <button
                  type="button"
                  class="inline-action"
                  :disabled="sectionTotal === 0"
                  @click="selectAllSections"
                >
                  All
                </button>
                <button
                  type="button"
                  class="inline-action"
                  :disabled="sectionTotal === 0"
                  @click="clearSections"
                >
                  None
                </button>
                <button
                  type="button"
                  class="section-toggle-btn"
                  :aria-label="
                    sectionsExpanded ? 'Collapse sections list' : 'Expand sections list'
                  "
                  :aria-expanded="String(sectionsExpanded)"
                  @click="toggleSectionsExpanded"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    :class="{ expanded: sectionsExpanded }"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="sectionsExpanded">
              <div v-if="filteredSectionOptions.length > 0" class="check-list">
                <el-checkbox-group
                  :model-value="sectionDisplaySelectedIds"
                  @update:model-value="onSectionSelectionChange"
                >
                  <el-checkbox
                    v-for="item in filteredSectionOptions"
                    :key="`section-${item.id}`"
                    :label="item.id"
                    :value="item.id"
                    class="check-item"
                  >
                    <span
                      class="check-item-focus"
                      @click.stop.prevent="emit('focus-section', item.id)"
                      @keydown.enter.stop.prevent="emit('focus-section', item.id)"
                      @keydown.space.stop.prevent="emit('focus-section', item.id)"
                      role="button"
                      tabindex="0"
                    >
                      <span class="check-label">{{ item.label }}</span>
                    </span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <el-empty
                v-else
                :image-size="48"
                :description="
                  sectionTotal === 0 ? 'No sections loaded' : 'No matching lot'
                "
              />
            </div>
          </section>

          <section class="layer-block">
            <div class="layer-block-head">
              <div class="layer-title-wrap">
                <div class="layer-title">Site Boundaries</div>
                <div class="layer-subtitle">
                  {{ siteBoundarySelectedCount }}/{{ siteBoundaryTotal }} selected
                </div>
              </div>
              <div class="layer-actions">
                <el-switch v-model="showSiteBoundaryProxy" size="small" />
                <el-checkbox v-model="showSiteBoundaryC1Proxy" size="small" class="phase-toggle">
                  C1
                </el-checkbox>
                <el-checkbox v-model="showSiteBoundaryC2Proxy" size="small" class="phase-toggle">
                  C2
                </el-checkbox>
                <button
                  type="button"
                  class="inline-action"
                  :disabled="siteBoundaryTotal === 0"
                  @click="selectAllSiteBoundaries"
                >
                  All
                </button>
                <button
                  type="button"
                  class="inline-action"
                  :disabled="siteBoundaryTotal === 0"
                  @click="clearSiteBoundaries"
                >
                  None
                </button>
                <button
                  type="button"
                  class="section-toggle-btn"
                  :aria-label="
                    siteBoundariesExpanded
                      ? 'Collapse site boundaries list'
                      : 'Expand site boundaries list'
                  "
                  :aria-expanded="String(siteBoundariesExpanded)"
                  @click="toggleSiteBoundariesExpanded"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    :class="{ expanded: siteBoundariesExpanded }"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="siteBoundariesExpanded">
              <div v-if="filteredSiteBoundaryOptions.length > 0" class="check-list">
                <el-checkbox-group
                  :model-value="siteBoundaryDisplaySelectedIds"
                  @update:model-value="onSiteBoundarySelectionChange"
                >
                  <el-checkbox
                    v-for="item in filteredSiteBoundaryOptions"
                    :key="`site-${item.id}`"
                    :label="item.id"
                    :value="item.id"
                    class="check-item"
                  >
                    <span
                      class="check-item-focus"
                      @click.stop.prevent="emit('focus-site-boundary', item.id)"
                      @keydown.enter.stop.prevent="emit('focus-site-boundary', item.id)"
                      @keydown.space.stop.prevent="emit('focus-site-boundary', item.id)"
                      role="button"
                      tabindex="0"
                    >
                      <span class="check-label">{{ item.label }}</span>
                      <span class="check-meta-row">
                        <span
                          class="check-status-text"
                          :style="siteBoundaryStatusColor(item.boundaryStatusKey, item.overdue)"
                        >
                          {{ compactBoundaryStatus(item.boundaryStatus || "Pending Clearance") }}
                        </span>
                      </span>
                    </span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <el-empty
                v-else
                :image-size="48"
                :description="
                  siteBoundaryTotal === 0 ? 'No site boundaries loaded' : 'No matching lot'
                "
              />
            </div>
          </section>

          <section class="layer-block">
            <div class="layer-block-head">
              <div class="layer-title-wrap">
                <div class="layer-title">Work Lots</div>
                <div class="layer-subtitle">
                  {{ workLotSelectedCount }}/{{ workLotTotal }} selected
                </div>
              </div>
              <div class="layer-actions">
                <el-switch v-model="showWorkLotsProxy" size="small" />
                <el-checkbox v-model="showWorkLotsC1Proxy" size="small" class="phase-toggle">
                  C1
                </el-checkbox>
                <el-checkbox v-model="showWorkLotsC2Proxy" size="small" class="phase-toggle">
                  C2
                </el-checkbox>
                <button
                  type="button"
                  class="inline-action"
                  :disabled="workLotTotal === 0"
                  @click="selectAllWorkLots"
                >
                  All
                </button>
                <button
                  type="button"
                  class="inline-action"
                  :disabled="workLotTotal === 0"
                  @click="clearWorkLots"
                >
                  None
                </button>
                <button
                  type="button"
                  class="section-toggle-btn"
                  :aria-label="
                    workLotsExpanded ? 'Collapse work lots list' : 'Expand work lots list'
                  "
                  :aria-expanded="String(workLotsExpanded)"
                  @click="toggleWorkLotsExpanded"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    :class="{ expanded: workLotsExpanded }"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>
            </div>
            <div v-if="workLotsExpanded">
              <div v-if="filteredWorkLotOptions.length > 0" class="check-list">
                <el-checkbox-group
                  :model-value="workLotDisplaySelectedIds"
                  @update:model-value="onWorkLotSelectionChange"
                >
                  <el-checkbox
                    v-for="item in filteredWorkLotOptions"
                    :key="`work-${item.id}`"
                    :label="item.id"
                    :value="item.id"
                    class="check-item"
                  >
                    <span
                      class="check-item-focus"
                      @click.stop.prevent="emit('focus-work', item.id)"
                      @keydown.enter.stop.prevent="emit('focus-work', item.id)"
                      @keydown.space.stop.prevent="emit('focus-work', item.id)"
                      role="button"
                      tabindex="0"
                    >
                      <span class="check-label">{{ item.label }}</span>
                      <span class="check-meta-row">
                        <span class="check-meta">{{ item.categoryCode || "BU" }}</span>
                        <span class="check-separator" aria-hidden="true">|</span>
                        <span
                          class="check-status-text"
                          :style="workStatusColor(item.status, item.dueDate)"
                        >
                          {{ compactWorkStatus(item.status || "Waiting for Assessment") }}
                        </span>
                      </span>
                    </span>
                  </el-checkbox>
                </el-checkbox-group>
              </div>
              <el-empty
                v-else
                :image-size="48"
                :description="workLotTotal === 0 ? 'No work lots loaded' : 'No matching lot'"
              />
            </div>
          </section>
        </div>
      </el-tab-pane>

      <el-tab-pane v-if="hasScopeQuery" label="Scope Results" name="scope">
        <div class="scope-pane">
          <div class="scope-summary">
            <div class="scope-summary-top">
              <div class="scope-title">{{ scopeModeName }}</div>
              <el-tag size="small" effect="plain" type="info">
                {{
                  scopeSectionResults.length +
                  scopeSiteBoundaryResults.length +
                  scopeWorkLotResults.length +
                  scopePartOfSitesResults.length
                }}
                results
              </el-tag>
            </div>
            <div class="scope-metrics">
              <span class="scope-pill">
                {{ scopePartOfSitesResults.length }} part of sites
              </span>
              <span class="scope-pill">
                {{ scopeSectionResults.length }} sections
              </span>
              <span class="scope-pill">
                {{ scopeSiteBoundaryResults.length }} site boundaries
              </span>
              <span class="scope-pill">
                {{ scopeWorkLotResults.length }} work lots
              </span>
            </div>
          </div>

          <template
            v-if="
              scopeSiteBoundaryResults.length > 0 ||
              scopeWorkLotResults.length > 0 ||
              scopePartOfSitesResults.length > 0 ||
              scopeSectionResults.length > 0
            "
          >
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
                  <div class="list-meta subtle">
                    {{ section.group || "—" }} · {{ section.systemId || "—" }}
                  </div>
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
                  <div class="list-meta subtle">
                    {{ part.group || "—" }} · {{ part.systemId || "—" }}
                  </div>
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
                    <el-tag
                      size="small"
                      effect="plain"
                      :style="workStatusStyle(lot.status, lot.dueDate)"
                    >
                      {{ lot.status }}
                    </el-tag>
                  </div>
                </button>
              </div>
            </section>
          </template>

          <el-empty
            v-else
            class="scope-empty"
            description="Use Scope/Circle tool to draw a range"
          />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Part of Sites" name="partofsites">
        <div class="panel-section">
          <el-input
            v-model="partOfSitesSearchProxy"
            placeholder="Search part of sites"
            clearable
          />
        </div>
        <div class="list-scroll">
          <button
            v-for="part in partOfSitesResults"
            :key="`part-tab-${part.id}`"
            class="list-item"
            type="button"
            @click="emit('focus-part-of-site', part.id)"
          >
            <div class="list-title-row">
              <span class="list-title">{{ part.title }}</span>
              <el-tag size="small" effect="plain">Part of Site</el-tag>
            </div>
            <div class="list-meta subtle">
              {{ part.group || "—" }} · {{ part.systemId || "—" }}
            </div>
          </button>
          <el-empty v-if="partOfSitesResults.length === 0" description="No part of sites" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Sections" name="sections">
        <div class="panel-section">
          <el-input
            v-model="sectionSearchProxy"
            placeholder="Search sections"
            clearable
          />
        </div>
        <div class="list-scroll">
          <button
            v-for="section in sectionResults"
            :key="`section-tab-${section.id}`"
            class="list-item"
            type="button"
            @click="emit('focus-section', section.id)"
          >
            <div class="list-title-row">
              <span class="list-title">{{ section.title }}</span>
              <el-tag size="small" effect="plain">Section</el-tag>
            </div>
            <div class="list-meta subtle">
              {{ section.group || "—" }} · {{ section.systemId || "—" }}
            </div>
          </button>
          <el-empty v-if="sectionResults.length === 0" description="No sections" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Work Lots" name="worklots">
        <div class="panel-section">
          <el-input v-model="workSearchProxy" placeholder="Search work lots" clearable />
        </div>
        <div class="list-scroll">
          <button
            v-for="lot in workLotResults"
            :key="lot.id"
            class="list-item"
            type="button"
            @click="emit('focus-work', lot.id)"
          >
            <div class="list-title-row">
              <span class="list-title">{{ lot.operatorName }}</span>
              <el-tag
                size="small"
                effect="plain"
                :style="workStatusStyle(lot.status, lot.dueDate)"
              >
                {{ lot.status }}
              </el-tag>
            </div>
            <div class="list-meta subtle">
              {{
                (Array.isArray(lot.relatedSiteBoundaryIds) && lot.relatedSiteBoundaryIds.length
                  ? `${lot.relatedSiteBoundaryIds.length} related lands`
                  : "No related land")
              }}
              · {{ lot.responsiblePerson || "Unassigned" }} · Due {{ lot.dueDate || "—" }}
            </div>
          </button>
          <el-empty v-if="workLotResults.length === 0" description="No work lots" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Site Boundaries" name="siteboundaries">
        <div class="panel-section">
          <el-input
            v-model="siteBoundarySearchProxy"
            placeholder="Search site boundaries"
            clearable
          />
        </div>
        <div class="list-scroll">
          <button
            v-for="boundary in siteBoundaryResults"
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
              {{ siteBoundaryWorkLotCountText(boundary) }} · Handover
              {{ boundary.plannedHandoverDate || "—" }}
            </div>
          </button>
          <el-empty v-if="siteBoundaryResults.length === 0" description="No site boundaries" />
        </div>
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
