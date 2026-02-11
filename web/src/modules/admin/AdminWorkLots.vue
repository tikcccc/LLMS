<template>
  <section class="admin-page">
    <div class="admin-header">
      <div>
        <h2>Work Lots</h2>
        <p class="muted">Operational management layer.</p>
      </div>
      <div class="admin-actions">
        <el-button type="primary" @click="exportExcel">Export Excel</el-button>
      </div>
    </div>

    <el-table :data="workLots" height="calc(100vh - 220px)">
      <el-table-column prop="id" label="System ID" width="150" />
      <el-table-column label="Related Lands" min-width="220">
        <template #default="{ row }">
          {{ relatedLandText(row) }}
        </template>
      </el-table-column>
      <el-table-column prop="operatorName" label="Work Lot" min-width="190" />
      <el-table-column label="Category" min-width="180">
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
      <el-table-column prop="status" label="Operational Status" width="200" />
      <el-table-column label="Updated At" min-width="180">
        <template #default="{ row }">
          <TimeText :value="row.updatedAt" />
        </template>
      </el-table-column>
      <el-table-column prop="updatedBy" label="Updated By" min-width="140" />
    </el-table>
  </section>
</template>

<script setup>
import { computed, onMounted } from "vue";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useSiteBoundaryStore } from "../../stores/useSiteBoundaryStore";
import { exportWorkLots } from "../../shared/utils/excel";
import TimeText from "../../components/TimeText.vue";
import { workLotCategoryLabel as toWorkLotCategoryLabel } from "../../shared/utils/worklot";

const workLotStore = useWorkLotStore();
const siteBoundaryStore = useSiteBoundaryStore();

const workLots = computed(() => workLotStore.workLots);
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
const formatArea = (area) => {
  const value = Number(area);
  if (!Number.isFinite(value) || value <= 0) return "—";
  const hectare = value / 10000;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${hectare.toFixed(
    2
  )} ha)`;
};

const exportExcel = () => {
  exportWorkLots(workLots.value);
};

onMounted(() => {
  siteBoundaryStore.ensureLoaded();
});
</script>

<style scoped>
.admin-page {
  padding: 24px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.admin-header h2 {
  margin: 0 0 6px 0;
}

.muted {
  color: var(--muted);
  margin: 0;
}
</style>
