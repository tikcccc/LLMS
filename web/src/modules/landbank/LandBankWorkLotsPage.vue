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
        <el-select v-model="typeFilter" size="small" style="width: 140px">
          <el-option v-for="option in typeOptions" :key="option" :label="option" :value="option" />
        </el-select>
        <el-button type="primary" @click="exportExcel">Export Work Lots</el-button>
      </div>
    </div>

    <el-table :data="filteredWorkLots" height="calc(100vh - 260px)">
      <el-table-column prop="id" label="ID" width="150" />
      <el-table-column prop="operatorName" label="Operator" min-width="200" />
      <el-table-column prop="type" label="Type" width="120" />
      <el-table-column prop="status" label="Status" width="140" />
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

const workLotStore = useWorkLotStore();
const router = useRouter();

const workLots = computed(() => workLotStore.workLots);

const searchQuery = ref("");
const statusFilter = ref("All");
const typeFilter = ref("All");

const statusOptions = ["All", "Pending", "In-Progress", "Handover", "Difficult"];
const typeOptions = ["All", "Business", "Household"];

const filteredWorkLots = computed(() =>
  workLots.value.filter((lot) => {
    if (statusFilter.value !== "All" && lot.status !== statusFilter.value) return false;
    if (typeFilter.value !== "All" && lot.type !== typeFilter.value) return false;
    return fuzzyMatchAny(
      [lot.id, lot.operatorName, lot.type, lot.status, lot.updatedBy],
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
