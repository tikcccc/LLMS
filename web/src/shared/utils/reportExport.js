import * as XLSX from "xlsx";
import { formatHongKong } from "./time";
import { workLotCategoryCode } from "./worklot";
import { buildWorkLotsByBoundary, summarizeSiteBoundary } from "./siteBoundary";

const DEFAULT_FLOAT_THRESHOLD_MONTHS = 3;
const PDF_PAGE_WIDTH = 842;
const PDF_MARGIN = 40;

export const REPORT_FORMAT_OPTIONS = [
  { label: "Excel (.xlsx)", value: "excel" },
  { label: "PDF (.pdf)", value: "pdf" },
];

const normalizeFormat = (value) => {
  const format = String(value || "").trim().toLowerCase();
  return format === "pdf" ? "pdf" : "excel";
};

const normalizeId = (value) => String(value || "").trim().toLowerCase();

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const toPercent = (numerator, denominator) =>
  denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

const formatPercent = (value) => `${Math.round(Number(value) || 0)}%`;

const formatAreaSqmText = (value) => {
  const area = toNumber(value);
  return area.toLocaleString(undefined, { maximumFractionDigits: 0 });
};

const formatAreaHaText = (value) => {
  const area = toNumber(value);
  return (area / 10000).toFixed(2);
};

const formatDate = (value) => formatHongKong(value, { mode: "date" });

const formatDateTime = (value) => formatHongKong(value);

const toYesNo = (value) => (value ? "Yes" : "No");

const toRelatedBoundaryIds = (lot) => {
  if (!lot) return [];
  const values = Array.isArray(lot.relatedSiteBoundaryIds)
    ? lot.relatedSiteBoundaryIds
    : [lot.siteBoundaryId];
  return values.map((value) => String(value || "").trim()).filter(Boolean);
};

const buildBoundaryNameMap = (siteBoundaries = []) =>
  siteBoundaries.reduce((map, boundary) => {
    const key = normalizeId(boundary?.id);
    if (key) {
      map.set(key, String(boundary?.name || boundary?.id || "").trim());
    }
    return map;
  }, new Map());

const relatedBoundaryNamesText = (lot, boundaryNameById) => {
  const names = toRelatedBoundaryIds(lot)
    .map((id) => {
      const key = normalizeId(id);
      return boundaryNameById.get(key) || id;
    })
    .filter(Boolean);
  return names.join(", ");
};

const resolveBoundariesForWorkLots = (workLots = [], siteBoundaries = []) => {
  const scopeIds = new Set();
  workLots.forEach((lot) => {
    toRelatedBoundaryIds(lot).forEach((id) => scopeIds.add(normalizeId(id)));
  });

  if (!scopeIds.size) return Array.isArray(siteBoundaries) ? siteBoundaries : [];

  const scoped = (Array.isArray(siteBoundaries) ? siteBoundaries : []).filter((boundary) =>
    scopeIds.has(normalizeId(boundary?.id))
  );
  return scoped.length ? scoped : siteBoundaries;
};

const buildBoundarySummaries = (siteBoundaries = [], workLots = [], floatThresholdMonths) => {
  const byBoundary = buildWorkLotsByBoundary(workLots);
  const threshold =
    Number.isFinite(Number(floatThresholdMonths)) && Number(floatThresholdMonths) >= 0
      ? Number(floatThresholdMonths)
      : DEFAULT_FLOAT_THRESHOLD_MONTHS;

  return siteBoundaries.map((boundary) => {
    const relatedLots = byBoundary.get(String(boundary?.id || "").trim()) || [];
    const summary = summarizeSiteBoundary(boundary, relatedLots, {
      floatThresholdMonths: threshold,
    });
    return {
      boundary,
      summary,
      relatedLots,
    };
  });
};

const buildOverview = (siteBoundaries = [], workLots = [], floatThresholdMonths) => {
  const summaries = buildBoundarySummaries(siteBoundaries, workLots, floatThresholdMonths);
  const totalLand = summaries.length;
  const handoverCount = summaries.filter((item) => item.summary.handoverCompleted).length;
  const forceEvictionCount = summaries.filter((item) => item.summary.requiresForceEviction).length;
  const lowFloatCount = summaries.filter((item) => item.summary.hasLowFloat).length;

  return {
    totalLand,
    handoverCount,
    forceEvictionCount,
    lowFloatCount,
    handoverRate: toPercent(handoverCount, totalLand),
    forceEvictionRate: toPercent(forceEvictionCount, totalLand),
    lowFloatRate: toPercent(lowFloatCount, totalLand),
    floatThresholdMonths:
      Number.isFinite(Number(floatThresholdMonths)) && Number(floatThresholdMonths) >= 0
        ? Number(floatThresholdMonths)
        : DEFAULT_FLOAT_THRESHOLD_MONTHS,
  };
};

