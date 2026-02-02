import { defineStore } from "pinia";
import { nowIso } from "../shared/utils/time";
import { generateId } from "../shared/utils/id";

const seedTasks = () => [
  {
    id: "TASK-001",
    workLotId: "WL-2025-001",
    title: "Verify occupancy",
    assignee: "Field Staff",
    dueDate: "2026-02-10",
    status: "Open",
    createdAt: nowIso(),
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
    addTask(workLotId, title, assignee = "Field Staff") {
      this.tasks.push({
        id: generateId("TASK"),
        workLotId,
        title,
        assignee,
        dueDate: new Date().toISOString().slice(0, 10),
        status: "Open",
        createdAt: nowIso(),
      });
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
