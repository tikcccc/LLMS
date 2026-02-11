<template>
  <section class="page">
    <div class="header">
      <div class="header-copy">
        <h2>Work Lots</h2>
        <p class="muted">Inventory view of all work lots.</p>
      </div>
      <div class="toolbar">
        <div class="filters">
          <el-input
            v-model="searchQuery"
            size="small"
            placeholder="Search work lots"
            clearable
            style="width: 200px"
          />
          <el-select v-model="statusFilter" size="small" style="width: 140px">
            <el-option v-for="option in statusOptions" :key="option" :label="option" :value="option" />
          </el-select>
          <el-select v-model="categoryFilter" size="small" style="width: 200px">
            <el-option
              v-for="option in categoryOptions"
              :key="option"
              :label="option === 'All' ? 'All' : workCategoryLabel(option)"
              :value="option"
            />
          </el-select>
        </div>
        <div class="action-buttons">
          <el-button size="small" @click="openImportJsonPicker">Import JSON</el-button>
          <el-button
            size="small"
            type="primary"
            plain
            :disabled="selectedWorkLots.length === 0"
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
      :data="filteredWorkLots"
      height="calc(100vh - 260px)"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="46" fixed="left" />
      <el-table-column prop="id" label="System ID" width="150" fixed="left" />
      <el-table-column label="Related Lands" min-width="220">
        <template #default="{ row }">
          {{ relatedLandText(row) }}
        </template>
      </el-table-column>
      <el-table-column label="Name" min-width="200">
        <template #default="{ row }">
          {{ workLotName(row) }}
        </template>
      </el-table-column>
      <el-table-column label="Category" min-width="190">
        <template #default="{ row }">
          {{ workCategoryLabel(row.category) }}
        </template>
      </el-table-column>
      <el-table-column label="Area" width="170">
        <template #default="{ row }">
          {{ formatArea(row.area) }}
        </template>
      </el-table-column>
      <el-table-column prop="responsiblePerson" label="Responsible Person" min-width="160" />
      <el-table-column label="Assess Date" width="130">
        <template #default="{ row }">
          <TimeText :value="row.assessDate" mode="date" />
        </template>
      </el-table-column>
      <el-table-column label="Due Date" width="130">
        <template #default="{ row }">
          <TimeText :value="row.dueDate" mode="date" />
        </template>
      </el-table-column>
      <el-table-column label="Completion Date" width="140">
        <template #default="{ row }">
          <TimeText :value="row.completionDate" mode="date" />
        </template>
      </el-table-column>
      <el-table-column label="Float (Months)" width="120">
        <template #default="{ row }">
          {{
            row.floatMonths === null || row.floatMonths === undefined
              ? "—"
              : row.floatMonths
          }}
        </template>
      </el-table-column>
      <el-table-column label="Force Eviction" width="130">
        <template #default="{ row }">
          {{ row.forceEviction ? "Yes" : "No" }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="Operational Status" width="200" />
      <el-table-column label="Updated At" min-width="180">
        <template #default="{ row }">
          <TimeText :value="row.updatedAt" />
        </template>
      </el-table-column>
      <el-table-column prop="updatedBy" label="Updated By" min-width="140" />
      <el-table-column label="Actions" width="220" align="right" fixed="right">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button link type="primary" @click="viewOnMap(row.id)">View</el-button>
            <el-button link type="primary" @click="openEditDialog(row)">Edit</el-button>
            <el-button link type="danger" @click="requestDeleteWorkLot(row)">Delete</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <WorkLotDialog
      v-model="showEditDialog"
      title="Edit Work Lot"
      confirm-text="Save"
      :work-lot-id="editForm.id"
      :related-site-boundary-ids="editForm.relatedSiteBoundaryIds"
      :related-site-boundary-names="editRelatedSiteBoundaryNames"
      v-model:operatorName="editForm.operatorName"
      v-model:category="editForm.category"
      v-model:responsiblePerson="editForm.responsiblePerson"
      v-model:assessDate="editForm.assessDate"
      v-model:dueDate="editForm.dueDate"
      v-model:completionDate="editForm.completionDate"
      v-model:floatMonths="editForm.floatMonths"
      v-model:forceEviction="editForm.forceEviction"
      v-model:status="editForm.status"
      v-model:description="editForm.description"
      v-model:remark="editForm.remark"
      @confirm="saveEditWorkLot"
      @cancel="cancelEditWorkLot"
    />
    <ConfirmDialog
      v-model="showDeleteConfirm"
      title="Delete Work Lot"
      :message="deleteWorkLotMessage"
      description="This action cannot be undone."
      confirm-text="Delete"
      confirm-type="danger"
      @confirm="confirmDeleteWorkLot"
      @cancel="cancelDeleteWorkLot"
    />
    <input
      ref="importInputRef"
      class="hidden-file-input"
      type="file"
      accept=".geojson,.json,application/geo+json,application/json"
      @change="handleImportFileChange"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import WorkLotDialog from "../map/components/WorkLotDialog.vue";
import ConfirmDialog from "../../components/ConfirmDialog.vue";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useSiteBoundaryStore } from "../../stores/useSiteBoundaryStore";
import { useAuthStore } from "../../stores/useAuthStore";
import { fuzzyMatchAny } from "../../shared/utils/search";
import {
  downloadWorkLotGeojson,
  parseWorkLotGeojson,
} from "../../shared/utils/worklotGeojson";
import {
  REPORT_FORMAT_OPTIONS,
  exportWorkLotsReport,
} from "../../shared/utils/reportExport";
import { nowIso, todayHongKong } from "../../shared/utils/time";
import TimeText from "../../components/TimeText.vue";
import {
  WORK_LOT_CATEGORIES,
  WORK_LOT_STATUSES,
  workLotCategoryLabel as toWorkLotCategoryLabel,
} from "../../shared/utils/worklot";
import {
  createWorkLotEditForm,
  buildWorkLotUpdatePayload,
} from "../../shared/utils/workLotEdit";

