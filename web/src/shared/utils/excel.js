import * as XLSX from "xlsx";
import { formatHongKong } from "./time";
import { workLotCategoryLabel } from "./worklot";

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

export function exportWorkLots(workLots) {
  const headers = [
    "ID",
    "Work Lot",
    "Category",
    "Responsible Person",
    "Due Date",
    "Status",
    "Description",
    "Remark",
    "Updated At",
    "Updated By",
  ];
  const rows = workLots.map((lot) => [
    lot.id,
    lot.operatorName,
    workLotCategoryLabel(lot.category),
    lot.responsiblePerson || "",
    formatHongKong(lot.dueDate, { mode: "date" }),
    lot.status,
    lot.description || "",
    lot.remark || "",
    formatHongKong(lot.updatedAt),
    lot.updatedBy,
  ]);
  downloadExcel("work-lots.xlsx", headers, rows, "WorkLots");
}

export function exportSiteBoundaries(boundaries) {
  const headers = ["ID", "Name", "Source Layer", "Entity", "Area (m²)", "Area (ha)"];
  const rows = boundaries.map((item) => {
    const area = Number(item.area) || 0;
    const ha = area / 10000;
    return [
      item.id,
      item.name,
      item.layer,
      item.entity,
      Math.round(area),
      ha.toFixed(2),
    ];
  });
  downloadExcel("site-boundaries.xlsx", headers, rows, "SiteBoundaries");
}
