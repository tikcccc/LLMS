<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Land Bank · Site Boundaries</h2>
        <p class="muted">
          Land denominator for KPI and planned handover tracking.
        </p>
      </div>
      <div class="actions">
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
        <el-input-number
          v-model="floatThresholdMonths"
          size="small"
          :min="0"
          :max="24"
          :step="1"
          controls-position="right"
          style="width: 170px"
        />
        <el-button type="primary" @click="exportExcel">Export Site Boundaries</el-button>
      </div>
    </div>

    <el-table
      :data="filteredBoundaries"
      height="calc(100vh - 260px)"
      :empty-text="loading ? 'Loading…' : 'No data'"
    >
      <el-table-column prop="id" label="Land ID" width="170" />
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
          <div class="progress-cell">
            <el-progress
              :percentage="row.progressPercent"
              :status="row.overdue ? 'exception' : undefined"
              :stroke-width="10"
            />
            <span class="progress-meta">
              {{ row.completedOperators }}/{{ row.totalOperators }} operators
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="Related Work Lots" min-width="220">
        <template #default="{ row }">
          {{ relatedWorkLotText(row) }}
        </template>
      </el-table-column>
      <el-table-column label="Management Status" min-width="160">
        <template #default="{ row }">
          <el-tag :type="row.statusTagType" effect="light">
            {{ row.status }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="" width="90" align="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewOnMap(row.id)">View</el-button>
        </template>
      </el-table-column>
      <el-table-column label="" width="80" align="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEditDialog(row)">Edit</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="showEditDialog"
      title="Edit Site Boundary"
      width="520px"
      destroy-on-close
    >
      <el-form :model="editForm" label-position="top">
        <el-form-item label="Land ID">
          <el-input :model-value="editForm.id" disabled />
        </el-form-item>
        <el-form-item label="Name">
          <el-input v-model="editForm.name" placeholder="e.g. HKSTP No.1" />
        </el-form-item>
        <el-form-item label="Contract No.">
          <el-input v-model="editForm.contractNo" placeholder="Contract No." />
        </el-form-item>
        <el-form-item label="Future Use">
          <el-input v-model="editForm.futureUse" placeholder="Future use" />
        </el-form-item>
        <el-form-item label="Handover Date">
          <el-date-picker
            v-model="editForm.plannedHandoverDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Completion Date">
          <el-date-picker
            v-model="editForm.completionDate"
            type="date"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="Others">
          <el-input
            v-model="editForm.others"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 4 }"
            placeholder="Additional notes"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">Cancel</el-button>
        <el-button type="primary" @click="saveEditBoundary">Save</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import TimeText from "../../components/TimeText.vue";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useSiteBoundaryStore } from "../../stores/useSiteBoundaryStore";
import { exportSiteBoundaries } from "../../shared/utils/excel";
import { fuzzyMatchAny } from "../../shared/utils/search";
import {
  buildWorkLotsByBoundary,
  summarizeSiteBoundary,
} from "../../shared/utils/siteBoundary";

const router = useRouter();
const workLotStore = useWorkLotStore();
const siteBoundaryStore = useSiteBoundaryStore();

const searchQuery = ref("");
const statusFilter = ref("All");
const floatThresholdMonths = ref(3);
const loading = ref(false);
const showEditDialog = ref(false);
const editForm = ref({
  id: "",
  name: "",
  contractNo: "",
  futureUse: "",
  plannedHandoverDate: "",
  completionDate: "",
  others: "",
});

const statusOptions = [
  { label: "All", value: "All" },
  { label: "Pending Clearance", value: "PENDING_CLEARANCE" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Critical / Risk", value: "CRITICAL_RISK" },
  { label: "Handover Ready", value: "HANDOVER_READY" },
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
        floatThresholdMonths: floatThresholdMonths.value,
      }
    );
    const statusTagType =
      summary.statusKey === "HANDED_OVER" || summary.statusKey === "HANDOVER_READY"
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
      relatedWorkLotIds: relatedLots.map((lot) => String(lot.id)),
    };
  });
});

const relatedWorkLotText = (row) => {
  const related = Array.isArray(row?.relatedWorkLotIds) ? row.relatedWorkLotIds : [];
  return related.length ? related.join(", ") : "—";
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

const exportExcel = () => {
  exportSiteBoundaries(filteredBoundaries.value, workLotStore.workLots, {
    floatThresholdMonths: floatThresholdMonths.value,
  });
};

const openEditDialog = (row) => {
  editForm.value = {
    id: row.id,
    name: row.name || "",
    contractNo: row.contractNo || "",
    futureUse: row.futureUse || "",
    plannedHandoverDate: row.plannedHandoverDate || "",
    completionDate: row.completionDate || "",
    others: row.others || "",
  };
  showEditDialog.value = true;
};

const saveEditBoundary = () => {
  if (!editForm.value.id) return;
  siteBoundaryStore.updateSiteBoundary(editForm.value.id, {
    name: editForm.value.name,
    contractNo: editForm.value.contractNo,
    futureUse: editForm.value.futureUse,
    plannedHandoverDate: editForm.value.plannedHandoverDate,
    completionDate: editForm.value.completionDate,
    others: editForm.value.others,
  });
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
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.progress-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-meta {
  font-size: 11px;
  color: var(--muted);
}

.muted {
  color: var(--muted);
}
</style>
