import { Fill, Stroke, Style, Text } from "ol/style";

const landStroke = new Stroke({ color: "rgba(31, 93, 255, 0.6)", width: 1.4, lineDash: [4, 6] }); // 加深描邊
const landFill = new Fill({ color: "rgba(31, 93, 255, 0.12)" }); // 加深填充
const landText = new Text({
  font: "11px 'IBM Plex Sans'", // 稍小的字體
  fill: new Fill({ color: "rgba(15, 23, 42, 0.6)" }), // 更淡的文字
  stroke: new Stroke({ color: "rgba(255,255,255,0.8)", width: 2.5 }),
  overflow: true,
});
const landStyle = new Style({
  stroke: landStroke,
  fill: landFill,
  text: landText,
});

const workStyleCache = new Map();


const highlightLandText = new Text({
  font: "bold 14px 'IBM Plex Sans'",
  fill: new Fill({ color: "#0f172a" }),
  stroke: new Stroke({ color: "rgba(255,255,255,0.98)", width: 5 }),
  overflow: true,
});

const highlightLandStyle = new Style({
  stroke: new Stroke({ color: "#1d4ed8", width: 3.6 }),
  fill: new Fill({ color: "rgba(30, 64, 175, 0.22)" }),
  text: highlightLandText,
});

const highlightWorkStyleCache = new Map();

export function landLotStyle(feature) {
  const label = feature.get("lotNumber") ?? "";
  landText.setText(label);
  return landStyle;
}

const intLandStroke = new Stroke({ color: "rgba(14, 116, 144, 0.8)", width: 2.2 });
const intLandFill = new Fill({ color: "rgba(14, 116, 144, 0.18)" });
const intLandText = new Text({
  font: "12px 'IBM Plex Sans'",
  fill: new Fill({ color: "rgba(13, 68, 80, 0.85)" }),
  stroke: new Stroke({ color: "rgba(255,255,255,0.9)", width: 3 }),
  overflow: true,
});
const intLandBaseStyle = new Style({
  stroke: intLandStroke,
  fill: intLandFill,
  text: intLandText,
});

export function intLandStyle(feature) {
  const label = feature.get("label") ?? feature.getId?.() ?? "";
  intLandText.setText(label);
  return intLandBaseStyle;
}

const intLandLineStyle = new Style({
  stroke: new Stroke({ color: "rgba(14, 116, 144, 0.75)", width: 1.6 }),
});

export function intLandLineStyleFn() {
  return intLandLineStyle;
}

const highlightIntLandText = new Text({
  font: "bold 13px 'IBM Plex Sans'",
  fill: new Fill({ color: "rgba(15, 23, 42, 0.95)" }),
  stroke: new Stroke({ color: "rgba(255,255,255,0.98)", width: 4 }),
  overflow: true,
});
const highlightIntLandBaseStyle = new Style({
  stroke: new Stroke({ color: "rgba(8, 145, 178, 0.95)", width: 3.6 }),
  fill: new Fill({ color: "rgba(8, 145, 178, 0.28)" }),
  text: highlightIntLandText,
});

export function highlightIntLandStyle(feature) {
  const label = feature.get("label") ?? feature.getId?.() ?? "";
  highlightIntLandText.setText(label);
  return highlightIntLandBaseStyle;
}

// Reduce land lot opacity to make work lots more visible
const landStyleLowOpacity = new Style({
  stroke: new Stroke({ color: "rgba(31, 93, 255, 0.4)", width: 1.2, lineDash: [4, 6] }),  // 稍微可見
  fill: new Fill({ color: "rgba(31, 93, 255, 0.08)" }),  // 稍微可見
  text: landText,
});

export function landLotStyleAdjusted(feature) {
  const label = feature.get("lotNumber") ?? "";
  landText.setText(label);
  return landStyleLowOpacity;
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

export function highlightLandLotStyle(feature) {
  const label = feature.get("lotNumber") ?? "";
  highlightLandText.setText(label);
  return highlightLandStyle;
}

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
