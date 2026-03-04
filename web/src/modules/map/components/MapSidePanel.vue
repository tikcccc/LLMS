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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { siteBoundaryStatusStyle } from "../utils/siteBoundaryStatusStyle";

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

const leftTabProxy = computed({
  get: () => props.leftTab,
  set: (value) => emit("update:leftTab", value),
});
const workSearchProxy = computed({
  get: () => props.workSearchQuery,
  set: (value) => emit("update:workSearchQuery", value),
});
const siteBoundarySearchProxy = computed({
  get: () => props.siteBoundarySearchQuery,
  set: (value) => emit("update:siteBoundarySearchQuery", value),
});
const partOfSitesSearchProxy = computed({
  get: () => props.partOfSitesSearchQuery,
  set: (value) => emit("update:partOfSitesSearchQuery", value),
});
const sectionSearchProxy = computed({
  get: () => props.sectionSearchQuery,
  set: (value) => emit("update:sectionSearchQuery", value),
});

const normalizeIdList = (value) => {
  if (!Array.isArray(value)) return [];
  const dedupe = new Set();
  value.forEach((item) => {
    const normalized = String(item || "").trim();
    if (!normalized) return;
    dedupe.add(normalized);
  });
  return Array.from(dedupe);
};

const patchLayerFilterState = (patch) => {
  emit("update:layerFilterState", {
    ...(props.layerFilterState || {}),
    ...patch,
  });
};

const createBooleanFilterProxy = (key, fallback = false) =>
  computed({
    get: () => {
      const value = props.layerFilterState?.[key];
      return typeof value === "boolean" ? value : fallback;
    },
    set: (value) => patchLayerFilterState({ [key]: !!value }),
  });

const showBasemapProxy = createBooleanFilterProxy("showBasemap", true);
const showLabelsProxy = createBooleanFilterProxy("showLabels", true);
const showIntLandProxy = createBooleanFilterProxy("showIntLand", false);
const showPartOfSitesProxy = createBooleanFilterProxy("showPartOfSites", false);
const showSectionsProxy = createBooleanFilterProxy("showSections", false);
const showSiteBoundaryProxy = createBooleanFilterProxy("showSiteBoundary", true);
const showWorkLotsProxy = createBooleanFilterProxy("showWorkLots", true);

const getFilterMode = (modeKey) =>
  props.layerFilterState?.[modeKey] === "custom" ? "custom" : "all";

const getSelectedIds = (idsKey) => normalizeIdList(props.layerFilterState?.[idsKey]);

const layerFilterKeyword = ref("");

const normalizeText = (value) => String(value || "").trim().toLowerCase();

const resolveLayerOptions = (key) =>
  Array.isArray(props.layerFilterOptions?.[key]) ? props.layerFilterOptions[key] : [];

const filterLayerOptions = (items = []) => {
  const keyword = normalizeText(layerFilterKeyword.value);
  if (!keyword) return items;
  return items.filter((item) => {
    const candidates = [item.id, item.label, item.layer, item.handle, item.categoryLabel];
    return candidates.some((candidate) => normalizeText(candidate).includes(keyword));
  });
};

const normalizeStatusText = (value) => String(value || "").trim().toLowerCase();
const compactBoundaryStatus = (value) => {
  const normalized = normalizeStatusText(value);
  if (!normalized) return "Pending";
  if (normalized === "pending clearance") return "Pending";
  if (normalized === "in progress") return "In Progress";
  if (normalized === "critical / risk" || normalized === "critical/risk") return "Risk";
  if (normalized === "handed over") return "Handed Over";
  return String(value || "").trim();
};
const compactWorkStatus = (value) => {
  const normalized = normalizeStatusText(value);
  if (!normalized) return "Assessment";
  if (normalized === "waiting for assessment") return "Assessment";
  if (normalized === "ega approved") return "EGA Approved";
  if (normalized === "waiting for clearance") return "Clearance";
  if (normalized === "completed") return "Completed";
  return String(value || "").trim();
};
const siteBoundaryStatusColor = (statusKey, overdue = false) => ({
  color: siteBoundaryStatusStyle(statusKey, overdue)?.color || "#475569",
});
const workStatusColor = (status, dueDate = "") => ({
  color: props.workStatusStyle(status, dueDate)?.color || "#475569",
});