const buildOverviewRows = ({
  reportTitle,
  exportScope,
  recordLabel,
  recordCount,
  generatedAt,
  overview,
}) => [
  ["Report", reportTitle],
  ["Export Scope", exportScope],
  ["Generated At", generatedAt],
  [recordLabel, recordCount],
  ["KPI Denominator", `${overview.totalLand} site boundaries`],
  [],
  ["Overview KPI", "Rate", "Count"],
  ["% Land Handover", formatPercent(overview.handoverRate), `${overview.handoverCount}/${overview.totalLand}`],
  [
    "% Land Need Force Eviction",
    formatPercent(overview.forceEvictionRate),
    `${overview.forceEvictionCount}/${overview.totalLand}`,
  ],
  [
    `% Land with Float < ${overview.floatThresholdMonths} Months`,
    formatPercent(overview.lowFloatRate),
    `${overview.lowFloatCount}/${overview.totalLand}`,
  ],
];

const toXlsxFilename = (filename) => (filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);

const toPdfFilename = (filename) => (filename.endsWith(".pdf") ? filename : `${filename}.pdf`);

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const downloadWorkbook = ({ filename, overviewRows, detailHeaders, detailRows }) => {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(overviewRows), "Overview");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]),
    "Details"
  );

  const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(blob, toXlsxFilename(filename));
};

