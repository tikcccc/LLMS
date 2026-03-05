<template>
  <div class="layer-filter-pane">
    <div class="panel-row">
      <span>Basemap</span>
      <el-switch :model-value="showBasemap" @update:model-value="emit('update:showBasemap', $event)" />
    </div>
    <div class="panel-row">
      <span>Labels (EN)</span>
      <el-switch :model-value="showLabels" @update:model-value="emit('update:showLabels', $event)" />
    </div>

    <div class="layer-filter-toolbar">
      <el-input
        :model-value="layerFilterKeyword"
        clearable
        placeholder="Search lot id / name"
        @update:model-value="emit('update:layerFilterKeyword', $event)"
      />
    </div>

    <section class="layer-block">
      <div class="layer-block-head">
        <div class="layer-title-wrap">
          <div class="layer-title">Contract Workspace</div>
          <div class="layer-subtitle">Switch map data between C1 and C2</div>
        </div>
        <div class="layer-actions">
          <el-radio-group
            :model-value="activeContract"
            size="small"
            @update:model-value="emit('update:activeContract', $event)"
          >
            <el-radio-button :label="'C1'">C1</el-radio-button>
            <el-radio-button :label="'C2'">C2</el-radio-button>
          </el-radio-group>
        </div>
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
          <el-switch :model-value="showPartOfSites" size="small" @update:model-value="emit('update:showPartOfSites', $event)" />
          <button
            type="button"
            class="inline-action"
            :disabled="partOfSitesTotal === 0"
            @click="emit('select-all-part-of-sites')"
          >
            All
          </button>
          <button
            type="button"
            class="inline-action"
            :disabled="partOfSitesTotal === 0"
            @click="emit('clear-part-of-sites')"
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
            @click="emit('toggle-part-of-sites-expanded')"
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
            @update:model-value="emit('part-of-sites-selection-change', $event)"
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
          :description="partOfSitesTotal === 0 ? 'No part of sites loaded' : 'No matching lot'"
        />
      </div>
    </section>

    <section class="layer-block">
      <div class="layer-block-head">
        <div class="layer-title-wrap">
          <div class="layer-title">Sections</div>
          <div class="layer-subtitle">{{ sectionSelectedCount }}/{{ sectionTotal }} selected</div>
        </div>
        <div class="layer-actions">
          <el-switch :model-value="showSections" size="small" @update:model-value="emit('update:showSections', $event)" />
          <button
            type="button"
            class="inline-action"
            :disabled="sectionTotal === 0"
            @click="emit('select-all-sections')"
          >
            All
          </button>
          <button
            type="button"
            class="inline-action"
            :disabled="sectionTotal === 0"
            @click="emit('clear-sections')"
          >
            None
          </button>
          <button
            type="button"
            class="section-toggle-btn"
            :aria-label="sectionsExpanded ? 'Collapse sections list' : 'Expand sections list'"
            :aria-expanded="String(sectionsExpanded)"
            @click="emit('toggle-sections-expanded')"
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
            @update:model-value="emit('section-selection-change', $event)"
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
          :description="sectionTotal === 0 ? 'No sections loaded' : 'No matching lot'"
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
          <el-switch :model-value="showSiteBoundary" size="small" @update:model-value="emit('update:showSiteBoundary', $event)" />
          <button
            type="button"
            class="inline-action"
            :disabled="siteBoundaryTotal === 0"
            @click="emit('select-all-site-boundaries')"
          >
            All
          </button>
          <button
            type="button"
            class="inline-action"
            :disabled="siteBoundaryTotal === 0"
            @click="emit('clear-site-boundaries')"
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
            @click="emit('toggle-site-boundaries-expanded')"
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
            @update:model-value="emit('site-boundary-selection-change', $event)"
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
          :description="siteBoundaryTotal === 0 ? 'No site boundaries loaded' : 'No matching lot'"
        />
      </div>
    </section>

    <section class="layer-block">
      <div class="layer-block-head">
        <div class="layer-title-wrap">
          <div class="layer-title">Work Lots</div>
          <div class="layer-subtitle">{{ workLotSelectedCount }}/{{ workLotTotal }} selected</div>
        </div>
        <div class="layer-actions">
          <el-switch :model-value="showWorkLots" size="small" @update:model-value="emit('update:showWorkLots', $event)" />
          <button
            type="button"
            class="inline-action"
            :disabled="workLotTotal === 0"
            @click="emit('select-all-work-lots')"
          >
            All
          </button>
          <button
            type="button"
            class="inline-action"
            :disabled="workLotTotal === 0"
            @click="emit('clear-work-lots')"
          >
            None
          </button>
          <button
            type="button"
            class="section-toggle-btn"
            :aria-label="workLotsExpanded ? 'Collapse work lots list' : 'Expand work lots list'"
            :aria-expanded="String(workLotsExpanded)"
            @click="emit('toggle-work-lots-expanded')"
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
            @update:model-value="emit('work-lot-selection-change', $event)"
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
                  <span class="check-status-text" :style="workStatusColor(item.status, item.dueDate)">
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
</template>

