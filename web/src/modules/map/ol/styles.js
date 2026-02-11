import { Fill, Stroke, Style, Text } from "ol/style";
import { todayHongKong } from "../../../shared/utils/time";

const workStyleCache = new Map();
const highlightWorkStyleCache = new Map();
const siteBoundaryStyleCache = new Map();
let todayHongKongCache = "";
let todayHongKongCacheAt = 0;

const getTodayHongKongCached = () => {
  const now = Date.now();
  if (!todayHongKongCache || now - todayHongKongCacheAt > 60 * 1000) {
    todayHongKongCache = todayHongKong();
    todayHongKongCacheAt = now;
  }
  return todayHongKongCache;
};

const isYyyyMmDd = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const isCompletedStatus = (status) =>
  status === "Completed" || status === "Cleared / Completed";

const isWorkLotOverdue = (status, dueDate) => {
  if (isCompletedStatus(status)) return false;
  if (!isYyyyMmDd(dueDate)) return false;
  return String(dueDate) < getTodayHongKongCached();
};

const intLandStroke = new Stroke({ color: "rgba(14, 116, 144, 0.8)", width: 2.2 });
const intLandFill = new Fill({ color: "rgba(14, 116, 144, 0.18)" });
const intLandBaseStyle = new Style({
  stroke: intLandStroke,
  fill: intLandFill,
});

export function intLandStyle() {
  return intLandBaseStyle;
}

const siteBoundaryPalette = {
  DEFAULT: {
    stroke: "rgba(100, 116, 139, 0.95)",
    fill: "rgba(148, 163, 184, 0.1)",
  },
  PENDING_CLEARANCE: {
    stroke: "rgba(100, 116, 139, 0.95)",
    fill: "rgba(148, 163, 184, 0.1)",
  },
  IN_PROGRESS: { stroke: "rgba(180, 83, 9, 0.95)", fill: "rgba(245, 158, 11, 0.14)" },
  CRITICAL_RISK: { stroke: "rgba(220, 38, 38, 0.95)", fill: "rgba(248, 113, 113, 0.16)" },
  HANDED_OVER: { stroke: "rgba(5, 150, 105, 0.95)", fill: "rgba(16, 185, 129, 0.16)" },
};

const createSiteBoundaryStyle = (statusKey = "DEFAULT") => {
  const palette = siteBoundaryPalette[statusKey] || siteBoundaryPalette.DEFAULT;
  return new Style({
    stroke: new Stroke({
      color: palette.stroke,
      width: 2.6,
      lineDash: [8, 4],
    }),
    fill: new Fill({ color: palette.fill }),
    text: new Text({
      font: "600 12px 'IBM Plex Sans'",
      fill: new Fill({ color: "#334155" }),
      stroke: new Stroke({ color: "rgba(255,255,255,0.96)", width: 4 }),
      overflow: true,
    }),
  });
};

export function siteBoundaryStyle(feature) {
  const rawStatusKey = feature?.get?.("kpiStatus") || "DEFAULT";
  const overdue = !!feature?.get?.("overdue");
  const statusKey = overdue && rawStatusKey !== "HANDED_OVER" ? "CRITICAL_RISK" : rawStatusKey;
  if (!siteBoundaryStyleCache.has(statusKey)) {
    siteBoundaryStyleCache.set(statusKey, createSiteBoundaryStyle(statusKey));
  }
  const style = siteBoundaryStyleCache.get(statusKey);
  const name = feature?.get?.("name") || "";
  style.getText()?.setText(name);
  return style;
}

const siteBoundaryHighlightStroke = new Stroke({
  color: "rgba(180, 83, 9, 1)",
  width: 4,
});
const siteBoundaryHighlightFill = new Fill({ color: "rgba(245, 158, 11, 0.2)" });
const siteBoundaryHighlightStyle = new Style({
  stroke: siteBoundaryHighlightStroke,
  fill: siteBoundaryHighlightFill,
});

export function highlightSiteBoundaryStyle() {
  return siteBoundaryHighlightStyle;
}

