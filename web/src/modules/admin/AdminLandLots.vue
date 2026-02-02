<template>
  <section class="admin-page">
    <div class="admin-header">
      <div>
        <h2>Land Lots</h2>
        <p class="muted">Legal boundary reference layer.</p>
      </div>
      <div class="admin-actions">
        <el-button type="primary" @click="exportCsv">Export CSV</el-button>
      </div>
    </div>

    <el-table :data="landLots" height="calc(100vh - 220px)">
      <el-table-column prop="id" label="ID" width="140" />
      <el-table-column prop="lotNumber" label="Lot Number" min-width="220" />
      <el-table-column prop="status" label="Status" width="120" />
      <el-table-column prop="updatedAt" label="Updated At" min-width="180" />
      <el-table-column prop="updatedBy" label="Updated By" min-width="140" />
    </el-table>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useLandLotStore } from "../../stores/useLandLotStore";
import { exportLandLots } from "../../shared/utils/csv";

const landLotStore = useLandLotStore();
landLotStore.seedIfEmpty();

const landLots = computed(() => landLotStore.landLots);

const exportCsv = () => {
  exportLandLots(landLots.value);
};
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
