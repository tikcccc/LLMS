function escapeCsvValue(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsv(headers, rows) {
  const lines = [headers.map(escapeCsvValue).join(",")];
  rows.forEach((row) => {
    lines.push(row.map(escapeCsvValue).join(","));
  });
  return lines.join("\n");
}

function downloadCsv(filename, headers, rows) {
  const csvContent = buildCsv(headers, rows);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportLandLots(landLots) {
  const headers = ["ID", "Lot Number", "Status", "Updated At", "Updated By"];
  const rows = landLots.map((lot) => [
    lot.id,
    lot.lotNumber,
    lot.status,
    lot.updatedAt,
    lot.updatedBy,
  ]);
  downloadCsv("land-lots.csv", headers, rows);
}

export function exportWorkLots(workLots) {
  const headers = [
    "ID",
    "Operator",
    "Type",
    "Status",
    "Updated At",
    "Updated By",
  ];
  const rows = workLots.map((lot) => [
    lot.id,
    lot.operatorName,
    lot.type,
    lot.status,
    lot.updatedAt,
    lot.updatedBy,
  ]);
  downloadCsv("work-lots.csv", headers, rows);
}
