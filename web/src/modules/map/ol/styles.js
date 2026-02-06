import { Fill, Stroke, Style, Text } from "ol/style";

const workStyleCache = new Map();
const highlightWorkStyleCache = new Map();

const intLandStroke = new Stroke({ color: "rgba(14, 116, 144, 0.8)", width: 2.2 });
const intLandFill = new Fill({ color: "rgba(14, 116, 144, 0.18)" });
const intLandBaseStyle = new Style({
  stroke: intLandStroke,
  fill: intLandFill,
});

export function intLandStyle() {
  return intLandBaseStyle;
}

const siteBoundaryStroke = new Stroke({
  color: "rgba(217, 119, 6, 0.95)",
  width: 2.6,
  lineDash: [8, 4],
});
const siteBoundaryFill = new Fill({ color: "rgba(217, 119, 6, 0.12)" });
const siteBoundaryBaseStyle = new Style({
  stroke: siteBoundaryStroke,
  fill: siteBoundaryFill,
});

export function siteBoundaryStyle() {
  return siteBoundaryBaseStyle;
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
  const taskAlert = feature.get("taskAlert"); // 'overdue', 'inProgress', 'completed', or null
  
  // Determine color based on task alert - bright and clear colors
  let fillColor, strokeColor, strokeWidth;
  
  if (taskAlert === 'overdue') {
    fillColor = "rgba(239, 68, 68, 0.75)";      // Bright red
    strokeColor = "#dc2626";
    strokeWidth = 3.5;
  } else if (taskAlert === 'inProgress') {
    fillColor = "rgba(250, 204, 21, 0.75)";     // Bright yellow
    strokeColor = "#eab308";
    strokeWidth = 3.5;
  } else if (taskAlert === 'completed') {
    fillColor = "rgba(34, 197, 94, 0.75)";      // Bright green
    strokeColor = "#16a34a";
    strokeWidth = 3.5;
  } else {
    // No tasks - use neutral gray
    fillColor = "rgba(148, 163, 184, 0.6)";
    strokeColor = "#64748b";
    strokeWidth = 3;
  }
  
  const cacheKey = taskAlert || 'no-tasks';
  
  if (!workStyleCache.has(cacheKey)) {
    workStyleCache.set(
      cacheKey,
      new Style({
        stroke: new Stroke({ 
          color: strokeColor, 
          width: strokeWidth
          // 實線 - 移除 lineDash
        }),
        fill: new Fill({ color: fillColor }),
        text: new Text({
          font: "bold 13px 'IBM Plex Sans'",     // slightly larger bold text
          fill: new Fill({ color: "#111827" }),
          stroke: new Stroke({ color: "rgba(255,255,255,0.95)", width: 4.5 }), // thicker stroke
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
  const taskAlert = feature.get("taskAlert");

  let fillColor;
  let strokeColor;
  if (taskAlert === "overdue") {
    fillColor = "rgba(239, 68, 68, 0.9)";
    strokeColor = "#b91c1c";
  } else if (taskAlert === "inProgress") {
    fillColor = "rgba(250, 204, 21, 0.88)";
    strokeColor = "#ca8a04";
  } else if (taskAlert === "completed") {
    fillColor = "rgba(34, 197, 94, 0.88)";
    strokeColor = "#15803d";
  } else {
    fillColor = "rgba(148, 163, 184, 0.8)";
    strokeColor = "#475569";
  }

  const cacheKey = taskAlert || "no-tasks";
  if (!highlightWorkStyleCache.has(cacheKey)) {
    highlightWorkStyleCache.set(
      cacheKey,
      new Style({
        stroke: new Stroke({ color: strokeColor, width: 4 }),
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
