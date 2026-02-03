<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Land Bank · Land Lots</h2>
        <p class="muted">Inventory view of all land lots.</p>
      </div>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          size="small"
          placeholder="Search land lots"
          clearable
          style="width: 200px"
        />
        <el-select v-model="statusFilter" size="small" style="width: 140px">
          <el-option v-for="option in statusOptions" :key="option" :label="option" :value="option" />
        </el-select>
        <el-button type="primary" @click="exportExcel">Export Land Lots</el-button>
      </div>
    </div>

    <el-table :data="filteredLandLots" height="calc(100vh - 260px)">
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="lotNumber" label="Lot Number" min-width="220" />
      <el-table-column prop="status" label="Status" width="120" />
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
import { computed, ref } from "vue";
import { useLandLotStore } from "../../stores/useLandLotStore";
import { exportLandLots } from "../../shared/utils/excel";
import { fuzzyMatchAny } from "../../shared/utils/search";
import TimeText from "../../components/TimeText.vue";

const landLotStore = useLandLotStore();
landLotStore.seedIfEmpty();

const landLots = computed(() => landLotStore.landLots);

const searchQuery = ref("");
const statusFilter = ref("All");
const statusOptions = ["All", "Active", "Inactive"];

const filteredLandLots = computed(() =>
  landLots.value.filter((lot) => {
    if (statusFilter.value !== "All" && lot.status !== statusFilter.value) return false;
    return fuzzyMatchAny([lot.id, lot.lotNumber, lot.status, lot.updatedBy], searchQuery.value);
  })
);

const exportExcel = () => {
  exportLandLots(filteredLandLots.value);
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