const drawPdfHeader = (doc, title, generatedAt) => {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, PDF_MARGIN, 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Generated at: ${generatedAt}`, PDF_MARGIN, 50);
  return 64;
};

const drawPdfOverview = (doc, overview, yStart) => {
  const lines = [
    `% Land Handover: ${formatPercent(overview.handoverRate)} (${overview.handoverCount}/${overview.totalLand})`,
    `% Land Need Force Eviction: ${formatPercent(overview.forceEvictionRate)} (${overview.forceEvictionCount}/${overview.totalLand})`,
    `% Land with Float < ${overview.floatThresholdMonths} Months: ${formatPercent(overview.lowFloatRate)} (${overview.lowFloatCount}/${overview.totalLand})`,
  ];
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  lines.forEach((line, index) => {
    doc.text(line, PDF_MARGIN, yStart + index * 14);
  });
  return yStart + lines.length * 14 + 8;
};

const loadPdfModules = async () => {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  return { jsPDF, autoTable };
};

const downloadPdf = async ({ filename, title, generatedAt, overview, headers, rows }) => {
  const { jsPDF, autoTable } = await loadPdfModules();
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });

  const afterHeaderY = drawPdfHeader(doc, title, generatedAt);
  const tableStartY = drawPdfOverview(doc, overview, afterHeaderY);

  autoTable(doc, {
    startY: tableStartY,
    head: [headers],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      textColor: [31, 41, 55],
    },
    headStyles: {
      fillColor: [15, 118, 110],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    tableWidth: PDF_PAGE_WIDTH - PDF_MARGIN * 2,
  });

  doc.save(toPdfFilename(filename));
};

const toWorkLotReportRows = (workLots = [], siteBoundaries = []) => {
  const boundaryNameById = buildBoundaryNameMap(siteBoundaries);
  return workLots.map((lot) => {
    const areaSqm = toNumber(lot?.area);
    return [
      String(lot?.id || ""),
      String(lot?.operatorName || lot?.name || ""),
      relatedBoundaryNamesText(lot, boundaryNameById),
      workLotCategoryCode(lot?.category),
      formatAreaSqmText(areaSqm),
      formatAreaHaText(areaSqm),
      String(lot?.responsiblePerson || ""),
      formatDate(lot?.assessDate),
      formatDate(lot?.dueDate),
      formatDate(lot?.completionDate),
      lot?.floatMonths ?? "",
      toYesNo(!!lot?.forceEviction),
      String(lot?.status || ""),
      formatDateTime(lot?.updatedAt),
      String(lot?.updatedBy || ""),
      String(lot?.description || ""),
      String(lot?.remark || ""),
    ];
  });
};

const toSiteBoundaryReportRows = (
  siteBoundaries = [],
  workLots = [],
  floatThresholdMonths = DEFAULT_FLOAT_THRESHOLD_MONTHS
) => {
  const byBoundary = buildWorkLotsByBoundary(workLots);
  return siteBoundaries.map((boundary) => {
    const relatedLots = byBoundary.get(String(boundary?.id || "").trim()) || [];
    const summary = summarizeSiteBoundary(boundary, relatedLots, {
      floatThresholdMonths,
    });
    const areaSqm = toNumber(boundary?.area);
    return [
      String(boundary?.id || ""),
      String(boundary?.name || ""),
      formatAreaSqmText(areaSqm),
      formatAreaHaText(areaSqm),
      String(boundary?.contractNo || ""),
      String(boundary?.futureUse || ""),
      formatDate(boundary?.plannedHandoverDate),
      formatDate(boundary?.completionDate),
      String(summary.status || ""),
      `${summary.completedOperators}/${summary.totalOperators} (${summary.progressPercent}%)`,
      toYesNo(summary.requiresForceEviction),
      summary.minFloatMonths ?? "",
      relatedLots.map((lot) => String(lot?.operatorName || lot?.id || "")).join(", "),
      String(boundary?.others || ""),
    ];
  });
};

export async function exportWorkLotsReport({
  workLots = [],
  siteBoundaries = [],
  format = "excel",
  floatThresholdMonths = DEFAULT_FLOAT_THRESHOLD_MONTHS,
} = {}) {
  const normalizedFormat = normalizeFormat(format);
  const exportedWorkLots = Array.isArray(workLots) ? workLots : [];
  const availableBoundaries = Array.isArray(siteBoundaries) ? siteBoundaries : [];
  const scopedBoundaries = resolveBoundariesForWorkLots(exportedWorkLots, availableBoundaries);
  const overview = buildOverview(scopedBoundaries, exportedWorkLots, floatThresholdMonths);
  const generatedAt = formatDateTime(new Date());

  const overviewRows = buildOverviewRows({
    reportTitle: "Work Lots Report",
    exportScope: "Current filtered work lots",
    recordLabel: "Work Lots Exported",
    recordCount: exportedWorkLots.length,
    generatedAt,
    overview,
  });

  const detailHeaders = [
    "System ID",
    "Name",
    "Related Site Boundaries",
    "Category",
    "Area (m²)",
    "Area (ha)",
    "Responsible Person",
    "Assess Date",
    "Due Date",
    "Completion Date",
    "Float (Months)",
    "Force Eviction",
    "Status",
    "Updated At",
    "Updated By",
    "Description",
    "Remark",
  ];
  const detailRows = toWorkLotReportRows(exportedWorkLots, availableBoundaries);

  if (normalizedFormat === "pdf") {
    const pdfHeaders = [
      "System ID",
      "Name",
      "Related Site Boundaries",
      "Category",
      "Area (ha)",
      "Float",
      "Force Eviction",
      "Status",
    ];
    const pdfRows = detailRows.map((row) => [row[0], row[1], row[2], row[3], row[5], row[10], row[11], row[12]]);
    await downloadPdf({
      filename: "work-lots-report",
      title: "Work Lots Report",
      generatedAt,
      overview,
      headers: pdfHeaders,
      rows: pdfRows,
    });
    return;
  }

  downloadWorkbook({
    filename: "work-lots-report",
    overviewRows,
    detailHeaders,
    detailRows,
  });
}

export async function exportSiteBoundariesReport({
  siteBoundaries = [],
  workLots = [],
  format = "excel",
  floatThresholdMonths = DEFAULT_FLOAT_THRESHOLD_MONTHS,
} = {}) {
  const normalizedFormat = normalizeFormat(format);
  const exportedBoundaries = Array.isArray(siteBoundaries) ? siteBoundaries : [];
  const exportedWorkLots = Array.isArray(workLots) ? workLots : [];
  const overview = buildOverview(exportedBoundaries, exportedWorkLots, floatThresholdMonths);
  const generatedAt = formatDateTime(new Date());

  const overviewRows = buildOverviewRows({
    reportTitle: "Site Boundaries Report",
    exportScope: "Current filtered site boundaries",
    recordLabel: "Site Boundaries Exported",
    recordCount: exportedBoundaries.length,
    generatedAt,
    overview,
  });

  const detailHeaders = [
    "System ID",
    "Name",
    "Area (m²)",
    "Area (ha)",
    "Contract No.",
    "Future Use",
    "Planned Handover Date",
    "Completion Date",
    "Management Status",
    "Operator Progress",
    "Need Force Eviction",
    "Min Float (Months)",
    "Related Work Lots",
    "Remarks",
  ];

  const detailRows = toSiteBoundaryReportRows(
    exportedBoundaries,
    exportedWorkLots,
    floatThresholdMonths
  );

  if (normalizedFormat === "pdf") {
    const pdfHeaders = [
      "System ID",
      "Name",
      "Area (ha)",
      "Handover Date",
      "Status",
      "Operator Progress",
      "Need Force Eviction",
      "Min Float",
    ];
    const pdfRows = detailRows.map((row) => [row[0], row[1], row[3], row[6], row[8], row[9], row[10], row[11]]);
    await downloadPdf({
      filename: "site-boundaries-report",
      title: "Site Boundaries Report",
      generatedAt,
      overview,
      headers: pdfHeaders,
      rows: pdfRows,
    });
    return;
  }

  downloadWorkbook({
    filename: "site-boundaries-report",
    overviewRows,
    detailHeaders,
    detailRows,
  });
}
