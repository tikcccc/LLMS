import * as XLSX from "xlsx";
import { formatHongKong } from "./time";
import { workLotCategoryCode } from "./worklot";
import { buildWorkLotsByBoundary, summarizeSiteBoundary } from "./siteBoundary";

const DEFAULT_FLOAT_THRESHOLD_MONTHS = 3;
const PDF_MARGIN = 40;
const PDF_CJK_FONT_FAMILY = "NotoSansTC";
const PDF_CJK_FONT_FILE = "NotoSansTC-500.ttf";
const PDF_CJK_FONT_URLS = [
  "/fonts/NotoSansTC-500.ttf",
  "https://cdn.jsdelivr.net/gh/notofonts/noto-cjk@main/Sans/Variable/TTF/Subset/NotoSansTC-VF.ttf",
  "https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/Variable/TTF/Subset/NotoSansTC-VF.ttf",
];

let pdfCjkFontBase64Promise = null;

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

const arrayBufferToBase64 = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
};

const fetchPdfCjkFontBase64 = async () => {
  let lastError = null;
  for (const url of PDF_CJK_FONT_URLS) {
    try {
      const response = await fetch(url, { cache: "force-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const fontBuffer = await response.arrayBuffer();
      return arrayBufferToBase64(fontBuffer);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("Failed to load CJK font.");
};

const loadPdfCjkFontBase64 = () => {
  if (!pdfCjkFontBase64Promise) {
    pdfCjkFontBase64Promise = fetchPdfCjkFontBase64().catch((error) => {
      pdfCjkFontBase64Promise = null;
      throw error;
    });
  }
  return pdfCjkFontBase64Promise;
};

const enablePdfCjkFont = async (doc) => {
  try {
    const fontBase64 = await loadPdfCjkFontBase64();
    doc.addFileToVFS(PDF_CJK_FONT_FILE, fontBase64);
    doc.addFont(PDF_CJK_FONT_FILE, PDF_CJK_FONT_FAMILY, "normal");
    doc.addFont(PDF_CJK_FONT_FILE, PDF_CJK_FONT_FAMILY, "bold");
    return true;
  } catch (error) {
    console.warn("PDF CJK font load failed, fallback to Helvetica.", error);
    return false;
  }
};

const setPdfFont = (doc, useCjkFont, fontStyle = "normal") => {
  const style = fontStyle === "bold" ? "bold" : "normal";
  if (useCjkFont) {
    doc.setFont(PDF_CJK_FONT_FAMILY, style);
    return;
  }
  doc.setFont("helvetica", style);
};

const toPdfText = (value) => {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text || "—";
};

const drawPdfPageHeader = (doc, title, generatedAt, useCjkFont, continuation = false) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  setPdfFont(doc, useCjkFont, "bold");
  doc.setFontSize(14);
  doc.text(continuation ? `${title} (Continued)` : title, PDF_MARGIN, 32);
  setPdfFont(doc, useCjkFont, "normal");
  doc.setFontSize(10);
  doc.text(`Generated at: ${generatedAt}`, PDF_MARGIN, 50);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.8);
  doc.line(PDF_MARGIN, 58, pageWidth - PDF_MARGIN, 58);
  return 74;
};

const drawPdfOverview = (doc, overview, yStart, recordLabel, recordCount, useCjkFont) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - PDF_MARGIN * 2;
  const lines = [
    `${recordLabel}: ${recordCount}`,
    `KPI Denominator: ${overview.totalLand} site boundaries`,
    `% Land Handover: ${formatPercent(overview.handoverRate)} (${overview.handoverCount}/${overview.totalLand})`,
    `% Land Need Force Eviction: ${formatPercent(overview.forceEvictionRate)} (${overview.forceEvictionCount}/${overview.totalLand})`,
    `% Land with Float < ${overview.floatThresholdMonths} Months: ${formatPercent(overview.lowFloatRate)} (${overview.lowFloatCount}/${overview.totalLand})`,
  ];
  setPdfFont(doc, useCjkFont, "normal");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  let y = yStart;
  lines.forEach((line) => {
    const wrappedLines = doc.splitTextToSize(line, contentWidth);
    doc.text(wrappedLines, PDF_MARGIN, y);
    y += Math.max(1, wrappedLines.length) * 14;
  });
  return y + 10;
};

const loadPdfModules = async () => {
  const { jsPDF } = await import("jspdf");
  return { jsPDF };
};

const buildPdfRecordTitle = (row, index) => {
  const id = toPdfText(row?.[0]);
  const name = toPdfText(row?.[1]);
  if (name !== "—" && name !== id) {
    return `${index + 1}. ${name} (${id})`;
  }
  return `${index + 1}. ${id}`;
};

const downloadPdf = async ({
  filename,
  title,
  generatedAt,
  overview,
  headers,
  rows,
  recordLabel,
}) => {
  const { jsPDF } = await loadPdfModules();
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });
  const useCjkFont = await enablePdfCjkFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - PDF_MARGIN * 2;
  const lineHeight = 13;
  const sectionGap = 14;
  let y = drawPdfPageHeader(doc, title, generatedAt, useCjkFont);

  const resetPage = () => {
    doc.addPage();
    y = drawPdfPageHeader(doc, title, generatedAt, useCjkFont, true);
  };

  y = drawPdfOverview(doc, overview, y, recordLabel, rows.length, useCjkFont);
  if (y + 24 > pageHeight - PDF_MARGIN) {
    resetPage();
  }

  setPdfFont(doc, useCjkFont, "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text("Details", PDF_MARGIN, y);
  y += 16;

  setPdfFont(doc, useCjkFont, "bold");
  doc.setFontSize(10);
  const labelWidth = Math.min(
    180,
    Math.max(
      96,
      ...headers.map((header) => doc.getTextWidth(`${toPdfText(header)}:`))
    ) + 12
  );
  const valueWidth = Math.max(120, contentWidth - labelWidth);

  if (!rows.length) {
    setPdfFont(doc, useCjkFont, "normal");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text("No records selected.", PDF_MARGIN, y);
    doc.save(toPdfFilename(filename));
    return;
  }

  rows.forEach((row, rowIndex) => {
    setPdfFont(doc, useCjkFont, "normal");
    doc.setFontSize(10);
    const entries = headers.map((header, colIndex) => {
      const value = toPdfText(row?.[colIndex]);
      const wrappedValue = doc.splitTextToSize(value, valueWidth);
      return {
        label: toPdfText(header),
        lines: wrappedValue.length ? wrappedValue : ["—"],
      };
    });

    const estimatedSectionHeight =
      20 +
      entries.reduce(
        (sum, entry) => sum + Math.max(1, entry.lines.length) * lineHeight + 2,
        0
      ) +
      sectionGap;

    if (y + estimatedSectionHeight > pageHeight - PDF_MARGIN) {
      resetPage();
    }

    const recordTitle = buildPdfRecordTitle(row, rowIndex);
    setPdfFont(doc, useCjkFont, "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(recordTitle, PDF_MARGIN, y);
    y += 12;

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.6);
    doc.line(PDF_MARGIN, y, pageWidth - PDF_MARGIN, y);
    y += 8;

    entries.forEach((entry) => {
      const entryHeight = Math.max(1, entry.lines.length) * lineHeight + 2;
      if (y + entryHeight > pageHeight - PDF_MARGIN) {
        resetPage();
        setPdfFont(doc, useCjkFont, "bold");
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text(`${recordTitle} (cont.)`, PDF_MARGIN, y);
        y += 12;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.6);
        doc.line(PDF_MARGIN, y, pageWidth - PDF_MARGIN, y);
        y += 8;
      }

      setPdfFont(doc, useCjkFont, "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text(`${entry.label}:`, PDF_MARGIN, y);

      setPdfFont(doc, useCjkFont, "normal");
      doc.setTextColor(17, 24, 39);
      doc.text(entry.lines, PDF_MARGIN + labelWidth, y);
      y += entryHeight;
    });

    y += sectionGap;
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
    await downloadPdf({
      filename: "work-lots-report",
      title: "Work Lots Report",
      generatedAt,
      overview,
      headers: detailHeaders,
      rows: detailRows,
      recordLabel: "Work Lots Exported",
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
    await downloadPdf({
      filename: "site-boundaries-report",
      title: "Site Boundaries Report",
      generatedAt,
      overview,
      headers: detailHeaders,
      rows: detailRows,
      recordLabel: "Site Boundaries Exported",
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
