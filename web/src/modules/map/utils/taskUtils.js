import { todayHongKong } from "../../../shared/utils/time";

export const isOverdue = (task) => {
  if (!task?.dueDate) return false;
  if (task.status === "Done") return false;
  const today = todayHongKong();
  return task.dueDate < today;
};

export const getWorkLotTaskAlert = (tasks, workLotId) => {
  const workTasks = tasks.filter((task) => task.workLotId === workLotId);
  if (workTasks.length === 0) return null;
  if (workTasks.some((task) => isOverdue(task))) return "overdue";
  if (workTasks.some((task) => task.status !== "Done")) return "inProgress";
  return "completed";
};
