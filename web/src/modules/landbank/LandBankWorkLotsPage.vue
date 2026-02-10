<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Land Bank · Work Lots</h2>
        <p class="muted">Inventory view of all work lots.</p>
      </div>
      <div class="actions">
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
        <el-button type="primary" @click="exportExcel">Export Work Lots</el-button>
      </div>
    </div>

    <el-table :data="filteredWorkLots" height="calc(100vh - 260px)">
      <el-table-column prop="id" label="ID" width="150" />
      <el-table-column prop="operatorName" label="Work Lot" min-width="200" />
      <el-table-column label="Category" min-width="190">
        <template #default="{ row }">
          {{ workCategoryLabel(row.category) }}
        </template>
      </el-table-column>
      <el-table-column prop="responsiblePerson" label="Responsible Person" min-width="160" />
      <el-table-column label="Due Date" width="130">
        <template #default="{ row }">
          <TimeText :value="row.dueDate" mode="date" />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="Status" width="170" />
      <el-table-column label="Updated At" min-width="180">
        <template #default="{ row }">
          <TimeText :value="row.updatedAt" />
        </template>
      </el-table-column>
      <el-table-column prop="updatedBy" label="Updated By" min-width="140" />
      <el-table-column label="" width="90" align="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewOnMap(row.id)">View</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { exportWorkLots } from "../../shared/utils/excel";
import { fuzzyMatchAny } from "../../shared/utils/search";
import TimeText from "../../components/TimeText.vue";
import {
  WORK_LOT_CATEGORIES,
  WORK_LOT_STATUSES,
  workLotCategoryLabel as toWorkLotCategoryLabel,
} from "../../shared/utils/worklot";

const workLotStore = useWorkLotStore();
const router = useRouter();

const workLots = computed(() => workLotStore.workLots);

const searchQuery = ref("");
const statusFilter = ref("All");
const categoryFilter = ref("All");

const statusOptions = ["All", ...WORK_LOT_STATUSES];
const categoryOptions = ["All", ...WORK_LOT_CATEGORIES.map((item) => item.value)];
const workCategoryLabel = (category) => toWorkLotCategoryLabel(category);

const filteredWorkLots = computed(() =>
  workLots.value.filter((lot) => {
    if (statusFilter.value !== "All" && lot.status !== statusFilter.value) return false;
    if (categoryFilter.value !== "All" && lot.category !== categoryFilter.value) return false;
    return fuzzyMatchAny(
      [
        lot.id,
        lot.operatorName,
        workCategoryLabel(lot.category),
        lot.responsiblePerson,
        lot.dueDate,
        lot.status,
        lot.updatedBy,
        lot.description,
        lot.remark,
      ],
      searchQuery.value
    );
  })
);

const exportExcel = () => {
  exportWorkLots(filteredWorkLots.value);
};

const viewOnMap = (workLotId) => {
  router.push({ path: "/map", query: { workLotId } });
};
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

.muted {
  color: var(--muted);
}
</style>