const partOfSitesOptions = computed(() => resolveLayerOptions("partOfSites"));
const sectionOptions = computed(() => resolveLayerOptions("sections"));
const siteBoundaryOptions = computed(() => resolveLayerOptions("siteBoundaries"));
const workLotOptions = computed(() => resolveLayerOptions("workLots"));

const filteredPartOfSitesOptions = computed(() => filterLayerOptions(partOfSitesOptions.value));
const filteredSectionOptions = computed(() => filterLayerOptions(sectionOptions.value));
const filteredSiteBoundaryOptions = computed(() => filterLayerOptions(siteBoundaryOptions.value));
const filteredWorkLotOptions = computed(() => filterLayerOptions(workLotOptions.value));

const partOfSitesAllIds = computed(() => partOfSitesOptions.value.map((item) => item.id));
const sectionAllIds = computed(() => sectionOptions.value.map((item) => item.id));
const siteBoundaryAllIds = computed(() => siteBoundaryOptions.value.map((item) => item.id));
const workLotAllIds = computed(() => workLotOptions.value.map((item) => item.id));

const resolveDisplaySelectedIds = (modeKey, idsKey, allIds) =>
  getFilterMode(modeKey) === "all" ? [...allIds] : getSelectedIds(idsKey);

const resolveSelectedCount = (modeKey, idsKey, allIds) => {
  if (getFilterMode(modeKey) === "all") return allIds.length;
  const selected = getSelectedIds(idsKey).map((id) => id.toLowerCase());
  return allIds.filter((id) => selected.includes(String(id || "").toLowerCase())).length;
};

const partOfSitesDisplaySelectedIds = computed(() =>
  resolveDisplaySelectedIds("partOfSitesFilterMode", "partOfSitesSelectedIds", partOfSitesAllIds.value)
);
const sectionDisplaySelectedIds = computed(() =>
  resolveDisplaySelectedIds("sectionFilterMode", "sectionSelectedIds", sectionAllIds.value)
);
const siteBoundaryDisplaySelectedIds = computed(() =>
  resolveDisplaySelectedIds(
    "siteBoundaryFilterMode",
    "siteBoundarySelectedIds",
    siteBoundaryAllIds.value
  )
);
const workLotDisplaySelectedIds = computed(() =>
  resolveDisplaySelectedIds("workLotFilterMode", "workLotSelectedIds", workLotAllIds.value)
);

const partOfSitesSelectedCount = computed(() =>
  resolveSelectedCount(
    "partOfSitesFilterMode",
    "partOfSitesSelectedIds",
    partOfSitesAllIds.value
  )
);
const sectionSelectedCount = computed(() =>
  resolveSelectedCount(
    "sectionFilterMode",
    "sectionSelectedIds",
    sectionAllIds.value
  )
);
const siteBoundarySelectedCount = computed(() =>
  resolveSelectedCount(
    "siteBoundaryFilterMode",
    "siteBoundarySelectedIds",
    siteBoundaryAllIds.value
  )
);
const workLotSelectedCount = computed(() =>
  resolveSelectedCount("workLotFilterMode", "workLotSelectedIds", workLotAllIds.value)
);

const partOfSitesTotal = computed(() => partOfSitesAllIds.value.length);
const sectionTotal = computed(() => sectionAllIds.value.length);
const siteBoundaryTotal = computed(() => siteBoundaryAllIds.value.length);
const workLotTotal = computed(() => workLotAllIds.value.length);

