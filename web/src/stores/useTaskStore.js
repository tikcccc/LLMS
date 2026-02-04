import { defineStore } from "pinia";
import { nowIso, todayHongKong } from "../shared/utils/time";
import { generateId } from "../shared/utils/id";
import { MOCK_USERS, getDefaultAssignee } from "../shared/mock/users";

const seedAssignees = MOCK_USERS.map((user) => user.name);

const seedTasks = () => [
  // WL-2025-001: 有逾期任務 (紅色)
  {
    id: "TASK-001",
    workLotId: "WL-2025-001",
    title: "Verify occupancy",
    assignee: seedAssignees[6],
    description: "",
    dueDate: "2026-01-15", // 逾期
    status: "Open",
    createdAt: nowIso(),
  },
  {
    id: "TASK-002",
    workLotId: "WL-2025-001",
    title: "Update site photos",
    assignee: seedAssignees[3],
    description: "",
    dueDate: "2026-02-10",
    status: "Open",
    createdAt: nowIso(),
  },
  
  // WL-2025-002: 所有任務已完成 (綠色)
  {
    id: "TASK-003",
    workLotId: "WL-2025-002",
    title: "Collect owner documents",
    assignee: seedAssignees[2],
    description: "",
    dueDate: "2026-01-18",
    status: "Done",
    createdAt: "2026-01-05T08:10:00Z",
  },
  {
    id: "TASK-004",
    workLotId: "WL-2025-002",
    title: "Verify boundaries",
    assignee: seedAssignees[8],
    description: "",
    dueDate: "2026-01-20",
    status: "Done",
    createdAt: "2026-01-06T09:00:00Z",
  },
  
  // WL-2025-003: 有進行中的任務 (黃色)
  {
    id: "TASK-005",
    workLotId: "WL-2025-003",
    title: "Safety inspection",
    assignee: seedAssignees[7],
    description: "",
    dueDate: "2026-02-25",
    status: "Open",
    createdAt: "2026-01-12T09:20:00Z",
  },
  
  // WL-2025-004: 有逾期任務 (紅色)
  {
    id: "TASK-006",
    workLotId: "WL-2025-004",
    title: "Resolve access issue",
    assignee: seedAssignees[5],
    description: "",
    dueDate: "2026-01-10", // 逾期
    status: "Open",
    createdAt: "2026-01-03T11:00:00Z",
  },
  {
    id: "TASK-007",
    workLotId: "WL-2025-004",
    title: "Contact property owner",
    assignee: seedAssignees[4],
    description: "",
    dueDate: "2026-01-20", // 逾期
    status: "Open",
    createdAt: "2026-01-05T10:00:00Z",
  },
  
  // WL-2025-005: 有進行中的任務 (黃色)
  {
    id: "TASK-008",
    workLotId: "WL-2025-005",
    title: "Boundary confirmation",
    assignee: seedAssignees[9],
    description: "",
    dueDate: "2026-02-20",
    status: "Open",
    createdAt: "2026-02-01T10:00:00Z",
  },
  
  // WL-2025-006: 有逾期任務 (紅色)
  {
    id: "TASK-009",
    workLotId: "WL-2025-006",
    title: "Structural assessment",
    assignee: seedAssignees[10],
    description: "",
    dueDate: "2026-01-25", // 逾期
    status: "Open",
    createdAt: "2026-01-10T08:00:00Z",
  },
  {
    id: "TASK-010",
    workLotId: "WL-2025-006",
    title: "Environmental check",
    assignee: seedAssignees[2],
    description: "",
    dueDate: "2026-02-15",
    status: "Open",
    createdAt: "2026-01-15T09:00:00Z",
  },
  
  // WL-2025-007: 沒有任務 (灰色)
  
  // WL-2025-008: 所有任務已完成 (綠色)
  {
    id: "TASK-011",
    workLotId: "WL-2025-008",
    title: "Final inspection",
    assignee: seedAssignees[1],
    description: "",
    dueDate: "2026-01-30",
    status: "Done",
    createdAt: "2026-01-20T10:00:00Z",
  },
  {
    id: "TASK-012",
    workLotId: "WL-2025-008",
    title: "Documentation complete",
    assignee: seedAssignees[11],
    description: "",
    dueDate: "2026-02-01",
    status: "Done",
    createdAt: "2026-01-25T11:00:00Z",
  },
  
  // WL-2025-009: 有進行中的任務 (黃色)
  {
    id: "TASK-013",
    workLotId: "WL-2025-009",
    title: "Tenant notification",
    assignee: seedAssignees[0],
    description: "",
    dueDate: "2026-02-28",
    status: "Open",
    createdAt: "2026-02-01T08:00:00Z",
  },
  {
    id: "TASK-014",
    workLotId: "WL-2025-009",
    title: "Schedule site visit",
    assignee: seedAssignees[6],
    description: "",
    dueDate: "2026-03-05",
    status: "Open",
    createdAt: "2026-02-02T09:00:00Z",
  },
  
  // WL-2025-010: 有逾期任務 (紅色)
  {
    id: "TASK-015",
    workLotId: "WL-2025-010",
    title: "Legal review",
    assignee: seedAssignees[3],
    description: "",
    dueDate: "2026-01-28", // 逾期
    status: "Open",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "TASK-016",
    workLotId: "WL-2025-010",
    title: "Compliance check",
    assignee: seedAssignees[8],
    description: "",
    dueDate: "2026-01-30", // 逾期
    status: "Open",
    createdAt: "2026-01-18T11:00:00Z",
  },
  {
    id: "TASK-017",
    workLotId: "WL-2025-010",
    title: "Risk assessment",
    assignee: seedAssignees[4],
    description: "",
    dueDate: "2026-02-10",
    status: "Open",
    createdAt: "2026-01-20T09:00:00Z",
  },
];

export const useTaskStore = defineStore("tasks", {
  state: () => ({
    tasks: [],
  }),
  actions: {
    seedIfEmpty() {
      if (this.tasks.length === 0) {
        this.tasks = seedTasks();
      }
    },
    addTask(workLotId, title, assignee = getDefaultAssignee("FIELD_STAFF"), options = {}) {
      const { dueDate, description = "" } = options || {};
      this.tasks.push({
        id: generateId("TASK"),
        workLotId,
        title,
        assignee,
        description,
        dueDate: dueDate || todayHongKong(),
        status: "Open",
        createdAt: nowIso(),
      });
    },
    updateTask(taskId, payload) {
      const index = this.tasks.findIndex((item) => item.id === taskId);
      if (index !== -1) {
        this.tasks[index] = { ...this.tasks[index], ...payload };
      }
    },
    removeTask(taskId) {
      this.tasks = this.tasks.filter((item) => item.id !== taskId);
    },
    toggleDone(taskId) {
      const task = this.tasks.find((item) => item.id === taskId);
      if (task) {
        task.status = task.status === "Open" ? "Done" : "Open";
      }
    },
  },
  persist: {
    key: "ND_LLM_V1_tasks",
  },
});
