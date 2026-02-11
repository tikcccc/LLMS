<template>
  <section class="page">
    <div class="header">
      <div class="header-copy">
        <h2>Site Boundaries</h2>
        <p class="muted">
          Land denominator for KPI and planned handover tracking.
        </p>
      </div>
      <div class="toolbar">
        <div class="filters">
          <el-input
            v-model="searchQuery"
            size="small"
            placeholder="Search site boundaries"
            clearable
            style="width: 220px"
          />
          <el-select v-model="statusFilter" size="small" style="width: 170px">
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        <div class="action-buttons">
          <el-button size="small" @click="openImportJsonPicker">Import JSON</el-button>
          <el-button
            size="small"
            type="primary"
            plain
            @click="exportSelectedJson"
          >
            Export JSON
          </el-button>
          <el-dropdown trigger="click" @command="handleExportReportCommand">
            <el-button size="small" type="primary">
              Export Report
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in reportFormatOptions"
                  :key="option.value"
                  :command="option.value"
                >
                  {{ option.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <el-table
      :data="filteredBoundaries"
      height="calc(100vh - 260px)"
      :empty-text="loading ? 'Loading…' : 'No data'"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="46" fixed="left" />
      <el-table-column prop="id" label="System ID" width="170" fixed="left" />
      <el-table-column prop="name" label="Name" min-width="190" />
      <el-table-column label="Handover Date" width="140">
        <template #default="{ row }">
          <TimeText :value="row.plannedHandoverDate" mode="date" />
        </template>
      </el-table-column>
      <el-table-column label="Area" min-width="170">
        <template #default="{ row }">
          <div>{{ formatArea(row.area) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="contractNo" label="Contract No." min-width="150" />
      <el-table-column prop="futureUse" label="Future Use" min-width="160" />
      <el-table-column label="Progress" min-width="180">
        <template #default="{ row }">
          <SiteBoundaryProgress
            :percentage="row.progressPercent"
            :completed="row.completedOperators"
            :total="row.totalOperators"
            :status-key="row.statusKey"
            :overdue="row.overdue"
            :stroke-width="10"
          />
        </template>
      </el-table-column>
      <el-table-column label="Related Work Lots" min-width="220">
        <template #default="{ row }">
          <span v-if="relatedWorkLotNames(row).length === 0">—</span>
          <el-popover v-else trigger="hover" placement="top-start" :width="360">
            <template #reference>
              <button type="button" class="related-worklots-trigger">
                {{ relatedWorkLotSummary(row) }}
              </button>
            </template>
            <div class="related-worklots-popover">
              <div class="popover-title">
                {{ relatedWorkLotNames(row).length }} related work lots
              </div>
              <ul class="popover-list">
                <li v-for="name in relatedWorkLotNames(row)" :key="name">{{ name }}</li>
              </ul>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="Management Status" min-width="160">
        <template #default="{ row }">
          <el-tag :type="row.statusTagType" effect="light">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="170" align="right" fixed="right">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button link type="primary" @click="viewOnMap(row.id)">View</el-button>
            <el-button link type="primary" @click="openEditDialog(row)">Edit</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <input
      ref="importInputRef"
      class="hidden-file-input"
      type="file"
      accept=".json,application/json"
      @change="handleImportFileChange"
    />
    <SiteBoundaryDialog
      v-model="showEditDialog"
      title="Edit Site Boundary"
      confirm-text="Save"
      :boundary-id="String(editForm.id || '')"
      v-model:name="editForm.name"
      v-model:contractNo="editForm.contractNo"
      v-model:futureUse="editForm.futureUse"
      v-model:plannedHandoverDate="editForm.plannedHandoverDate"
      v-model:completionDate="editForm.completionDate"
      v-model:others="editForm.others"
      @confirm="saveEditBoundary"
      @cancel="cancelEditBoundary"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import TimeText from "../../components/TimeText.vue";
import SiteBoundaryProgress from "../../components/SiteBoundaryProgress.vue";
import SiteBoundaryDialog from "../map/components/SiteBoundaryDialog.vue";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useSiteBoundaryStore } from "../../stores/useSiteBoundaryStore";
import { fuzzyMatchAny } from "../../shared/utils/search";
import {
  downloadSiteBoundaryJson,
  parseSiteBoundaryJson,
} from "../../shared/utils/siteBoundaryJson";
import {
  REPORT_FORMAT_OPTIONS,
  exportSiteBoundariesReport,
} from "../../shared/utils/reportExport";
import {
  createSiteBoundaryEditForm,
  buildSiteBoundaryUpdatePayload,
} from "../../shared/utils/siteBoundaryEdit";
import {
  buildWorkLotsByBoundary,
  summarizeSiteBoundary,
} from "../../shared/utils/siteBoundary";

const router = useRouter();
const workLotStore = useWorkLotStore();
const siteBoundaryStore = useSiteBoundaryStore();
const FLOAT_THRESHOLD_MONTHS = 3;

const searchQuery = ref("");
const statusFilter = ref("All");
const loading = ref(false);
const showEditDialog = ref(false);
const selectedBoundaries = ref([]);
const importInputRef = ref(null);
const editForm = ref(createSiteBoundaryEditForm());
const reportFormatOptions = REPORT_FORMAT_OPTIONS;

const statusOptions = [
  { label: "All", value: "All" },
  { label: "Pending Clearance", value: "PENDING_CLEARANCE" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Critical / Risk", value: "CRITICAL_RISK" },
  { label: "Handed Over", value: "HANDED_OVER" },
];

const boundaries = computed(() => siteBoundaryStore.siteBoundaries);

const formatArea = (area) => {
  if (!area || Number.isNaN(area)) return "—";
  const ha = area / 10000;
  return `${area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${ha.toFixed(2)} ha)`;
};

const loadBoundaries = async () => {
  loading.value = true;
  try {
    await siteBoundaryStore.ensureLoaded();
  } catch (error) {
    console.warn("[site-boundary] load failed", error);
  } finally {
    loading.value = false;
  }
};

const enrichedBoundaries = computed(() => {
  const byBoundary = buildWorkLotsByBoundary(workLotStore.workLots);
  return boundaries.value.map((boundary) => {
    const relatedLots = byBoundary.get(String(boundary.id)) || [];
    const summary = summarizeSiteBoundary(
      boundary,
      relatedLots,
      {
        floatThresholdMonths: FLOAT_THRESHOLD_MONTHS,
      }
    );
    const statusTagType =
      summary.statusKey === "HANDED_OVER"
        ? "success"
        : summary.statusKey === "CRITICAL_RISK"
          ? "danger"
        : summary.statusKey === "IN_PROGRESS"
          ? "warning"
          : "info";
    return {
      ...boundary,
      ...summary,
      statusTagType,
      relatedWorkLotNames: relatedLots.map((lot) => lot.operatorName || String(lot.id)),
    };
  });
});

const relatedWorkLotText = (row) => {
  const related = Array.isArray(row?.relatedWorkLotNames) ? row.relatedWorkLotNames : [];
  return related.length ? related.join(", ") : "—";
};
const relatedWorkLotNames = (row) =>
  (Array.isArray(row?.relatedWorkLotNames) ? row.relatedWorkLotNames : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
const relatedWorkLotSummary = (row) => {
  const names = relatedWorkLotNames(row);
  if (!names.length) return "—";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
};

const filteredBoundaries = computed(() =>
  enrichedBoundaries.value.filter((item) => {
    if (statusFilter.value !== "All" && item.statusKey !== statusFilter.value) return false;
    return fuzzyMatchAny(
      [item.id, item.name, item.contractNo, item.futureUse, relatedWorkLotText(item)],
      searchQuery.value
    );
  })
);
const boundariesForExport = computed(() =>
  selectedBoundaries.value.length > 0 ? selectedBoundaries.value : filteredBoundaries.value
);
const hasSelectedBoundaries = computed(() => selectedBoundaries.value.length > 0);

const exportReport = async (format = "excel") => {
  const selectedFormat = String(format || "excel");
  const targets = boundariesForExport.value;
  if (!targets.length) {
    ElMessage.warning("No site boundaries to export.");
    return;
  }
  try {
    await exportSiteBoundariesReport({
      siteBoundaries: targets,
      workLots: workLotStore.workLots,
      format: selectedFormat,
      floatThresholdMonths: FLOAT_THRESHOLD_MONTHS,
    });
    const scopeLabel = hasSelectedBoundaries.value ? "selected" : "all listed";
    ElMessage.success(
      `Exported ${boundaryCountText(targets.length)} (${scopeLabel}) report as ${selectedFormat.toUpperCase()}.`
    );
  } catch (error) {
    ElMessage.error(`Report export failed: ${error?.message || "unknown error."}`);
  }
};

const handleExportReportCommand = (format) => {
  exportReport(format);
};

const boundaryCountText = (count) =>
  count === 1 ? "1 site boundary" : `${count} site boundaries`;

const handleSelectionChange = (rows) => {
  selectedBoundaries.value = Array.isArray(rows) ? rows : [];
};

const exportSelectedJson = () => {
  const targets = boundariesForExport.value;
  if (!targets.length) {
    ElMessage.warning("No site boundaries to export.");
    return;
  }
  const selectedMode = hasSelectedBoundaries.value;
  downloadSiteBoundaryJson(
    targets,
    selectedMode ? "site-boundaries-selected.json" : "site-boundaries.json"
  );
  ElMessage.success(
    `Exported ${boundaryCountText(targets.length)} (${selectedMode ? "selected" : "all listed"}) to JSON.`
  );
};

const resetImportInput = () => {
  if (importInputRef.value) {
    importInputRef.value.value = "";
  }
};

const openImportJsonPicker = () => {
  importInputRef.value?.click();
};

const isDialogCancel = (error) =>
  error === "cancel" ||
  error === "close" ||
  (error && typeof error === "object" && error.action === "cancel");

const handleImportFileChange = async (event) => {
  const file = event?.target?.files?.[0];
  resetImportInput();
  if (!file) return;

  let imported = [];
  try {
    const text = await file.text();
    imported = parseSiteBoundaryJson(JSON.parse(text));
  } catch (error) {
    ElMessage.error(`Import failed: ${error?.message || "invalid JSON format."}`);
    return;
  }

  try {
    await ElMessageBox.confirm(
      `Import ${boundaryCountText(imported.length)} from "${file.name}"? This will replace current ${boundaryCountText(boundaries.value.length)}.`,
      "Import Site Boundaries JSON",
      {
        type: "warning",
        confirmButtonText: "Import",
        cancelButtonText: "Cancel",
      }
    );
  } catch (error) {
    if (isDialogCancel(error)) return;
    ElMessage.error(`Import canceled: ${error?.message || "unknown error."}`);
    return;
  }

  siteBoundaryStore.mergeBoundaries(imported);
  selectedBoundaries.value = [];
  ElMessage.success(`Imported ${boundaryCountText(imported.length)} from JSON.`);
};

const openEditDialog = (row) => {
  editForm.value = createSiteBoundaryEditForm(row);
  showEditDialog.value = true;
};

const saveEditBoundary = () => {
  if (!editForm.value.id) return;
  siteBoundaryStore.updateSiteBoundary(
    editForm.value.id,
    buildSiteBoundaryUpdatePayload(editForm.value)
  );
  showEditDialog.value = false;
};

const cancelEditBoundary = () => {
  showEditDialog.value = false;
};

const viewOnMap = (siteBoundaryId) => {
  router.push({ path: "/map", query: { siteBoundaryId } });
};

onMounted(() => {
  loadBoundaries();
});
</script>

<style scoped>
.page {
  padding: 24px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.header-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f8fafc;
}

.filters {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  flex: 1 1 420px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 0 0 auto;
}

.muted {
  color: var(--muted);
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.related-worklots-trigger {
  border: 0;
  background: transparent;
  color: #334155;
  font: inherit;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.related-worklots-popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popover-title {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.popover-list {
  margin: 0;
  padding-left: 16px;
  max-height: 180px;
  overflow-y: auto;
  font-size: 12px;
  color: #334155;
}

.hidden-file-input {
  display: none;
}

@media (max-width: 1120px) {
  .toolbar {
    align-items: flex-start;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
