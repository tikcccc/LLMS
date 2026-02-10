import { defineStore } from "pinia";
import { nowIso, todayHongKong } from "../shared/utils/time";
import { generateId } from "../shared/utils/id";
import { getDefaultAssignee } from "../shared/mock/users";

export const useTaskStore = defineStore("tasks", {
  state: () => ({
    tasks: [],
  }),
  actions: {
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
    removeTasksByWorkLot(workLotId) {
      this.tasks = this.tasks.filter((item) => item.workLotId !== workLotId);
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