const setGroupSelectionAll = (modeKey, idsKey) => {
  patchLayerFilterState({
    [modeKey]: "all",
    [idsKey]: [],
  });
};

const setGroupSelectionNone = (modeKey, idsKey) => {
  patchLayerFilterState({
    [modeKey]: "custom",
    [idsKey]: [],
  });
};

const updateGroupSelection = (modeKey, idsKey, values, allIds) => {
  const selected = normalizeIdList(values);
  const all = normalizeIdList(allIds);
  if (all.length > 0 && selected.length === all.length) {
    setGroupSelectionAll(modeKey, idsKey);
    return;
  }
  patchLayerFilterState({
    [modeKey]: "custom",
    [idsKey]: selected,
  });
};

const selectAllPartOfSites = () =>
  setGroupSelectionAll("partOfSitesFilterMode", "partOfSitesSelectedIds");
const clearPartOfSites = () =>
  setGroupSelectionNone("partOfSitesFilterMode", "partOfSitesSelectedIds");
const onPartOfSitesSelectionChange = (value) =>
  updateGroupSelection(
    "partOfSitesFilterMode",
    "partOfSitesSelectedIds",
    value,
    partOfSitesAllIds.value
  );
const selectAllSections = () =>
  setGroupSelectionAll("sectionFilterMode", "sectionSelectedIds");
const clearSections = () =>
  setGroupSelectionNone("sectionFilterMode", "sectionSelectedIds");
const onSectionSelectionChange = (value) =>
  updateGroupSelection(
    "sectionFilterMode",
    "sectionSelectedIds",
    value,
    sectionAllIds.value
  );

const selectAllSiteBoundaries = () =>
  setGroupSelectionAll("siteBoundaryFilterMode", "siteBoundarySelectedIds");
const clearSiteBoundaries = () =>
  setGroupSelectionNone("siteBoundaryFilterMode", "siteBoundarySelectedIds");
const onSiteBoundarySelectionChange = (value) =>
  updateGroupSelection(
    "siteBoundaryFilterMode",
    "siteBoundarySelectedIds",
    value,
    siteBoundaryAllIds.value
  );

const selectAllWorkLots = () =>
  setGroupSelectionAll("workLotFilterMode", "workLotSelectedIds");
const clearWorkLots = () =>
  setGroupSelectionNone("workLotFilterMode", "workLotSelectedIds");
const onWorkLotSelectionChange = (value) =>
  updateGroupSelection("workLotFilterMode", "workLotSelectedIds", value, workLotAllIds.value);

const siteBoundaryWorkLotCountText = (boundary) => {
  const count = Number(boundary?.workLotCount);
  if (!Number.isFinite(count) || count <= 0) return "No work lots";
  return count === 1 ? "1 work lot" : `${count} work lots`;
};

const MOBILE_BREAKPOINT = 900;
const mobilePanelOpen = ref(true);
const isMobile = ref(false);
const isDesktopCollapsed = ref(false);

const partOfSitesExpanded = ref(true);
const sectionsExpanded = ref(true);
const siteBoundariesExpanded = ref(true);
const workLotsExpanded = ref(true);

const TAB_TITLES = {
  layers: "Layers",
  scope: "Scope Results",
  partofsites: "Part of Sites",
  sections: "Sections",
  worklots: "Work Lots",
  siteboundaries: "Site Boundaries",
};

const mobilePanelTitle = computed(() => TAB_TITLES[leftTabProxy.value] || "Panel");

const PANEL_WIDTH_STORAGE_KEY = "ND_LLM_V1_map_side_panel_width";
const PANEL_COLLAPSE_STORAGE_KEY = "ND_LLM_V1_map_side_panel_collapsed";

const PANEL_MIN_WIDTH = 280;
const PANEL_DEFAULT_WIDTH = 360;
const PANEL_MAX_WIDTH = 560;
const PANEL_COLLAPSED_WIDTH = 52;

