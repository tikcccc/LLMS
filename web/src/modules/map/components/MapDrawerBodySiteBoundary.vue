<template>
  <div class="drawer-body">
    <el-collapse
      :model-value="activeCollapse"
      class="info-collapse"
      @update:model-value="emit('update:activeCollapse', $event)"
    >
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
            :model-value="relatedWorkLotsKeyword"
            size="small"
            clearable
            placeholder="Search related work lots"
            @update:model-value="emit('update:relatedWorkLotsKeyword', $event)"
          />
          <el-select
            :model-value="relatedWorkLotsStatusFilter"
            size="small"
            @update:model-value="emit('update:relatedWorkLotsStatusFilter', $event)"
          >
            <el-option
              v-for="option in relatedWorkLotStatusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-select
            :model-value="relatedWorkLotsDueFilter"
            size="small"
            @update:model-value="emit('update:relatedWorkLotsDueFilter', $event)"
          >
            <el-option
              v-for="option in relatedWorkLotDueOptions"
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
              <span class="related-item-title" :title="lot.operatorName || 'Work Lot'">
                {{ lot.operatorName || "Work Lot" }}
              </span>
              <el-tag size="small" effect="plain" :style="workStatusStyle(lot.status, lot.dueDate)">
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
</template>

<script setup>
import TimeText from "../../../components/TimeText.vue";
import SiteBoundaryProgress from "../../../components/SiteBoundaryProgress.vue";

defineProps({
  selectedSiteBoundary: { type: Object, required: true },
  relatedWorkLots: { type: Array, default: () => [] },
  activeCollapse: { type: Array, default: () => [] },
  siteBoundaryAreaText: { type: String, default: "—" },
  siteBoundaryProgressPercent: { type: Number, default: 0 },
  siteBoundaryStatusStyle: { type: Function, required: true },
  workStatusStyle: { type: Function, required: true },
  relatedWorkLotsKeyword: { type: String, default: "" },
  relatedWorkLotsStatusFilter: { type: String, default: "ALL" },
  relatedWorkLotsDueFilter: { type: String, default: "ALL" },
  relatedWorkLotStatusOptions: { type: Array, default: () => [] },
  relatedWorkLotDueOptions: { type: Array, default: () => [] },
  filteredRelatedWorkLots: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "update:activeCollapse",
  "update:relatedWorkLotsKeyword",
  "update:relatedWorkLotsStatusFilter",
  "update:relatedWorkLotsDueFilter",
  "focus-work-lot",
]);
</script>
