import * as XLSX from "xlsx";
import { formatHongKong } from "./time";

const ensureXlsxName = (filename) => (filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);

const downloadExcel = (filename, headers, rows, sheetName = "Sheet1") => {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", ensureXlsxName(filename));
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function exportLandLots(landLots) {
  const headers = ["ID", "Lot Number", "Status", "Updated At", "Updated By"];
  const rows = landLots.map((lot) => [
    lot.id,
    lot.lotNumber,
    lot.status,
    formatHongKong(lot.updatedAt),
    lot.updatedBy,
  ]);
  downloadExcel("land-lots.xlsx", headers, rows, "LandLots");
}

export function exportWorkLots(workLots) {
  const headers = ["ID", "Operator", "Type", "Status", "Updated At", "Updated By"];
  const rows = workLots.map((lot) => [
    lot.id,
    lot.operatorName,
    lot.type,
    lot.status,
    formatHongKong(lot.updatedAt),
    lot.updatedBy,
  ]);
  downloadExcel("work-lots.xlsx", headers, rows, "WorkLots");
}

export function exportTasks(tasks) {
  const headers = ["ID", "Work Lot", "Title", "Assignee", "Due Date", "Status", "Created At"];
  const rows = tasks.map((task) => [
    task.id,
    task.workLotId,
    task.title,
    task.assignee,
    formatHongKong(task.dueDate, { mode: "date" }),
    task.status,
    formatHongKong(task.createdAt),
  ]);
  downloadExcel("tasks.xlsx", headers, rows, "Tasks");
}