const readStoredSize = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const readStoredBoolean = (key, fallback = false) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return fallback;
};

const clampPanelWidth = (width) => {
  if (!Number.isFinite(width)) return PANEL_DEFAULT_WIDTH;
  if (typeof window === "undefined") {
    return Math.min(Math.max(width, PANEL_MIN_WIDTH), PANEL_MAX_WIDTH);
  }
  const viewportMax = Math.max(PANEL_MIN_WIDTH, window.innerWidth - 56);
  const hardMax = Math.min(PANEL_MAX_WIDTH, viewportMax);
  return Math.min(Math.max(width, PANEL_MIN_WIDTH), hardMax);
};

const panelWidth = ref(
  clampPanelWidth(readStoredSize(PANEL_WIDTH_STORAGE_KEY, PANEL_DEFAULT_WIDTH))
);
const isResizing = ref(false);
const panelStyle = computed(() => ({
  "--panel-width": `${
    !isMobile.value && isDesktopCollapsed.value ? PANEL_COLLAPSED_WIDTH : panelWidth.value
  }px`,
}));

let dragStartX = 0;
let dragStartWidth = panelWidth.value;

const persistPanelSize = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidth.value));
};

const persistPanelCollapsed = () => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    PANEL_COLLAPSE_STORAGE_KEY,
    isDesktopCollapsed.value ? "1" : "0"
  );
};

const handleResizeMove = (event) => {
  if (!isResizing.value) return;
  const deltaX = event.clientX - dragStartX;
  panelWidth.value = clampPanelWidth(dragStartWidth + deltaX);
};

const stopResize = () => {
  if (!isResizing.value) return;
  isResizing.value = false;
  window.removeEventListener("pointermove", handleResizeMove);
  window.removeEventListener("pointerup", stopResize);
  window.removeEventListener("pointercancel", stopResize);
  persistPanelSize();
};

const startResize = (event) => {
  if (typeof window === "undefined" || window.innerWidth <= MOBILE_BREAKPOINT) return;
  if (isDesktopCollapsed.value) return;
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  isResizing.value = true;
  dragStartX = event.clientX;
  dragStartWidth = panelWidth.value;
  window.addEventListener("pointermove", handleResizeMove);
  window.addEventListener("pointerup", stopResize);
  window.addEventListener("pointercancel", stopResize);
};

const resetPanelSize = () => {
  panelWidth.value = clampPanelWidth(PANEL_DEFAULT_WIDTH);
  persistPanelSize();
};

let mobileQueryList = null;

const applyMobileMode = (mobile) => {
  isMobile.value = mobile;
  if (mobile) {
    mobilePanelOpen.value = false;
    stopResize();
    return;
  }
  mobilePanelOpen.value = true;
};

const toggleMobilePanel = () => {
  if (!isMobile.value) return;
  mobilePanelOpen.value = !mobilePanelOpen.value;
  if (!mobilePanelOpen.value) {
    emit("panel-close");
  }
};

const toggleDesktopCollapsed = () => {
  if (isMobile.value) return;
  isDesktopCollapsed.value = !isDesktopCollapsed.value;
  if (isDesktopCollapsed.value) {
    emit("panel-close");
  }
  stopResize();
  persistPanelCollapsed();
};

const togglePartOfSitesExpanded = () => {
  partOfSitesExpanded.value = !partOfSitesExpanded.value;
};
const toggleSectionsExpanded = () => {
  sectionsExpanded.value = !sectionsExpanded.value;
};

const toggleSiteBoundariesExpanded = () => {
  siteBoundariesExpanded.value = !siteBoundariesExpanded.value;
};

const toggleWorkLotsExpanded = () => {
  workLotsExpanded.value = !workLotsExpanded.value;
};

const closeMobilePanel = () => {
  if (!isMobile.value) return;
  if (!mobilePanelOpen.value) return;
  mobilePanelOpen.value = false;
  emit("panel-close");
};

