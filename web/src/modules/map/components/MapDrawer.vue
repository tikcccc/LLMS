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
          <div class="drawer-subtitle">{{ selectedWorkLot.id }} · {{ selectedWorkLot.type }}</div>
        </div>
        <div class="header-tags">
          <el-tag effect="plain" :style="workStatusStyle(selectedWorkLot.status)">
            {{ selectedWorkLot.status }}
          </el-tag>
        </div>
      </div>
      <div class="drawer-header" v-else-if="selectedLandLot">
        <div class="header-text">
          <div class="drawer-title">{{ selectedLandLot.lotNumber }}</div>
          <div class="drawer-subtitle">{{ selectedLandLot.id }}</div>
        </div>
        <div class="header-tags">
          <el-tag effect="plain" :style="landStatusStyle(selectedLandLot.status)">
            {{ selectedLandLot.status }}
          </el-tag>
        </div>
      </div>
    </template>

    <div v-if="selectedWorkLot" class="drawer-body">
      <!-- Basic Information -->
      <el-collapse v-model="activeCollapse" class="info-collapse">
        <el-collapse-item name="basic" title="Basic Information">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ID</span>
              <span class="info-value">{{ selectedWorkLot.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Type</span>
              <span class="info-value">{{ selectedWorkLot.type }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Updated</span>
              <span class="info-value"><TimeText :value="selectedWorkLot.updatedAt" /></span>
            </div>
            <div class="info-item">
              <span class="info-label">Updated By</span>
              <span class="info-value">{{ selectedWorkLot.updatedBy }}</span>
            </div>
          </div>
        </el-collapse-item>

      </el-collapse>

      <!-- Tasks Section -->
      <div class="section-divider"></div>
      <div class="task-section">
      <div class="section-header">
        <div>
          <h3 class="section-title">Tasks</h3>
          <div class="section-subtitle">
            {{ openTasks }} Open · {{ doneTasks }} Done · {{ overdueTasks }} Overdue
          </div>
        </div>
        <div class="section-actions">
          <el-button size="small" type="primary" @click="emit('open-add-task')">
            Add Task
          </el-button>
        </div>
      </div>

        <!-- Task List -->
        <div v-if="selectedTasks.length" class="task-list">
          <div v-for="task in selectedTasks" :key="task.id" class="task-card">
            <div class="task-card-main">
              <el-checkbox
                :model-value="task.status === 'Done'"
                @change="() => emit('toggle-task', task.id)"
                class="task-checkbox"
              >
                <span :class="{ 'task-done': task.status === 'Done' }">
                  {{ task.title }}
                </span>
              </el-checkbox>
              <div class="task-card-meta">
                <span class="task-assignee">{{ task.assignee }}</span>
                <span class="task-date">
                  <TimeText :value="task.dueDate" mode="date" />
                </span>
                <el-tag size="small" :type="task.status === 'Done' ? 'success' : 'info'" effect="plain">
                  {{ task.status }}
                </el-tag>
                <el-tag v-if="isOverdue(task)" size="small" type="danger" effect="plain">
                  Overdue
                </el-tag>
              </div>
            </div>
            <el-button 
              link 
              type="primary" 
              size="small" 
              @click="emit('select-task', task.id)"
            >
              Edit
            </el-button>
          </div>
        </div>
        <el-empty v-else description="No tasks yet" :image-size="80" />
      </div>

      <!-- Task Detail Modal -->
      <el-dialog 
        :model-value="showTaskDetail" 
        title="Edit Task" 
        width="90%"
        :modal="false"
        :close-on-press-escape="true"
        @close="emit('clear-task')"
      >
        <el-form :model="taskForm" label-width="100px" label-position="top">
          <el-form-item label="Title">
            <el-input v-model="taskForm.title" />
          </el-form-item>
          <el-form-item label="Assignee">
            <el-input v-model="taskForm.assignee" />
          </el-form-item>
          <el-form-item label="Due Date">
            <el-date-picker 
              v-model="taskForm.dueDate" 
              type="date" 
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="Description">
            <el-input
              v-model="taskForm.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              placeholder="Optional details"
            />
          </el-form-item>
          <el-form-item label="Status">
            <el-select v-model="taskForm.status" style="width: 100%">
              <el-option label="Open" value="Open" />
              <el-option label="Done" value="Done" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="emit('clear-task')">Cancel</el-button>
            <el-button type="danger" @click="emit('delete-task')">Delete</el-button>
            <el-button type="primary" @click="handleSaveTask">Save</el-button>
          </div>
        </template>
      </el-dialog>
    </div>

    <div v-else-if="selectedLandLot" class="drawer-body">
      <el-collapse v-model="activeCollapse" class="info-collapse">
        <el-collapse-item name="basic" title="Basic Information">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">ID</span>
              <span class="info-value">{{ selectedLandLot.id }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Status</span>
              <span class="info-value">{{ selectedLandLot.status }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Updated</span>
              <span class="info-value"><TimeText :value="selectedLandLot.updatedAt" /></span>
            </div>
            <div class="info-item">
              <span class="info-label">Updated By</span>
              <span class="info-value">{{ selectedLandLot.updatedBy }}</span>
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

const props = defineProps({
  selectedWorkLot: { type: Object, default: null },
  selectedLandLot: { type: Object, default: null },
  selectedTasks: { type: Array, required: true },
  selectedTask: { type: Object, default: null },
  taskForm: { type: Object, required: true },
  workStatusStyle: { type: Function, required: true },
  landStatusStyle: { type: Function, required: true },
  isOverdue: { type: Function, required: true },
});

const emit = defineEmits([
  "close",
  "open-add-task",
  "toggle-task",
  "select-task",
  "clear-task",
  "save-task",
  "delete-task",
]);

const isOpen = computed(() => !!props.selectedWorkLot || !!props.selectedLandLot);
const activeCollapse = ref(["basic"]);
const showTaskDetail = computed(() => !!props.selectedTask);
const openTasks = computed(() => props.selectedTasks.filter((task) => task.status !== "Done").length);
const doneTasks = computed(() => props.selectedTasks.filter((task) => task.status === "Done").length);
const overdueTasks = computed(() => props.selectedTasks.filter((task) => props.isOverdue(task)).length);

const handleSaveTask = () => {
  emit("save-task");
  emit("clear-task");
};

// Reset collapse state when drawer opens
watch(isOpen, (value) => {
  if (value) {
    activeCollapse.value = ["basic"];
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

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Collapse Sections */
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

/* Info Grid */
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

/* Section Divider */
.section-divider {
  height: 1px;
  background: var(--border);
  margin: 8px 0;
}

/* Task Section */
.task-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--ink);
}

.section-subtitle {
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Task List */
.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  background: #ffffff;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.task-card:hover {
  border-color: var(--accent);
  background: #f0fdfa;
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.task-card-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-checkbox {
  width: 100%;
}

.task-checkbox :deep(.el-checkbox__label) {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
}

.task-done {
  text-decoration: line-through;
  color: var(--muted);
}

.task-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  font-size: 11px;
  color: var(--muted);
  padding-left: 24px;
}

.task-assignee {
  font-weight: 500;
}

.task-date {
  color: var(--muted);
}

/* Dialog */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Responsive */
@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
