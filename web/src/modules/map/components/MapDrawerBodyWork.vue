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
            <span class="info-value">{{ selectedWorkLot.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Category</span>
            <span class="info-value">{{ workCategoryLabel(selectedWorkLot.category) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Responsible Person</span>
            <span class="info-value">{{ selectedWorkLot.responsiblePerson || "—" }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Area</span>
            <span class="info-value">{{ workLotAreaText }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Due Date</span>
            <span class="info-value">
              <TimeText :value="selectedWorkLot.dueDate" mode="date" />
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Assess Date</span>
            <span class="info-value">
              <TimeText :value="selectedWorkLot.assessDate" mode="date" />
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Completion Date</span>
            <span class="info-value">
              <TimeText :value="selectedWorkLot.completionDate" mode="date" />
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Float (Months)</span>
            <span class="info-value">
              {{
                selectedWorkLot.floatMonths === null || selectedWorkLot.floatMonths === undefined
                  ? "—"
                  : selectedWorkLot.floatMonths
              }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Force Eviction</span>
            <span class="info-value">{{ selectedWorkLot.forceEviction ? "Yes" : "No" }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Operational Status</span>
            <span class="info-value">{{ selectedWorkLot.status }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Updated By</span>
            <span class="info-value">{{ selectedWorkLot.updatedBy || "—" }}</span>
          </div>
          <div class="info-item info-item-wide">
            <span class="info-label">Updated At</span>
            <span class="info-value">
              <TimeText :value="selectedWorkLot.updatedAt" />
            </span>
          </div>
        </div>
      </el-collapse-item>

      <el-collapse-item name="relatedSites" title="Related Sites">
        <div v-if="relatedSiteBoundaries.length > 0" class="related-list">
          <button
            v-for="site in relatedSiteBoundaries"
            :key="site.id"
            class="related-item"
            type="button"
            @click="emit('focus-site-boundary', site.id)"
          >
            <div class="related-item-head">
              <span class="related-item-title" :title="site.name || 'Site Boundary'">
                {{ site.name || "Site Boundary" }}
              </span>
              <el-tag
                size="small"
                effect="plain"
                :style="siteBoundaryStatusStyle(site.statusKey, site.overdue)"
              >
                {{ site.status || "Pending Clearance" }}
              </el-tag>
            </div>
            <div class="related-item-meta">
              Handover <TimeText :value="site.plannedHandoverDate" mode="date" />
            </div>
          </button>
        </div>
        <el-empty v-else :image-size="60" description="No related sites" />
      </el-collapse-item>

      <el-collapse-item name="description" title="Description">
        <div class="block-text">{{ selectedWorkLot.description || "—" }}</div>
      </el-collapse-item>

      <el-collapse-item name="remark" title="Remark">
        <div class="block-text">{{ selectedWorkLot.remark || "—" }}</div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
import TimeText from "../../../components/TimeText.vue";

defineProps({
  selectedWorkLot: { type: Object, required: true },
  relatedSiteBoundaries: { type: Array, default: () => [] },
  activeCollapse: { type: Array, default: () => [] },
  workCategoryLabel: { type: Function, required: true },
  workLotAreaText: { type: String, default: "—" },
  siteBoundaryStatusStyle: { type: Function, required: true },
});

const emit = defineEmits(["update:activeCollapse", "focus-site-boundary"]);
</script>
