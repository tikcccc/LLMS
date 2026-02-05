<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Land Bank · Test Layer</h2>
        <p class="muted">Inventory view of all test layer.</p>
      </div>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          size="small"
          placeholder="Search test layer"
          clearable
          style="width: 200px"
        />
        <el-select v-model="statusFilter" size="small" style="width: 140px">
          <el-option v-for="option in statusOptions" :key="option" :label="option" :value="option" />
        </el-select>
        <el-button type="primary" @click="exportExcel">Export Test Layer</el-button>
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
import { useLandLotStore } from "../../stores/useLandLotStore";
import { exportLandLots } from "../../shared/utils/excel";
import { fuzzyMatchAny } from "../../shared/utils/search";
import TimeText from "../../components/TimeText.vue";

const landLotStore = useLandLotStore();
landLotStore.seedIfEmpty();
const router = useRouter();

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

const viewOnMap = (landLotId) => {
  router.push({ path: "/map", query: { landLotId } });
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
