import * as XLSX from "xlsx";
import { formatHongKong } from "./time";
import {
  workLotCategoryCode,
} from "./worklot";
import {
  buildWorkLotsByBoundary,
  summarizeSiteBoundary,
} from "./siteBoundary";

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
    "System ID",
    "Related Lands",
    "Work Lot",
    "Operator Type",
    "Area (m2)",
    "Responsible Person",
    "Assess Date",
    "Due Date",
    "Completion Date",
    "Float (Months)",
    "Force Eviction",
    "Status",
    "Description",
    "Remark",
    "Updated At",
    "Updated By",
  ];
  const rows = workLots.map((lot) => [
    lot.id,
    (Array.isArray(lot.relatedSiteBoundaryIds) ? lot.relatedSiteBoundaryIds : []).join(", "),
    lot.operatorName,
    workLotCategoryCode(lot.category),
    Number.isFinite(Number(lot.area)) ? Number(lot.area).toFixed(2) : "",
    lot.responsiblePerson || "",
    formatHongKong(lot.assessDate, { mode: "date" }),
    formatHongKong(lot.dueDate, { mode: "date" }),
    formatHongKong(lot.completionDate, { mode: "date" }),
    lot.floatMonths ?? "",
    lot.forceEviction ? "Yes" : "No",
    lot.status,
    lot.description || "",
    lot.remark || "",
    formatHongKong(lot.updatedAt),
    lot.updatedBy,
  ]);
  downloadExcel("work-lots.xlsx", headers, rows, "WorkLots");
}

export function exportSiteBoundaries(
  boundaries,
  workLots = [],
  options = {}
) {
  const { floatThresholdMonths = 3 } = options;
  const headers = [
    "System ID",
    "Name",
    "Hectare",
    "BU/HH/GL",
    "Contract No.",
    "Future Use",
    "Assess Date",
    "Handover Date",
    "Completion Date",
    "Float (Months)",
    "Status",
    "Need Force Eviction",
    "Remarks",
    "Operator Progress",
    "Related Work Lots",
  ];
  const byBoundary = buildWorkLotsByBoundary(workLots);
  const rows = boundaries.map((item) => {
    const relatedLots = byBoundary.get(String(item.id)) || [];
    const summary = summarizeSiteBoundary(
      item,
      relatedLots,
      { floatThresholdMonths }
    );
    const area = Number(item.area) || 0;
    const hectare = area / 10000;
    const split = summary.categoryAreasHectare || { BU: 0, HH: 0, GL: 0 };
    const hectareText = `${hectare.toFixed(2)} (BU:${split.BU.toFixed(2)} / HH:${split.HH.toFixed(
      2
    )} / GL:${split.GL.toFixed(2)})`;
    const operatorMix = `BU:${summary.categoryCounts.BU} / HH:${summary.categoryCounts.HH} / GL:${summary.categoryCounts.GL}`;
    const assessDate =
      relatedLots
        .map((lot) => lot?.assessDate || "")
        .filter(Boolean)
        .sort()[0] || item.assessDate || "";
    return [
      item.id,
      item.name,
      hectareText,
      operatorMix,
      item.contractNo || "",
      item.futureUse || "",
      formatHongKong(assessDate, { mode: "date" }),
      formatHongKong(item.plannedHandoverDate, { mode: "date" }),
      formatHongKong(item.completionDate, { mode: "date" }),
      summary.minFloatMonths ?? "",
      summary.status,
      summary.requiresForceEviction ? "Yes" : "No",
      item.others || "",
      `${summary.completedOperators}/${summary.totalOperators} (${summary.progressPercent}%)`,
      relatedLots.map((lot) => String(lot.id)).join(", "),
    ];
  });
  downloadExcel("site-boundaries.xlsx", headers, rows, "SiteBoundaries");
}
