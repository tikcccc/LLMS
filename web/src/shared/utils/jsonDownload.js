const ensureJsonFilename = (filename = "export.json") => {
  const normalized = String(filename || "").trim();
  if (!normalized) return "export.json";
  if (/\.json$/i.test(normalized)) return normalized;
  return `${normalized}.json`;
};

export const downloadJson = (payload, filename = "export.json") => {
  if (typeof document === "undefined") {
    throw new Error("JSON download is only available in browser context.");
  }
  const content = JSON.stringify(payload ?? null, null, 2);
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = ensureJsonFilename(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