export function workLotStyle(feature) {
  const status = feature.get("status");
  const category = feature.get("workCategory");
  const dueDate = feature.get("dueDate");
  const overdue = isWorkLotOverdue(status, dueDate);
  let fillColor = "rgba(148, 163, 184, 0.62)";
  let strokeColor = "#64748b";
  let strokeWidth = 3;

  if (overdue) {
    fillColor = "rgba(248, 113, 113, 0.72)";
    strokeColor = "#dc2626";
    strokeWidth = 3.2;
  } else if (status === "Waiting for Assessment") {
    fillColor = "rgba(148, 163, 184, 0.62)";
    strokeColor = "#64748b";
    strokeWidth = 2.8;
  } else if (status === "EGA Approved") {
    fillColor = "rgba(250, 204, 21, 0.72)";
    strokeColor = "#a16207";
    strokeWidth = 3.2;
  } else if (status === "Waiting for Clearance") {
    fillColor = "rgba(245, 158, 11, 0.74)";
    strokeColor = "#b45309";
    strokeWidth = 3.2;
  } else if (isCompletedStatus(status)) {
    fillColor = "rgba(34, 197, 94, 0.72)";
    strokeColor = "#15803d";
    strokeWidth = 3.2;
  }

  const lineDash =
    category === "HH_HOUSEHOLD"
      ? [6, 4]
      : category === "GL_GOVERNMENT_LAND"
        ? [2, 4]
        : undefined;
  const cacheKey = `${status || "unknown"}:${category || "unknown"}:${overdue ? "overdue" : "normal"}`;

  if (!workStyleCache.has(cacheKey)) {
    workStyleCache.set(
      cacheKey,
      new Style({
        stroke: new Stroke({
          color: strokeColor,
          width: strokeWidth,
          lineDash,
        }),
        fill: new Fill({ color: fillColor }),
        text: new Text({
          font: "bold 13px 'IBM Plex Sans'",
          fill: new Fill({ color: "#111827" }),
          stroke: new Stroke({ color: "rgba(255,255,255,0.95)", width: 4.5 }),
        }),
      })
    );
  }
  const style = workStyleCache.get(cacheKey);
  style.getText().setText(feature.get("operatorName") ?? "");
  return style;
}

// icon styles removed

export function highlightWorkLotStyle(feature) {
  const status = feature.get("status");
  const category = feature.get("workCategory");
  const dueDate = feature.get("dueDate");
  const overdue = isWorkLotOverdue(status, dueDate);

  let fillColor = "rgba(148, 163, 184, 0.84)";
  let strokeColor = "#475569";
  if (overdue) {
    fillColor = "rgba(248, 113, 113, 0.9)";
    strokeColor = "#dc2626";
  } else if (status === "EGA Approved") {
    fillColor = "rgba(250, 204, 21, 0.9)";
    strokeColor = "#a16207";
  } else if (status === "Waiting for Clearance") {
    fillColor = "rgba(245, 158, 11, 0.9)";
    strokeColor = "#b45309";
  } else if (isCompletedStatus(status)) {
    fillColor = "rgba(34, 197, 94, 0.9)";
    strokeColor = "#15803d";
  }

  const lineDash =
    category === "HH_HOUSEHOLD"
      ? [7, 4]
      : category === "GL_GOVERNMENT_LAND"
        ? [2, 5]
        : undefined;
  const cacheKey = `${status || "unknown"}:${category || "unknown"}:${overdue ? "overdue" : "normal"}`;
  if (!highlightWorkStyleCache.has(cacheKey)) {
    highlightWorkStyleCache.set(
      cacheKey,
      new Style({
        stroke: new Stroke({ color: strokeColor, width: 4, lineDash }),
        fill: new Fill({ color: fillColor }),
        text: new Text({
          font: "bold 14px 'IBM Plex Sans'",
          fill: new Fill({ color: "#111827" }),
          stroke: new Stroke({ color: "rgba(255,255,255,0.98)", width: 5 }),
        }),
      })
    );
  }

  const style = highlightWorkStyleCache.get(cacheKey);
  style.getText().setText(feature.get("operatorName") ?? "");
  return style;
}
