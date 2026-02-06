<template>
  <aside class="left-panel">
    <el-tabs v-model="leftTabProxy" class="panel-tabs">
      <el-tab-pane label="Layers" name="layers">
        <div class="panel-section">
          <div class="panel-row">
            <span>Basemap</span>
            <el-switch v-model="showBasemapProxy" />
          </div>
          <div class="panel-row">
            <span>Labels (EN)</span>
            <el-switch v-model="showLabelsProxy" />
          </div>
          <div class="panel-row">
            <span>Drawing Layer</span>
            <el-switch v-model="showIntLandProxy" />
          </div>
          <div class="panel-row">
            <span>Site Boundary</span>
            <el-switch v-model="showSiteBoundaryProxy" />
          </div>
          <div class="panel-row">
            <span>Work Lots</span>
            <el-switch v-model="showWorkLotsProxy" />
          </div>
        </div>

        <div class="legend">
          <div class="legend-title">Work Lot Task Status</div>
          <div class="legend-item">
            <span class="swatch task-overdue"></span>
            Has Overdue Tasks
          </div>
          <div class="legend-item">
            <span class="swatch task-inprogress"></span>
            Has Open Tasks
          </div>
          <div class="legend-item">
            <span class="swatch task-completed"></span>
            All Tasks Completed
          </div>
          <div class="legend-item">
            <span class="swatch no-tasks"></span>
            No Tasks
          </div>
        </div>
      </el-tab-pane>

      <el-tab-pane label="Tasks" name="tasks">
        <div class="panel-section">
          <el-select v-model="taskFilterProxy" size="small" style="width: 140px">
            <el-option label="All" value="All" />
            <el-option label="Open" value="Open" />
            <el-option label="Done" value="Done" />
            <el-option label="Overdue" value="Overdue" />
          </el-select>
        </div>
        <div class="task-list-global">
          <button
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-card"
            type="button"
            @click="emit('focus-task', task)"
          >
            <div class="task-card-top">
              <span class="task-title">{{ task.title }}</span>
              <div class="task-tags">
                <el-tag size="small" :type="task.status === 'Done' ? 'success' : 'info'">
                  {{ task.status }}
                </el-tag>
                <el-tag v-if="isOverdue(task)" size="small" type="danger">Overdue</el-tag>
              </div>
            </div>
            <div class="task-card-meta">
              <span>{{ workLotName(task.workLotId) }}</span>
              <span>
                {{ task.assignee }} · <TimeText :value="task.dueDate" mode="date" />
              </span>
            </div>
          </button>
          <el-empty v-if="filteredTasks.length === 0" description="No tasks" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Work Lots" name="worklots">
        <div class="panel-section">
          <el-input v-model="workSearchProxy" placeholder="Search work lots" clearable />
        </div>
        <div class="list-scroll">
          <button
            v-for="lot in workLotResults"
            :key="lot.id"
            class="list-item"
            type="button"
            @click="emit('focus-work', lot.id)"
          >
            <div class="list-title-row">
              <span class="list-title">{{ lot.operatorName }}</span>
              <el-tag size="small" effect="plain" :style="workStatusStyle(lot.status)">
                {{ lot.status }}
              </el-tag>
            </div>
            <div class="list-meta">{{ lot.id }}</div>
          </button>
          <el-empty v-if="workLotResults.length === 0" description="No work lots" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="Search" name="search">
        <div class="panel-section">
          <el-input v-model="searchProxy" placeholder="Search work lots" clearable @keyup.enter="emit('search-enter')" />
        </div>
        <div class="search-results">
          <button
            v-for="result in searchResults"
            :key="result.id"
            class="search-item"
            type="button"
            @click="emit('focus-work', result.id)"
          >
            <div class="search-title">{{ result.operatorName }}</div>
            <div class="search-meta">{{ result.id }}</div>
          </button>
          <el-empty v-if="searchResults.length === 0" description="No results" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </aside>
</template>

<script setup>
import { computed } from "vue";
import TimeText from "../../../components/TimeText.vue";

