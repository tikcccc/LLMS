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
      <div class="drawer-header" v-else-if="selectedLandLot">
        <div class="header-text">
          <div class="drawer-title">{{ selectedLandLot.lotNumber }}</div>
          <div class="drawer-subtitle">{{ selectedLandLot.id }}</div>
        </div>
        <div class="header-tags">
          <el-tag effect="plain" :style="landStatusStyle(selectedLandLot.status)">
            {{ selectedLandLot.status }}
          </el-tag>
          <el-button
            v-if="canDeleteLand"
            class="delete-icon-btn"
            type="danger"
            text
            size="small"
            @click="requestDeleteLandLot"
          >
            Delete
          </el-button>
        </div>
      </div>
      <div class="drawer-header" v-else-if="selectedIntLand">
        <div class="header-text">
          <div class="drawer-title">INT Land</div>
          <div class="drawer-subtitle">{{ selectedIntLand.id }}</div>
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
          <div
            v-for="task in selectedTasks"
            :key="task.id"
            class="task-card"
            @click="handleViewTask(task.id)"
          >
            <div class="task-card-main">
              <div class="task-title" :class="{ 'task-done': task.status === 'Done' }">
                {{ task.title }}
              </div>
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
              @click.stop="handleViewTask(task.id)"
            >
              View
            </el-button>
          </div>
        </div>
        <el-empty v-else description="No tasks yet" :image-size="80" />
      </div>

      <!-- Task Detail Modal -->
      <el-dialog
        :model-value="showTaskDetail"
        title="Task Details"
        width="420px"
        :modal="true"
        :close-on-press-escape="true"
        @close="handleCloseDetail"
      >
        <div v-if="selectedTask" class="task-detail">
          <div class="detail-row">
            <span class="detail-label">Title</span>
            <span class="detail-value">{{ selectedTask.title }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Assignee</span>
            <span class="detail-value">{{ selectedTask.assignee }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Due Date</span>
            <span class="detail-value">
              <TimeText :value="selectedTask.dueDate" mode="date" />
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">
              <el-tag size="small" :type="selectedTask.status === 'Done' ? 'success' : 'info'" effect="plain">
                {{ selectedTask.status }}
              </el-tag>
              <el-tag v-if="isOverdue(selectedTask)" size="small" type="danger" effect="plain">
                Overdue
              </el-tag>
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Description</span>
            <span class="detail-value detail-description">
              {{ selectedTask.description || "—" }}
            </span>
          </div>
        </div>
        <template #footer>
          <div class="dialog-footer">
            <el-button @click="handleCloseDetail">Close</el-button>
            <el-button type="primary" @click="openEditTask">Edit</el-button>
          </div>
        </template>
      </el-dialog>

      <!-- Task Edit Modal -->
      <el-dialog
        :model-value="showTaskEdit"
        title="Edit Task"
        width="420px"
        :modal="true"
        :show-close="false"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <el-form :model="taskForm" label-width="100px" label-position="top">
          <el-form-item label="Title">
            <el-input v-model="taskForm.title" />
          </el-form-item>
          <el-form-item label="Assignee">
            <UserSelect v-model="taskForm.assignee" :options="assigneeOptions" />
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
            <el-button @click="requestCancelEdit">Cancel</el-button>
            <el-button type="danger" @click="requestDeleteTask">Delete</el-button>
            <el-button type="primary" @click="requestSaveTask">Save</el-button>
          </div>
        </template>
      </el-dialog>

      <ConfirmDialog
        v-model="showSaveConfirm"
        title="Save Changes"
        message="Save updates to this task?"
        description="Your changes will be applied immediately."
        confirm-text="Save"
        confirm-type="primary"
        @confirm="handleConfirmSave"
      />

      <ConfirmDialog
        v-model="showCancelConfirm"
        title="Discard Changes"
        message="Discard your edits?"
        description="Your unsaved changes will be lost."
        confirm-text="Discard"
        confirm-type="warning"
        @confirm="handleConfirmCancel"
      />

      <ConfirmDialog
        v-model="showDeleteConfirm"
        title="Delete Task"
        message="Delete this task?"
        description="This action cannot be undone."
        confirm-text="Delete"
        confirm-type="danger"
        @confirm="handleConfirmDelete"
      />

      <ConfirmDialog
        v-model="showDeleteWorkLotConfirm"
        title="Delete Work Lot"
        :message="workLotDeleteMessage"
        :description="workLotDeleteDescription"
        confirm-text="Delete"
        confirm-type="danger"
        @confirm="handleConfirmDeleteWorkLot"
      />
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

      <ConfirmDialog
        v-model="showDeleteLandLotConfirm"
        title="Delete Test Layer"
        :message="landLotDeleteMessage"
        description="This action cannot be undone."
        confirm-text="Delete"
        confirm-type="danger"
        @confirm="handleConfirmDeleteLandLot"
      />
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
import UserSelect from "../../../components/UserSelect.vue";
import ConfirmDialog from "../../../components/ConfirmDialog.vue";

const props = defineProps({
  selectedWorkLot: { type: Object, default: null },
  selectedLandLot: { type: Object, default: null },
  selectedIntLand: { type: Object, default: null },
  selectedTasks: { type: Array, required: true },
  selectedTask: { type: Object, default: null },
  taskForm: { type: Object, required: true },
  assigneeOptions: { type: Array, default: () => [] },
  workStatusStyle: { type: Function, required: true },
  landStatusStyle: { type: Function, required: true },
  isOverdue: { type: Function, required: true },
  canDeleteWork: { type: Boolean, default: true },
  canDeleteLand: { type: Boolean, default: true },
});

const emit = defineEmits([
  "close",
  "open-add-task",
  "view-task",
  "clear-task",
  "reset-task-form",
  "save-task",
  "delete-task",
  "delete-work-lot",
  "delete-land-lot",
]);

const isOpen = computed(
  () => !!props.selectedWorkLot || !!props.selectedLandLot || !!props.selectedIntLand
);
const activeCollapse = ref(["basic"]);
const showTaskDetail = ref(false);
const showTaskEdit = ref(false);
const showSaveConfirm = ref(false);
const showCancelConfirm = ref(false);
const showDeleteConfirm = ref(false);
const showDeleteWorkLotConfirm = ref(false);
const showDeleteLandLotConfirm = ref(false);
const openTasks = computed(() => props.selectedTasks.filter((task) => task.status !== "Done").length);
const doneTasks = computed(() => props.selectedTasks.filter((task) => task.status === "Done").length);
const overdueTasks = computed(() => props.selectedTasks.filter((task) => props.isOverdue(task)).length);
const totalTasks = computed(() => props.selectedTasks.length);
const hasOpenTasks = computed(() => openTasks.value > 0);

const workLotDeleteMessage = computed(() => {
  if (!props.selectedWorkLot) return "";
  if (hasOpenTasks.value) {
    return `This work lot has ${openTasks.value} open task(s). Delete anyway?`;
  }
  return `Delete work lot ${props.selectedWorkLot.id}?`;
});

const workLotDeleteDescription = computed(() => {
  if (!props.selectedWorkLot) return "";
  if (totalTasks.value > 0) {
    const overdueInfo = overdueTasks.value > 0 ? ` (${overdueTasks.value} overdue)` : "";
    return `Deleting will also remove ${totalTasks.value} task(s)${overdueInfo}.`;
  }
  return "This action cannot be undone.";
});

const landLotDeleteMessage = computed(() => {
  if (!props.selectedLandLot) return "";
  return `Delete test layer ${props.selectedLandLot.id}?`;
});

const intLandAreaText = computed(() => {
  const area = props.selectedIntLand?.area;
  if (!area || Number.isNaN(area)) return "—";
  const ha = area / 10000;
  return `${area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${ha.toFixed(2)} ha)`;
});

const handleViewTask = (taskId) => {
  emit("view-task", taskId);
};

let ignoreDetailClose = false;

const handleCloseDetail = () => {
  showTaskDetail.value = false;
  if (ignoreDetailClose) {
    ignoreDetailClose = false;
    return;
  }
  emit("clear-task");
};

const openEditTask = () => {
  emit("reset-task-form");
  if (showTaskDetail.value) {
    ignoreDetailClose = true;
    showTaskDetail.value = false;
  }
  showTaskEdit.value = true;
};

const requestCancelEdit = () => {
  showCancelConfirm.value = true;
};

const handleConfirmCancel = () => {
  emit("reset-task-form");
  showTaskEdit.value = false;
  if (props.selectedTask) {
    showTaskDetail.value = true;
  }
};

const requestSaveTask = () => {
  showSaveConfirm.value = true;
};

const handleConfirmSave = () => {
  emit("save-task");
  showTaskEdit.value = false;
  if (props.selectedTask) {
    showTaskDetail.value = true;
  }
};

const requestDeleteTask = () => {
  showDeleteConfirm.value = true;
};

const handleConfirmDelete = () => {
  emit("delete-task");
  showTaskEdit.value = false;
  showTaskDetail.value = false;
};

const requestDeleteWorkLot = () => {
  showDeleteWorkLotConfirm.value = true;
};

const handleConfirmDeleteWorkLot = () => {
  emit("delete-work-lot");
};

const requestDeleteLandLot = () => {
  showDeleteLandLotConfirm.value = true;
};

const handleConfirmDeleteLandLot = () => {
  emit("delete-land-lot");
};

// Reset collapse state when drawer opens
watch(isOpen, (value) => {
  if (value) {
    activeCollapse.value = ["basic"];
  }
});

watch(
  () => props.selectedTask,
  (task) => {
    if (task) {
      showTaskDetail.value = true;
      showTaskEdit.value = false;
    } else {
      showTaskDetail.value = false;
      showTaskEdit.value = false;
    }
  }
);
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

.delete-icon-btn {
  font-weight: 600;
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
  cursor: pointer;
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

.task-title {
  font-size: 13px;
  font-weight: 600;
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

/* Task Detail */
.task-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  align-items: start;
}

.detail-label {
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.detail-value {
  font-size: 13px;
  color: var(--ink);
}

.detail-description {
  white-space: pre-line;
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
