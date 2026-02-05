<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Tasks & Operations</h2>
        <p class="muted">Manage tasks across all work lots.</p>
      </div>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          size="small"
          placeholder="Search tasks"
          clearable
          style="width: 200px"
        />
        <el-select v-model="statusFilter" size="small" style="width: 140px">
          <el-option label="All" value="All" />
          <el-option label="Open" value="Open" />
          <el-option label="Done" value="Done" />
          <el-option label="Overdue" value="Overdue" />
        </el-select>
        <el-select v-model="assigneeFilter" size="small" style="width: 180px">
          <el-option
            v-for="option in assigneeOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <el-button type="primary" @click="exportExcel">Export Tasks</el-button>
      </div>
    </div>

    <el-table :data="filteredTasks" height="calc(100vh - 260px)">
      <el-table-column prop="title" label="Title" min-width="220" />
      <el-table-column prop="workLotId" label="Work Lot" width="160" />
      <el-table-column prop="assignee" label="Assignee" width="160" />
      <el-table-column label="Due Date" width="140">
        <template #default="{ row }">
          <TimeText :value="row.dueDate" mode="date" />
        </template>
      </el-table-column>
      <el-table-column prop="status" label="Status" width="120" />
      <el-table-column label="Created" min-width="180">
        <template #default="{ row }">
          <TimeText :value="row.createdAt" />
        </template>
      </el-table-column>
      <el-table-column label="" width="90" align="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewOnMap(row)">View</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { useTaskStore } from "../../stores/useTaskStore";
import { exportTasks } from "../../shared/utils/excel";
import { fuzzyMatchAny } from "../../shared/utils/search";
import { todayHongKong } from "../../shared/utils/time";
import TimeText from "../../components/TimeText.vue";
import { buildUserOptions } from "../../shared/mock/users";

const taskStore = useTaskStore();
taskStore.seedIfEmpty();
const router = useRouter();
const statusFilter = ref("All");
const assigneeFilter = ref("All");
const searchQuery = ref("");

const assigneeOptions = computed(() => {
  const baseOptions = buildUserOptions();
  const knownNames = new Set(baseOptions.map((option) => option.value));
  const extraNames = new Set(taskStore.tasks.map((task) => task.assignee).filter(Boolean));
  const extraOptions = Array.from(extraNames)
    .filter((name) => !knownNames.has(name))
    .map((name) => ({ label: name, value: name }));
  return [{ label: "All", value: "All" }, ...baseOptions, ...extraOptions];
});

const isOverdue = (task) => {
  if (!task?.dueDate) return false;
  if (task.status === "Done") return false;
  const today = todayHongKong();
  return task.dueDate < today;
};

const filteredTasks = computed(() =>
  taskStore.tasks.filter((task) => {
    if (statusFilter.value === "Overdue" && !isOverdue(task)) return false;
    if (statusFilter.value !== "All" && statusFilter.value !== "Overdue" && task.status !== statusFilter.value) {
      return false;
    }
    if (assigneeFilter.value !== "All" && task.assignee !== assigneeFilter.value) return false;
    return fuzzyMatchAny(
      [task.id, task.title, task.workLotId, task.assignee, task.status],
      searchQuery.value
    );
  })
);

const exportExcel = () => {
  exportTasks(filteredTasks.value);
};

const viewOnMap = (task) => {
  router.push({
    path: "/map",
    query: { workLotId: task.workLotId, taskId: task.id },
  });
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