const props = defineProps({
  leftTab: { type: String, required: true },
  taskFilter: { type: String, required: true },
  searchQuery: { type: String, required: true },
  workSearchQuery: { type: String, required: true },
  showBasemap: { type: Boolean, required: true },
  showLabels: { type: Boolean, required: true },
  showIntLand: { type: Boolean, required: true },
  showSiteBoundary: { type: Boolean, required: true },
  showWorkLots: { type: Boolean, required: true },
  filteredTasks: { type: Array, required: true },
  workLotResults: { type: Array, required: true },
  searchResults: { type: Array, required: true },
  workLotName: { type: Function, required: true },
  isOverdue: { type: Function, required: true },
  workStatusStyle: { type: Function, required: true },
});

const emit = defineEmits([
  "update:leftTab",
  "update:taskFilter",
  "update:searchQuery",
  "update:workSearchQuery",
  "update:showBasemap",
  "update:showLabels",
  "update:showIntLand",
  "update:showSiteBoundary",
  "update:showWorkLots",
  "focus-task",
  "focus-work",
  "search-enter",
]);

const leftTabProxy = computed({
  get: () => props.leftTab,
  set: (value) => emit("update:leftTab", value),
});
const taskFilterProxy = computed({
  get: () => props.taskFilter,
  set: (value) => emit("update:taskFilter", value),
});
const searchProxy = computed({
  get: () => props.searchQuery,
  set: (value) => emit("update:searchQuery", value),
});
const workSearchProxy = computed({
  get: () => props.workSearchQuery,
  set: (value) => emit("update:workSearchQuery", value),
});
const showBasemapProxy = computed({
  get: () => props.showBasemap,
  set: (value) => emit("update:showBasemap", value),
});
const showLabelsProxy = computed({
  get: () => props.showLabels,
  set: (value) => emit("update:showLabels", value),
});
const showIntLandProxy = computed({
  get: () => props.showIntLand,
  set: (value) => emit("update:showIntLand", value),
});
const showSiteBoundaryProxy = computed({
  get: () => props.showSiteBoundary,
  set: (value) => emit("update:showSiteBoundary", value),
});
const showWorkLotsProxy = computed({
  get: () => props.showWorkLots,
  set: (value) => emit("update:showWorkLots", value),
});
</script>

<style scoped>
.left-panel {
  position: absolute;
  top: 78px;
  left: 24px;
  width: 320px;
  max-height: calc(100% - 140px);
  background: var(--panel);
  border-radius: 16px;
  box-shadow: var(--shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 8px 12px 0 12px;
}

.panel-tabs :deep(.el-tabs__content) {
  padding: 8px 12px 16px 12px;
}

.panel-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.panel-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.legend {
  border-top: 1px solid var(--border);
  padding-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
}

.legend-title {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  border: 1px solid rgba(15, 23, 42, 0.2);
}

.swatch.task-overdue {
  background: rgba(239, 68, 68, 0.75);
  border: 2px solid #dc2626;
}

.swatch.task-inprogress {
  background: rgba(250, 204, 21, 0.75);
  border: 2px solid #eab308;
}

.swatch.task-completed {
  background: rgba(34, 197, 94, 0.75);
  border: 2px solid #16a34a;
}

.swatch.no-tasks {
  background: rgba(148, 163, 184, 0.6);
  border: 2px solid #64748b;
}

.task-list-global {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 280px;
  overflow-y: auto;
  padding-right: 4px;
}

.task-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: #f8fafc;
  text-align: left;
  cursor: pointer;
}

.task-card:hover {
  border-color: rgba(15, 118, 110, 0.4);
  background: #f1f5f9;
}

.task-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.task-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.task-title {
  font-size: 13px;
  font-weight: 600;
}

.task-card-meta {
  font-size: 11px;
  color: var(--muted);
  display: flex;
  justify-content: space-between;
}

.search-results,
.list-scroll {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}

.list-item,
.search-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 8px 10px;
  text-align: left;
  background: #f8fafc;
  cursor: pointer;
}

.list-item:hover,
.search-item:hover {
  border-color: rgba(15, 118, 110, 0.4);
  background: #f1f5f9;
}

.list-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.list-title,
.search-title {
  font-size: 13px;
  font-weight: 600;
}

.list-meta,
.search-meta {
  font-size: 11px;
  color: var(--muted);
}

@media (max-width: 900px) {
  .left-panel {
    width: calc(100% - 48px);
  }
}
</style>
