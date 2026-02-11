<template>
  <el-drawer
    :model-value="isOpen"
    size="420px"
    :modal="false"
    :show-close="true"
    :close-on-press-escape="true"
    @close="emit('close')"
  >
    <template #header>
      <div class="drawer-header" v-if="selectedWorkLot">
        <div class="header-text">
          <div class="drawer-title">{{ selectedWorkLot.operatorName }}</div>
        </div>
        <div class="header-tags">
          <el-tag
            effect="plain"
            :style="workStatusStyle(selectedWorkLot.status, selectedWorkLot.dueDate)"
          >
            {{ selectedWorkLot.status }}
          </el-tag>
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
            @click="requestDeleteWorkLot"
          >
            Delete
          </el-button>
        </div>
      </div>
      <div class="drawer-header" v-else-if="selectedSiteBoundary">
        <div class="header-text">
          <div class="drawer-title">{{ selectedSiteBoundary.name || "Site Boundary" }}</div>
        </div>
        <div class="header-tags">
          <el-tag effect="plain">Site Boundary</el-tag>
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
      </div>
      <div class="drawer-header" v-else-if="selectedIntLand">
        <div class="header-text">
          <div class="drawer-title">Drawing Layer</div>
          <div class="drawer-subtitle">{{ selectedIntLand.id }}</div>
        </div>
      </div>
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
                <span class="related-item-title">{{ site.name || "Site Boundary" }}</span>
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
                <span class="related-item-title">{{ lot.operatorName || "Work Lot" }}</span>
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
import { computed, ref, watch } from "vue";
import TimeText from "../../../components/TimeText.vue";
import ConfirmDialog from "../../../components/ConfirmDialog.vue";
import SiteBoundaryProgress from "../../../components/SiteBoundaryProgress.vue";
import { todayHongKong } from "../../../shared/utils/time";
import { siteBoundaryStatusStyle } from "../utils/siteBoundaryStatusStyle";

const props = defineProps({
  selectedWorkLot: { type: Object, default: null },
  selectedSiteBoundary: { type: Object, default: null },
  selectedIntLand: { type: Object, default: null },
  relatedWorkLots: { type: Array, default: () => [] },
  relatedSiteBoundaries: { type: Array, default: () => [] },
  workStatusStyle: { type: Function, required: true },
  workCategoryLabel: { type: Function, required: true },
  canEditWork: { type: Boolean, default: true },
  canEditSiteBoundary: { type: Boolean, default: true },
  canDeleteWork: { type: Boolean, default: true },
});

const emit = defineEmits([
  "close",
  "delete-work-lot",
  "edit-work-lot",
  "edit-site-boundary",
  "focus-work-lot",
  "focus-site-boundary",
]);

const isOpen = computed(
  () => !!props.selectedWorkLot || !!props.selectedSiteBoundary || !!props.selectedIntLand
);
const defaultActiveCollapse = () => [
  "basic",
  "relatedSites",
  "relatedWorkLots",
  "description",
  "remark",
];
const activeCollapse = ref(defaultActiveCollapse());
const showDeleteWorkLotConfirm = ref(false);

const workLotDeleteMessage = computed(() => {
  if (!props.selectedWorkLot) return "";
  return `Delete work lot ${props.selectedWorkLot.id}?`;
});

const workLotAreaText = computed(() => {
  const area = Number(props.selectedWorkLot?.area);
  if (!Number.isFinite(area) || area <= 0) return "—";
  const ha = area / 10000;
  return `${area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${ha.toFixed(2)} ha)`;
});

const intLandAreaText = computed(() => {
  const area = props.selectedIntLand?.area;
  if (!area || Number.isNaN(area)) return "—";
  const ha = area / 10000;
  return `${area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${ha.toFixed(2)} ha)`;
});

const siteBoundaryAreaText = computed(() => {
  const area = props.selectedSiteBoundary?.area;
  if (!area || Number.isNaN(area)) return "—";
  const ha = area / 10000;
  return `${area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${ha.toFixed(2)} ha)`;
});

const siteBoundaryProgressPercent = computed(() => {
  const value = Number(props.selectedSiteBoundary?.handoverProgress);
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
});

const RELATED_WORKLOT_DUE_OPTIONS = [
  { label: "All Due Dates", value: "ALL" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "No Due Date", value: "NO_DUE_DATE" },
];

const relatedWorkLotsKeyword = ref("");
const relatedWorkLotsStatusFilter = ref("ALL");
const relatedWorkLotsDueFilter = ref("ALL");

const relatedWorkLotStatusOptions = computed(() => {
  const statuses = Array.from(
    new Set(props.relatedWorkLots.map((lot) => String(lot.status || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  return [{ label: "All Statuses", value: "ALL" }].concat(
    statuses.map((status) => ({ label: status, value: status }))
  );
});

const isYyyyMmDd = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

const filteredRelatedWorkLots = computed(() => {
  const keyword = relatedWorkLotsKeyword.value.trim().toLowerCase();
  const today = todayHongKong();
  return props.relatedWorkLots.filter((lot) => {
    if (
      relatedWorkLotsStatusFilter.value !== "ALL" &&
      String(lot.status || "") !== relatedWorkLotsStatusFilter.value
    ) {
      return false;
    }

    const dueDate = String(lot.dueDate || "").trim();
    if (relatedWorkLotsDueFilter.value === "OVERDUE") {
      if (!isYyyyMmDd(dueDate) || dueDate >= today) return false;
    }
    if (relatedWorkLotsDueFilter.value === "NO_DUE_DATE" && !!dueDate) {
      return false;
    }

    if (!keyword) return true;
    return [lot.id, lot.operatorName, lot.status, lot.dueDate]
      .map((value) => String(value || "").toLowerCase())
      .some((value) => value.includes(keyword));
  });
});

const resetRelatedWorkLotFilters = () => {
  relatedWorkLotsKeyword.value = "";
  relatedWorkLotsStatusFilter.value = "ALL";
  relatedWorkLotsDueFilter.value = "ALL";
};

const requestDeleteWorkLot = () => {
  showDeleteWorkLotConfirm.value = true;
};

const handleConfirmDeleteWorkLot = () => {
  emit("delete-work-lot");
};

watch(isOpen, (value) => {
  if (value) {
    activeCollapse.value = defaultActiveCollapse();
    resetRelatedWorkLotFilters();
  }
});

watch(
  () => props.selectedSiteBoundary?.id,
  () => {
    resetRelatedWorkLotFilters();
  }
);
</script>

<style scoped>
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-subtitle {
  font-size: 12px;
  color: var(--muted);
}

.header-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.delete-icon-btn {
  font-weight: 600;
}

.edit-icon-btn {
  font-weight: 600;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-collapse {
  border: none;
  background: transparent;
}

.info-collapse :deep(.el-collapse-item__header) {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.3;
  min-height: 36px;
  margin-bottom: 6px;
}

.info-collapse :deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

.info-collapse :deep(.el-collapse-item__content) {
  padding: 0 0 8px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 2px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item-wide {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}

.info-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
}

.block-text {
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  padding: 2px 4px;
}

.related-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 2px;
}

.related-filters {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 132px 128px;
  gap: 8px;
  padding: 0 2px;
  margin-bottom: 8px;
}

.related-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  text-align: left;
  background: #f8fafc;
  cursor: pointer;
}

.related-item:hover {
  border-color: rgba(15, 118, 110, 0.38);
  background: #f1f5f9;
}

.related-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.related-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.related-item-meta {
  margin-top: 2px;
  font-size: 11px;
  color: #64748b;
}

@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .related-filters {
    grid-template-columns: 1fr;
  }
}
</style>
