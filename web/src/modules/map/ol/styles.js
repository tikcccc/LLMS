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
  const status = feature.get("status");
  const category = feature.get("workCategory");
  let fillColor = "rgba(148, 163, 184, 0.62)";
  let strokeColor = "#64748b";
  let strokeWidth = 3;

  if (status === "EGA approved") {
    fillColor = "rgba(34, 197, 94, 0.72)";
    strokeColor = "#15803d";
    strokeWidth = 3.2;
  } else if (status === "waiting for clearance") {
    fillColor = "rgba(250, 204, 21, 0.74)";
    strokeColor = "#ca8a04";
    strokeWidth = 3.2;
  }

  const lineDash = category === "DOMESTIC" ? [6, 4] : undefined;
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
  if (status === "EGA approved") {
    fillColor = "rgba(34, 197, 94, 0.88)";
    strokeColor = "#15803d";
  } else if (status === "waiting for clearance") {
    fillColor = "rgba(250, 204, 21, 0.9)";
    strokeColor = "#a16207";
  }

  const lineDash = category === "DOMESTIC" ? [7, 4] : undefined;
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