<script setup>
defineProps({
  showBasemap: { type: Boolean, default: true },
  showLabels: { type: Boolean, default: true },
  layerFilterKeyword: { type: String, default: "" },
  activeContract: { type: String, default: "C2" },
  showPartOfSites: { type: Boolean, default: false },
  showSections: { type: Boolean, default: false },
  showSiteBoundary: { type: Boolean, default: true },
  showWorkLots: { type: Boolean, default: true },
  filteredPartOfSitesOptions: { type: Array, default: () => [] },
  filteredSectionOptions: { type: Array, default: () => [] },
  filteredSiteBoundaryOptions: { type: Array, default: () => [] },
  filteredWorkLotOptions: { type: Array, default: () => [] },
  partOfSitesDisplaySelectedIds: { type: Array, default: () => [] },
  sectionDisplaySelectedIds: { type: Array, default: () => [] },
  siteBoundaryDisplaySelectedIds: { type: Array, default: () => [] },
  workLotDisplaySelectedIds: { type: Array, default: () => [] },
  partOfSitesSelectedCount: { type: Number, default: 0 },
  sectionSelectedCount: { type: Number, default: 0 },
  siteBoundarySelectedCount: { type: Number, default: 0 },
  workLotSelectedCount: { type: Number, default: 0 },
  partOfSitesTotal: { type: Number, default: 0 },
  sectionTotal: { type: Number, default: 0 },
  siteBoundaryTotal: { type: Number, default: 0 },
  workLotTotal: { type: Number, default: 0 },
  partOfSitesExpanded: { type: Boolean, default: true },
  sectionsExpanded: { type: Boolean, default: true },
  siteBoundariesExpanded: { type: Boolean, default: true },
  workLotsExpanded: { type: Boolean, default: true },
  compactBoundaryStatus: { type: Function, required: true },
  compactWorkStatus: { type: Function, required: true },
  siteBoundaryStatusColor: { type: Function, required: true },
  workStatusColor: { type: Function, required: true },
});

const emit = defineEmits([
  "update:showBasemap",
  "update:showLabels",
  "update:layerFilterKeyword",
  "update:activeContract",
  "update:showPartOfSites",
  "update:showSections",
  "update:showSiteBoundary",
  "update:showWorkLots",
  "select-all-part-of-sites",
  "clear-part-of-sites",
  "part-of-sites-selection-change",
  "toggle-part-of-sites-expanded",
  "select-all-sections",
  "clear-sections",
  "section-selection-change",
  "toggle-sections-expanded",
  "select-all-site-boundaries",
  "clear-site-boundaries",
  "site-boundary-selection-change",
  "toggle-site-boundaries-expanded",
  "select-all-work-lots",
  "clear-work-lots",
  "work-lot-selection-change",
  "toggle-work-lots-expanded",
  "focus-part-of-site",
  "focus-section",
  "focus-site-boundary",
  "focus-work",
]);
</script>

<style scoped src="./MapSidePanel.css"></style>
