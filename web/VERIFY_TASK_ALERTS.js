// Quick verification script for task alert logic
// Run this in browser console to test

const tasks = [
  // WL-2025-001: 有逾期任務 (紅色)
  { id: "TASK-001", workLotId: "WL-2025-001", dueDate: "2026-01-15", status: "Open" },
  { id: "TASK-002", workLotId: "WL-2025-001", dueDate: "2026-02-10", status: "Open" },
  
  // WL-2025-002: 所有任務已完成 (綠色)
  { id: "TASK-003", workLotId: "WL-2025-002", dueDate: "2026-01-18", status: "Done" },
  { id: "TASK-004", workLotId: "WL-2025-002", dueDate: "2026-01-20", status: "Done" },
  
  // WL-2025-003: 有進行中的任務 (黃色)
  { id: "TASK-005", workLotId: "WL-2025-003", dueDate: "2026-02-25", status: "Open" },
  
  // WL-2025-004: 有逾期任務 (紅色)
  { id: "TASK-006", workLotId: "WL-2025-004", dueDate: "2026-01-10", status: "Open" },
  { id: "TASK-007", workLotId: "WL-2025-004", dueDate: "2026-01-20", status: "Open" },
  
  // WL-2025-005: 有進行中的任務 (黃色)
  { id: "TASK-008", workLotId: "WL-2025-005", dueDate: "2026-02-20", status: "Open" },
  
  // WL-2025-006: 有逾期任務 (紅色)
  { id: "TASK-009", workLotId: "WL-2025-006", dueDate: "2026-01-25", status: "Open" },
  { id: "TASK-010", workLotId: "WL-2025-006", dueDate: "2026-02-15", status: "Open" },
  
  // WL-2025-007: 沒有任務 (灰色) - no tasks
  
  // WL-2025-008: 所有任務已完成 (綠色)
  { id: "TASK-011", workLotId: "WL-2025-008", dueDate: "2026-01-30", status: "Done" },
  { id: "TASK-012", workLotId: "WL-2025-008", dueDate: "2026-02-01", status: "Done" },
  
  // WL-2025-009: 有進行中的任務 (黃色)
  { id: "TASK-013", workLotId: "WL-2025-009", dueDate: "2026-02-28", status: "Open" },
  { id: "TASK-014", workLotId: "WL-2025-009", dueDate: "2026-03-05", status: "Open" },
  
  // WL-2025-010: 有逾期任務 (紅色)
  { id: "TASK-015", workLotId: "WL-2025-010", dueDate: "2026-01-28", status: "Open" },
  { id: "TASK-016", workLotId: "WL-2025-010", dueDate: "2026-01-30", status: "Open" },
  { id: "TASK-017", workLotId: "WL-2025-010", dueDate: "2026-02-10", status: "Open" },
];

const todayHongKong = () => {
  const now = new Date();
  const hkTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Hong_Kong" }));
  return hkTime.toISOString().split("T")[0];
};

const isOverdue = (task) => {
  if (!task?.dueDate) return false;
  if (task.status === "Done") return false;
  const today = todayHongKong();
  return task.dueDate < today;
};

const getWorkLotTaskAlert = (workLotId) => {
  const workLotTasks = tasks.filter((task) => task.workLotId === workLotId);
  if (workLotTasks.length === 0) return null;
  
  const hasOverdue = workLotTasks.some((task) => isOverdue(task));
  if (hasOverdue) return "overdue";
  
  const allCompleted = workLotTasks.every((task) => task.status === "Done");
  if (allCompleted) return "completed";
  
  const hasOpenTasks = workLotTasks.some((task) => task.status !== "Done");
  if (hasOpenTasks) return "inProgress";
  
  return null;
};

console.log("Today (HK):", todayHongKong());
console.log("\nExpected Results:");
console.log("WL-2025-001:", getWorkLotTaskAlert("WL-2025-001"), "- Expected: overdue (紅色)");
console.log("WL-2025-002:", getWorkLotTaskAlert("WL-2025-002"), "- Expected: completed (綠色)");
console.log("WL-2025-003:", getWorkLotTaskAlert("WL-2025-003"), "- Expected: inProgress (黃色)");
console.log("WL-2025-004:", getWorkLotTaskAlert("WL-2025-004"), "- Expected: overdue (紅色)");
console.log("WL-2025-005:", getWorkLotTaskAlert("WL-2025-005"), "- Expected: inProgress (黃色)");
console.log("WL-2025-006:", getWorkLotTaskAlert("WL-2025-006"), "- Expected: overdue (紅色)");
console.log("WL-2025-007:", getWorkLotTaskAlert("WL-2025-007"), "- Expected: null (灰色)");
console.log("WL-2025-008:", getWorkLotTaskAlert("WL-2025-008"), "- Expected: completed (綠色)");
console.log("WL-2025-009:", getWorkLotTaskAlert("WL-2025-009"), "- Expected: inProgress (黃色)");
console.log("WL-2025-010:", getWorkLotTaskAlert("WL-2025-010"), "- Expected: overdue (紅色)");