const handleMobileMediaChange = (event) => {
  applyMobileMode(event.matches);
};

const handleWindowResize = () => {
  panelWidth.value = clampPanelWidth(panelWidth.value);
  persistPanelSize();
};

watch(
  () => props.leftTab,
  () => {
    if (isMobile.value) {
      mobilePanelOpen.value = true;
    }
  }
);

watch(
  () => props.hasScopeQuery,
  (value) => {
    if (!value && props.leftTab === "scope") {
      emit("update:leftTab", "layers");
    }
  }
);

onMounted(() => {
  if (typeof window === "undefined") return;
  isDesktopCollapsed.value = readStoredBoolean(PANEL_COLLAPSE_STORAGE_KEY, false);
  mobileQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  applyMobileMode(mobileQueryList.matches);
  if (typeof mobileQueryList.addEventListener === "function") {
    mobileQueryList.addEventListener("change", handleMobileMediaChange);
  } else if (typeof mobileQueryList.addListener === "function") {
    mobileQueryList.addListener(handleMobileMediaChange);
  }
  window.addEventListener("resize", handleWindowResize);
});

onBeforeUnmount(() => {
  stopResize();
  if (typeof window === "undefined") return;
  if (mobileQueryList) {
    if (typeof mobileQueryList.removeEventListener === "function") {
      mobileQueryList.removeEventListener("change", handleMobileMediaChange);
    } else if (typeof mobileQueryList.removeListener === "function") {
      mobileQueryList.removeListener(handleMobileMediaChange);
    }
  }
  window.removeEventListener("resize", handleWindowResize);
});
</script>

<style scoped>
.left-panel {
  position: relative;
  z-index: 72;
  width: var(--panel-width, 360px);
  height: 100%;
  min-width: 280px;
  max-width: min(560px, 48vw);
  background: var(--panel);
  border-right: 1px solid var(--border);
  box-shadow: 6px 0 16px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.left-panel.desktop-collapsed {
  width: 52px;
  min-width: 52px;
  max-width: 52px;
}

.mobile-sheet-header {
  display: none;
}

.sidebar-collapse-btn {
  position: absolute;
  top: 10px;
  right: 18px;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.46);
  background: #ffffff;
  color: #334155;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 4;
}

.sidebar-collapse-btn svg {
  width: 14px;
  height: 14px;
  transition: transform 0.18s ease;
}

.sidebar-collapse-btn svg.collapsed {
  transform: rotate(180deg);
}

.left-panel.desktop-collapsed .sidebar-collapse-btn {
  right: 14px;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 12px;
  height: 100%;
  border: 0;
  padding: 0;
  background: transparent;
  cursor: ew-resize;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  z-index: 3;
}

.resize-handle-icon {
  width: 3px;
  height: 56px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.72);
}

.left-panel.resizing,
.left-panel.resizing * {
  cursor: ew-resize !important;
  user-select: none;
}

.resize-handle:hover .resize-handle-icon,
.resize-handle:focus-visible .resize-handle-icon {
  background: rgba(59, 130, 246, 0.92);
}

.panel-tabs {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 8px 44px 0 12px;
}

