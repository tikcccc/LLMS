<template>
  <el-drawer
    :model-value="isOpen"
    size="420px"
    :modal="false"
    :modal-penetrable="true"
    :show-close="false"
    :close-on-press-escape="true"
    @close="emit('close')"
  >
    <template #header>
      <MapDrawerHeader
        :selected-work-lot="selectedWorkLot"
        :selected-site-boundary="selectedSiteBoundary"
        :selected-part-of-site="selectedPartOfSite"
        :selected-section="selectedSection"
        :selected-int-land="selectedIntLand"
        :work-lot-header-title="workLotHeaderTitle"
        :site-boundary-header-title="siteBoundaryHeaderTitle"
        :part-of-site-header-title="partOfSiteHeaderTitle"
        :section-header-title="sectionHeaderTitle"
        :work-status-style="workStatusStyle"
        :is-work-lot-focus-active="isWorkLotFocusActive"
        :is-site-boundary-focus-active="isSiteBoundaryFocusActive"
        :is-part-of-site-focus-active="isPartOfSiteFocusActive"
        :is-section-focus-active="isSectionFocusActive"
        :can-edit-work="canEditWork"
        :can-edit-site-boundary="canEditSiteBoundary"
        :can-edit-part-of-site="canEditPartOfSite"
        :can-edit-section="canEditSection"
        :can-delete-work="canDeleteWork"
        @close="emit('close')"
        @focus-map-work-lot="emit('focus-map-work-lot', $event)"
        @focus-map-site-boundary="emit('focus-map-site-boundary', $event)"
        @focus-map-part-of-site="emit('focus-map-part-of-site', $event)"
        @focus-map-section="emit('focus-map-section', $event)"
        @edit-work-lot="emit('edit-work-lot')"
        @edit-site-boundary="emit('edit-site-boundary')"
        @edit-part-of-site="emit('edit-part-of-site')"
        @edit-section="emit('edit-section')"
        @request-delete-work-lot="requestDeleteWorkLot"
      />
    </template>

    <div v-if="selectedWorkLot" class="drawer-body">
      <el-collapse v-model="activeCollapse" class="info-collapse">
        <el-collapse-item name="basic" title="Basic Information">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">System ID</span>
              <span class="info-value">{{ selectedWorkLot.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Category</span>
              <span class="info-value">{{ workCategoryLabel(selectedWorkLot.category) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Responsible Person</span>
              <span class="info-value">{{ selectedWorkLot.responsiblePerson || "—" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Area</span>
              <span class="info-value">{{ workLotAreaText }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Due Date</span>
              <span class="info-value">
                <TimeText :value="selectedWorkLot.dueDate" mode="date" />
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Assess Date</span>
              <span class="info-value">
                <TimeText :value="selectedWorkLot.assessDate" mode="date" />
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Completion Date</span>
              <span class="info-value">
                <TimeText :value="selectedWorkLot.completionDate" mode="date" />
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Float (Months)</span>
              <span class="info-value">
                {{
                  selectedWorkLot.floatMonths === null ||
                  selectedWorkLot.floatMonths === undefined
                    ? "—"
                    : selectedWorkLot.floatMonths
                }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Force Eviction</span>
              <span class="info-value">{{ selectedWorkLot.forceEviction ? "Yes" : "No" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Operational Status</span>
              <span class="info-value">{{ selectedWorkLot.status }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Updated By</span>
              <span class="info-value">{{ selectedWorkLot.updatedBy || "—" }}</span>
            </div>
            <div class="info-item info-item-wide">
              <span class="info-label">Updated At</span>
              <span class="info-value">
                <TimeText :value="selectedWorkLot.updatedAt" />
              </span>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item name="relatedSites" title="Related Sites">
          <div v-if="relatedSiteBoundaries.length > 0" class="related-list">
            <button
              v-for="site in relatedSiteBoundaries"
              :key="site.id"
              class="related-item"
              type="button"
              @click="emit('focus-site-boundary', site.id)"
            >
              <div class="related-item-head">
                <span class="related-item-title" :title="site.name || 'Site Boundary'">
                  {{ site.name || "Site Boundary" }}
                </span>
                <el-tag
                  size="small"
                  effect="plain"
                  :style="siteBoundaryStatusStyle(site.statusKey, site.overdue)"
                >
                  {{ site.status || "Pending Clearance" }}
                </el-tag>
              </div>
              <div class="related-item-meta">
                Handover <TimeText :value="site.plannedHandoverDate" mode="date" />
              </div>
            </button>
          </div>
          <el-empty v-else :image-size="60" description="No related sites" />
        </el-collapse-item>

        <el-collapse-item name="description" title="Description">
          <div class="block-text">{{ selectedWorkLot.description || "—" }}</div>
        </el-collapse-item>

        <el-collapse-item name="remark" title="Remark">
          <div class="block-text">{{ selectedWorkLot.remark || "—" }}</div>
        </el-collapse-item>
      </el-collapse>

      <ConfirmDialog
        v-model="showDeleteWorkLotConfirm"
        title="Delete Work Lot"
        :message="workLotDeleteMessage"
        description="This action cannot be undone."
        confirm-text="Delete"
        confirm-type="danger"
        @confirm="handleConfirmDeleteWorkLot"
      />
    </div>

    <div v-else-if="selectedSiteBoundary" class="drawer-body">
      <el-collapse v-model="activeCollapse" class="info-collapse">
        <el-collapse-item name="basic" title="Basic Information">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">System ID</span>
              <span class="info-value">{{ selectedSiteBoundary.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Area</span>
              <span class="info-value">{{ siteBoundaryAreaText }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Handover Date</span>
              <span class="info-value">
                <TimeText :value="selectedSiteBoundary.plannedHandoverDate" mode="date" />
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Contract No.</span>
              <span class="info-value">{{ selectedSiteBoundary.contractNo || "—" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Future Use</span>
              <span class="info-value">{{ selectedSiteBoundary.futureUse || "—" }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Management Status</span>
              <span class="info-value">
                <el-tag
                  size="small"
                  effect="plain"
                  :style="
                    siteBoundaryStatusStyle(
                      selectedSiteBoundary.boundaryStatusKey,
                      !!selectedSiteBoundary.overdue
                    )
                  "
                >
                  {{ selectedSiteBoundary.boundaryStatus || "Pending Clearance" }}
                </el-tag>
              </span>
            </div>
            <div class="info-item info-item-wide">
              <span class="info-label">Handover Progress</span>
              <SiteBoundaryProgress
                :percentage="siteBoundaryProgressPercent"
                :completed="selectedSiteBoundary.operatorCompleted || 0"
                :total="selectedSiteBoundary.operatorTotal || 0"
                :status-key="selectedSiteBoundary.boundaryStatusKey"
                :overdue="!!selectedSiteBoundary.overdue"
              />
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item name="relatedWorkLots" title="Related Work Lots">
          <div v-if="relatedWorkLots.length > 0" class="related-filters">
            <el-input
              v-model="relatedWorkLotsKeyword"
              size="small"
              clearable
              placeholder="Search related work lots"
            />
            <el-select v-model="relatedWorkLotsStatusFilter" size="small">
              <el-option
                v-for="option in relatedWorkLotStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-select v-model="relatedWorkLotsDueFilter" size="small">
              <el-option
                v-for="option in RELATED_WORKLOT_DUE_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <div v-if="filteredRelatedWorkLots.length > 0" class="related-list">
            <button
              v-for="lot in filteredRelatedWorkLots"
              :key="lot.id"
              class="related-item"
              type="button"
              @click="emit('focus-work-lot', lot.id)"
            >
              <div class="related-item-head">
                <span class="related-item-title" :title="lot.operatorName || 'Work Lot'">
                  {{ lot.operatorName || "Work Lot" }}
                </span>
                <el-tag
                  size="small"
                  effect="plain"
                  :style="workStatusStyle(lot.status, lot.dueDate)"
                >
                  {{ lot.status }}
                </el-tag>
              </div>
              <div class="related-item-meta">
                Due <TimeText :value="lot.dueDate" mode="date" />
              </div>
            </button>
          </div>
          <el-empty
            v-else
            :image-size="60"
            :description="
              relatedWorkLots.length > 0
                ? 'No related work lots match filters'
                : 'No related work lots'
            "
          />
        </el-collapse-item>
      </el-collapse>
    </div>

    <div v-else-if="selectedPartOfSite" class="drawer-body">
      <el-collapse v-model="activeCollapse" class="info-collapse">
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

    <div v-else-if="selectedSection" class="drawer-body">
      <el-collapse v-model="activeCollapse" class="info-collapse">
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

    <div v-else-if="selectedIntLand" class="drawer-body">
      <el-collapse v-model="activeCollapse" class="info-collapse">
        <el-collapse-item name="basic" title="Basic Information">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ID</span>
              <span class="info-value">{{ selectedIntLand.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Source Layer</span>
              <span class="info-value">{{ selectedIntLand.layer }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Entity</span>
              <span class="info-value">{{ selectedIntLand.entity }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Area</span>
              <span class="info-value">{{ intLandAreaText }}</span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-drawer>
</template>

<script setup>
import TimeText from "../../../components/TimeText.vue";
import ConfirmDialog from "../../../components/ConfirmDialog.vue";
import SiteBoundaryProgress from "../../../components/SiteBoundaryProgress.vue";
import { siteBoundaryStatusStyle } from "../utils/siteBoundaryStatusStyle";
import { useMapDrawerState } from "./composables/useMapDrawerState";
import MapDrawerHeader from "./MapDrawerHeader.vue";

const props = defineProps({
  selectedWorkLot: { type: Object, default: null },
  selectedSiteBoundary: { type: Object, default: null },
  selectedPartOfSite: { type: Object, default: null },
  selectedSection: { type: Object, default: null },
  selectedIntLand: { type: Object, default: null },
  relatedWorkLots: { type: Array, default: () => [] },
  relatedSiteBoundaries: { type: Array, default: () => [] },
  relatedSections: { type: Array, default: () => [] },
  relatedPartOfSites: { type: Array, default: () => [] },
  workStatusStyle: { type: Function, required: true },
  workCategoryLabel: { type: Function, required: true },
  focusMapState: { type: Object, default: null },
  canEditWork: { type: Boolean, default: true },
  canEditSiteBoundary: { type: Boolean, default: true },
  canEditPartOfSite: { type: Boolean, default: true },
  canEditSection: { type: Boolean, default: true },
  canDeleteWork: { type: Boolean, default: true },
});

const emit = defineEmits([
  "close",
  "delete-work-lot",
  "edit-work-lot",
  "edit-site-boundary",
  "edit-part-of-site",
  "edit-section",
  "focus-map-work-lot",
  "focus-map-site-boundary",
  "focus-map-part-of-site",
  "focus-map-section",
  "focus-work-lot",
  "focus-site-boundary",
  "focus-part-of-site",
  "focus-section",
]);
const {
  isOpen,
  workLotHeaderTitle,
  siteBoundaryHeaderTitle,
  partOfSiteHeaderTitle,
  sectionHeaderTitle,
  isWorkLotFocusActive,
  isSiteBoundaryFocusActive,
  isPartOfSiteFocusActive,
  isSectionFocusActive,
  activeCollapse,
  showDeleteWorkLotConfirm,
  workLotDeleteMessage,
  workLotAreaText,
  intLandAreaText,
  siteBoundaryAreaText,
  partOfSiteAreaText,
  partOfSiteRawAreaText,
  partOfSiteOverlapAreaText,
  partOfSiteHasAdjustedArea,
  sectionAreaText,
  sectionRawAreaText,
  sectionOverlapAreaText,
  sectionHasAdjustedArea,
  siteBoundaryProgressPercent,
  RELATED_WORKLOT_DUE_OPTIONS,
  relatedWorkLotsKeyword,
  relatedWorkLotsStatusFilter,
  relatedWorkLotsDueFilter,
  relatedWorkLotStatusOptions,
  filteredRelatedWorkLots,
  requestDeleteWorkLot,
  handleConfirmDeleteWorkLot,
} = useMapDrawerState({ props, emit });
</script>

<style scoped src="./MapDrawer.css"></style>
