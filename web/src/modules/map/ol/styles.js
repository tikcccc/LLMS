import { Fill, Stroke, Style, Text } from "ol/style";

const workStyleCache = new Map();
const highlightWorkStyleCache = new Map();
const siteBoundaryStyleCache = new Map();

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
  DEFAULT: { stroke: "rgba(217, 119, 6, 0.95)", fill: "rgba(217, 119, 6, 0.12)" },
  PENDING_CLEARANCE: {
    stroke: "rgba(100, 116, 139, 0.95)",
    fill: "rgba(148, 163, 184, 0.1)",
  },
  IN_PROGRESS: { stroke: "rgba(202, 138, 4, 0.95)", fill: "rgba(250, 204, 21, 0.12)" },
  CRITICAL_RISK: { stroke: "rgba(220, 38, 38, 0.95)", fill: "rgba(248, 113, 113, 0.16)" },
  HANDOVER_READY: { stroke: "rgba(22, 163, 74, 0.95)", fill: "rgba(34, 197, 94, 0.14)" },
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
  const statusKey =
    overdue && rawStatusKey !== "HANDED_OVER" && rawStatusKey !== "HANDOVER_READY"
      ? "CRITICAL_RISK"
      : rawStatusKey;
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
  let fillColor = "rgba(148, 163, 184, 0.62)";
  let strokeColor = "#64748b";
  let strokeWidth = 3;

  if (status === "Waiting for Assessment") {
    fillColor = "rgba(148, 163, 184, 0.62)";
    strokeColor = "#64748b";
    strokeWidth = 2.8;
  } else if (status === "EGA Approved") {
    fillColor = "rgba(59, 130, 246, 0.72)";
    strokeColor = "#1d4ed8";
    strokeWidth = 3.2;
  } else if (status === "Waiting for Clearance") {
    fillColor = "rgba(250, 204, 21, 0.74)";
    strokeColor = "#ca8a04";
    strokeWidth = 3.2;
  } else if (status === "Cleared / Completed") {
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
  const cacheKey = `${status || "unknown"}:${category || "unknown"}`;

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

  let fillColor = "rgba(148, 163, 184, 0.84)";
  let strokeColor = "#475569";
  if (status === "EGA Approved") {
    fillColor = "rgba(59, 130, 246, 0.9)";
    strokeColor = "#1d4ed8";
  } else if (status === "Waiting for Clearance") {
    fillColor = "rgba(250, 204, 21, 0.9)";
    strokeColor = "#a16207";
  } else if (status === "Cleared / Completed") {
    fillColor = "rgba(34, 197, 94, 0.9)";
    strokeColor = "#15803d";
  }

  const lineDash =
    category === "HH_HOUSEHOLD"
      ? [7, 4]
      : category === "GL_GOVERNMENT_LAND"
        ? [2, 5]
        : undefined;
  const cacheKey = `${status || "unknown"}:${category || "unknown"}`;
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