.panel-tabs :deep(.el-tabs__content) {
  padding: 8px 12px 16px 12px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel-tabs :deep(.el-tab-pane) {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.layer-filter-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.panel-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.layer-filter-toolbar {
  margin-top: 2px;
}

.layer-block {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-block-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.layer-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.layer-title {
  font-size: 12px;
  font-weight: 700;
  color: #1f2937;
}

.layer-subtitle {
  font-size: 11px;
  color: #64748b;
}

.layer-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.inline-action {
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: #fff;
  color: #334155;
  border-radius: 999px;
  min-height: 24px;
  padding: 0 9px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}

.inline-action:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.section-toggle-btn {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.48);
  background: #ffffff;
  color: #475569;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.section-toggle-btn svg {
  width: 14px;
  height: 14px;
  transition: transform 0.18s ease;
}

.section-toggle-btn svg.expanded {
  transform: rotate(180deg);
}

.check-list {
  max-height: 168px;
  overflow-y: auto;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  padding-top: 8px;
}

.check-list :deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.check-item {
  margin-right: 0;
  width: 100%;
}

.check-item :deep(.el-checkbox__label) {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.check-item-focus {
  border: 0;
  background: transparent;
  padding: 0;
  margin: 0;
  width: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
  cursor: pointer;
}

.check-item-focus:hover .check-label {
  color: var(--accent);
}

.check-item-focus:focus-visible {
  outline: 2px solid rgba(15, 118, 110, 0.45);
  outline-offset: 2px;
  border-radius: 6px;
}

.check-label {
  font-size: 12px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.check-meta {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  line-height: 1.1;
}

.check-meta-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  min-width: 0;
}

.check-status-text {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 118px;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.list-scroll {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.list-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  text-align: left;
  background: #f8fafc;
  cursor: pointer;
}

.list-item:hover {
  border-color: rgba(15, 118, 110, 0.4);
  background: #f1f5f9;
}

.list-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.list-title {
  font-size: 13px;
  font-weight: 600;
}

.list-meta {
  font-size: 11px;
  color: var(--muted);
}

.list-meta.subtle {
  margin-top: 2px;
  color: #64748b;
}

.scope-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: #f8fafc;
}

.scope-pane {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 2px;
}

.scope-summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.scope-metrics {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.scope-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background: rgba(241, 245, 249, 0.92);
  font-size: 11px;
  color: var(--muted);
}

.scope-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scope-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.list-subtitle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 8px 0 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.subtitle-count {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  letter-spacing: 0;
  text-transform: none;
}

.scope-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scope-empty {
  padding: 12px 0;
}

@media (max-width: 900px) {
  .left-panel {
    position: absolute;
    top: auto;
    left: 10px;
    right: 10px;
    bottom: 10px;
    width: auto;
    height: min(70vh, 560px);
    max-height: calc(100% - 88px);
    min-width: 0;
    max-width: none;
    border-right: 0;
    border: 1px solid var(--border);
    border-radius: 14px;
    box-shadow: var(--shadow);
    transition: transform 0.22s ease, box-shadow 0.22s ease;
    z-index: 95;
  }

  .left-panel.desktop-collapsed {
    width: auto;
    min-width: 0;
    max-width: none;
  }

  .left-panel.mobile:not(.mobile-open) {
    transform: translateY(calc(100% - 52px));
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.18);
  }

  .mobile-sheet-header {
    height: 52px;
    padding: 6px 10px 6px 10px;
    border-bottom: 1px solid var(--border);
    background: rgba(255, 255, 255, 0.98);
    display: grid;
    grid-template-columns: 44px 1fr 32px;
    align-items: center;
    gap: 8px;
  }

  .mobile-sheet-grip-btn {
    border: 0;
    background: transparent;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
  }

  .mobile-sheet-grip {
    width: 26px;
    height: 4px;
    border-radius: 999px;
    background: rgba(148, 163, 184, 0.8);
  }

  .mobile-sheet-title {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    letter-spacing: 0.02em;
  }

  .mobile-sheet-close-btn {
    width: 28px;
    height: 28px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: #ffffff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    padding: 0;
  }

  .mobile-sheet-close-btn svg {
    width: 15px;
    height: 15px;
  }

  .panel-tabs {
    min-height: 0;
  }

  .panel-tabs :deep(.el-tabs__header) {
    padding: 4px 10px 0 10px;
  }

  .panel-tabs :deep(.el-tabs__content) {
    padding: 8px 10px 12px 10px;
  }

  .resize-handle {
    display: none;
  }

  .sidebar-collapse-btn {
    display: none;
  }
}
</style>
