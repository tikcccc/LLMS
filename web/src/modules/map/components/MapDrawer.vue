<template>
  <el-drawer
    :model-value="isOpen"
    size="420px"
    :modal="false"
    :show-close="true"
    :close-on-press-escape="true"
    @close="emit('close')"
  >
    <template #header>
      <div class="drawer-header" v-if="selectedWorkLot">
        <div class="header-text">
          <div class="drawer-title">{{ selectedWorkLot.operatorName }}</div>
          <div class="drawer-subtitle">
            {{ selectedWorkLot.id }} · {{ workCategoryLabel(selectedWorkLot.category) }}
          </div>
        </div>
        <div class="header-tags">
          <el-tag effect="plain" :style="workStatusStyle(selectedWorkLot.status)">
            {{ selectedWorkLot.status }}
          </el-tag>
          <el-button
            v-if="canDeleteWork"
            class="delete-icon-btn"
            type="danger"
            text
            size="small"
            @click="requestDeleteWorkLot"
          >
            Delete
          </el-button>
        </div>
      </div>
      <div class="drawer-header" v-else-if="selectedSiteBoundary">
        <div class="header-text">
          <div class="drawer-title">{{ selectedSiteBoundary.name || "Site Boundary" }}</div>
          <div class="drawer-subtitle">{{ selectedSiteBoundary.id }}</div>
        </div>
        <div class="header-tags">
          <el-tag effect="plain">Site Boundary</el-tag>
        </div>
      </div>
      <div class="drawer-header" v-else-if="selectedIntLand">
        <div class="header-text">
          <div class="drawer-title">Drawing Layer</div>
          <div class="drawer-subtitle">{{ selectedIntLand.id }}</div>
        </div>
      </div>
    </template>

    <div v-if="selectedWorkLot" class="drawer-body">
      <el-collapse v-model="activeCollapse" class="info-collapse">
        <el-collapse-item name="basic" title="Basic Information">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ID</span>
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
              <span class="info-label">Due Date</span>
              <span class="info-value">
                <TimeText :value="selectedWorkLot.dueDate" mode="date" />
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
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

        <el-collapse-item name="description" title="Description">
          <div class="block-text">{{ selectedWorkLot.description || "—" }}</div>
        </el-collapse-item>

        <el-collapse-item name="remark" title="Remark">
          <div class="block-text">{{ selectedWorkLot.remark || "—" }}</div>
        </el-collapse-item>
      </el-collapse>

      <ConfirmDialog
        v-model="showDeleteWorkLotConfirm"
        title="Delete Work Lot"
        :message="workLotDeleteMessage"
        description="This action cannot be undone."
        confirm-text="Delete"
        confirm-type="danger"
        @confirm="handleConfirmDeleteWorkLot"
      />
    </div>

    <div v-else-if="selectedSiteBoundary" class="drawer-body">
      <el-collapse v-model="activeCollapse" class="info-collapse">
        <el-collapse-item name="basic" title="Basic Information">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ID</span>
              <span class="info-value">{{ selectedSiteBoundary.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Source Layer</span>
              <span class="info-value">{{ selectedSiteBoundary.layer }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Entity</span>
              <span class="info-value">{{ selectedSiteBoundary.entity }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Area</span>
              <span class="info-value">{{ siteBoundaryAreaText }}</span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div v-else-if="selectedIntLand" class="drawer-body">
      <el-collapse v-model="activeCollapse" class="info-collapse">
        <el-collapse-item name="basic" title="Basic Information">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ID</span>
              <span class="info-value">{{ selectedIntLand.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Source Layer</span>
              <span class="info-value">{{ selectedIntLand.layer }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Entity</span>
              <span class="info-value">{{ selectedIntLand.entity }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Area</span>
              <span class="info-value">{{ intLandAreaText }}</span>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import TimeText from "../../../components/TimeText.vue";
import ConfirmDialog from "../../../components/ConfirmDialog.vue";

const props = defineProps({
  selectedWorkLot: { type: Object, default: null },
  selectedSiteBoundary: { type: Object, default: null },
  selectedIntLand: { type: Object, default: null },
  workStatusStyle: { type: Function, required: true },
  workCategoryLabel: { type: Function, required: true },
  canDeleteWork: { type: Boolean, default: true },
});

const emit = defineEmits(["close", "delete-work-lot"]);

const isOpen = computed(
  () => !!props.selectedWorkLot || !!props.selectedSiteBoundary || !!props.selectedIntLand
);
const activeCollapse = ref(["basic", "description", "remark"]);
const showDeleteWorkLotConfirm = ref(false);

const workLotDeleteMessage = computed(() => {
  if (!props.selectedWorkLot) return "";
  return `Delete work lot ${props.selectedWorkLot.id}?`;
});

const intLandAreaText = computed(() => {
  const area = props.selectedIntLand?.area;
  if (!area || Number.isNaN(area)) return "—";
  const ha = area / 10000;
  return `${area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${ha.toFixed(2)} ha)`;
});

const siteBoundaryAreaText = computed(() => {
  const area = props.selectedSiteBoundary?.area;
  if (!area || Number.isNaN(area)) return "—";
  const ha = area / 10000;
  return `${area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${ha.toFixed(2)} ha)`;
});

const requestDeleteWorkLot = () => {
  showDeleteWorkLotConfirm.value = true;
};

const handleConfirmDeleteWorkLot = () => {
  emit("delete-work-lot");
};

watch(isOpen, (value) => {
  if (value) {
    activeCollapse.value = ["basic", "description", "remark"];
  }
});
</script>

<style scoped>
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drawer-subtitle {
  font-size: 12px;
  color: var(--muted);
}

.header-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.delete-icon-btn {
  font-weight: 600;
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-collapse {
  border: none;
  background: transparent;
}

.info-collapse :deep(.el-collapse-item__header) {
  background: #f8fafc;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 12px;
  font-weight: 600;
  font-size: 13px;
  line-height: 1.3;
  min-height: 36px;
  margin-bottom: 6px;
}

.info-collapse :deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

.info-collapse :deep(.el-collapse-item__content) {
  padding: 0 0 8px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 2px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item-wide {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 500;
}

.info-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
}

.block-text {
  font-size: 13px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  padding: 2px 4px;
}

@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