const workLotStore = useWorkLotStore();
const siteBoundaryStore = useSiteBoundaryStore();
const authStore = useAuthStore();
const router = useRouter();

const workLots = computed(() => workLotStore.workLots);

const searchQuery = ref("");
const statusFilter = ref("All");
const categoryFilter = ref("All");
const selectedWorkLots = ref([]);
const importInputRef = ref(null);
const showEditDialog = ref(false);
const showDeleteConfirm = ref(false);
const pendingDeleteWorkLot = ref(null);
const editForm = ref(createWorkLotEditForm());
const reportFormatOptions = REPORT_FORMAT_OPTIONS;
const FLOAT_THRESHOLD_MONTHS = 3;

const statusOptions = ["All", ...WORK_LOT_STATUSES];
const categoryOptions = ["All", ...WORK_LOT_CATEGORIES.map((item) => item.value)];
const workCategoryLabel = (category) => toWorkLotCategoryLabel(category);
const siteBoundaryNameById = computed(() =>
  siteBoundaryStore.siteBoundaries.reduce((map, boundary) => {
    map.set(String(boundary.id).toLowerCase(), boundary.name || "");
    return map;
  }, new Map())
);
const relatedLandText = (lot) => {
  const related = Array.isArray(lot?.relatedSiteBoundaryIds) ? lot.relatedSiteBoundaryIds : [];
  if (!related.length) return "—";
  return related
    .map((id) => {
      const normalized = String(id).toLowerCase();
      return siteBoundaryNameById.value.get(normalized) || String(id);
    })
    .join(", ");
};
const workLotName = (lot) => {
  const name = String(lot?.operatorName || lot?.name || "").trim();
  return name || "—";
};
const formatArea = (area) => {
  const value = Number(area);
  if (!Number.isFinite(value) || value <= 0) return "—";
  const hectare = value / 10000;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${hectare.toFixed(
    2
  )} ha)`;
};

const filteredWorkLots = computed(() =>
  workLots.value.filter((lot) => {
    if (statusFilter.value !== "All" && lot.status !== statusFilter.value) return false;
    if (categoryFilter.value !== "All" && lot.category !== categoryFilter.value) return false;
    return fuzzyMatchAny(
      [
        lot.id,
        relatedLandText(lot),
        workLotName(lot),
        workCategoryLabel(lot.category),
        lot.responsiblePerson,
        lot.assessDate,
        lot.dueDate,
        lot.completionDate,
        lot.floatMonths,
        lot.forceEviction ? "Yes" : "No",
        lot.status,
        lot.updatedBy,
        lot.description,
        lot.remark,
        lot.area,
      ],
      searchQuery.value
    );
  })
);
const editRelatedSiteBoundaryNames = computed(() =>
  (Array.isArray(editForm.value.relatedSiteBoundaryIds)
    ? editForm.value.relatedSiteBoundaryIds
    : []
  ).map((id) => {
    const normalized = String(id).toLowerCase();
    return siteBoundaryNameById.value.get(normalized) || String(id);
  })
);
const deleteWorkLotMessage = computed(() => {
  const row = pendingDeleteWorkLot.value;
  if (!row) return "Delete this work lot?";
  const id = String(row.id || "").trim();
  const name = workLotName(row);
  return id ? `Delete work lot "${name}" (${id})?` : `Delete work lot "${name}"?`;
});

const exportReport = async (format = "excel") => {
  const selectedFormat = String(format || "excel");
  try {
    await exportWorkLotsReport({
      workLots: filteredWorkLots.value,
      siteBoundaries: siteBoundaryStore.siteBoundaries,
      format: selectedFormat,
      floatThresholdMonths: FLOAT_THRESHOLD_MONTHS,
    });
    ElMessage.success(`Work lots report exported (${selectedFormat.toUpperCase()}).`);
  } catch (error) {
    ElMessage.error(`Report export failed: ${error?.message || "unknown error."}`);
  }
};

const handleExportReportCommand = (format) => {
  exportReport(format);
};

const workLotCountText = (count) => (count === 1 ? "1 work lot" : `${count} work lots`);

const handleSelectionChange = (rows) => {
  selectedWorkLots.value = Array.isArray(rows) ? rows : [];
};

const exportSelectedJson = () => {
  if (!selectedWorkLots.value.length) {
    ElMessage.warning("Please select at least 1 work lot.");
    return;
  }
  downloadWorkLotGeojson(selectedWorkLots.value, "work-lots-selected.geojson");
  ElMessage.success(`Exported ${workLotCountText(selectedWorkLots.value.length)} to JSON.`);
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
    imported = parseWorkLotGeojson(JSON.parse(text));
  } catch (error) {
    ElMessage.error(`Import failed: ${error?.message || "invalid JSON format."}`);
    return;
  }

  try {
    await ElMessageBox.confirm(
      `Import ${workLotCountText(imported.length)} from "${file.name}"? This will replace current ${workLotCountText(workLots.value.length)}.`,
      "Import Work Lots JSON",
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

  workLotStore.replaceWorkLots(imported);
  selectedWorkLots.value = [];
  ElMessage.success(`Imported ${workLotCountText(imported.length)} from JSON.`);
};

const viewOnMap = (workLotId) => {
  router.push({ path: "/map", query: { workLotId } });
};

const openEditDialog = (row) => {
  editForm.value = createWorkLotEditForm(row);
  showEditDialog.value = true;
};

const cancelEditWorkLot = () => {
  showEditDialog.value = false;
};

const saveEditWorkLot = () => {
  const workLotId = String(editForm.value.id || "").trim();
  if (!workLotId) return;
  workLotStore.updateWorkLot(
    workLotId,
    buildWorkLotUpdatePayload(editForm.value, {
      workLotId,
      fallbackOperatorName: `Work Lot ${workLotId}`,
      updatedBy: authStore.roleName,
      updatedAt: nowIso(),
      defaultDueDate: todayHongKong(),
    })
  );
  showEditDialog.value = false;
  ElMessage.success("Work lot updated.");
};

const requestDeleteWorkLot = (row) => {
  pendingDeleteWorkLot.value = row || null;
  showDeleteConfirm.value = !!row;
};

const cancelDeleteWorkLot = () => {
  showDeleteConfirm.value = false;
  pendingDeleteWorkLot.value = null;
};

const confirmDeleteWorkLot = () => {
  const row = pendingDeleteWorkLot.value;
  const workLotId = String(row?.id || "").trim();
  if (!workLotId) {
    cancelDeleteWorkLot();
    return;
  }
  workLotStore.removeWorkLot(workLotId);
  selectedWorkLots.value = selectedWorkLots.value.filter(
    (item) => String(item?.id || "") !== workLotId
  );
  if (showEditDialog.value && String(editForm.value.id || "") === workLotId) {
    showEditDialog.value = false;
  }
  cancelDeleteWorkLot();
  ElMessage.success("Work lot deleted.");
};

onMounted(() => {
  siteBoundaryStore.ensureLoaded();
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
  flex: 1 1 520px;
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
