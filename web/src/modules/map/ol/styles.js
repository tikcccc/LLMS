import { Fill, Stroke, Style, Text, Circle as CircleStyle, RegularShape } from "ol/style";

const landStroke = new Stroke({ color: "#1f5dff", width: 2 });
const landFill = new Fill({ color: "rgba(31, 93, 255, 0.12)" });
const landText = new Text({
  font: "12px 'IBM Plex Sans'",
  fill: new Fill({ color: "#0f172a" }),
  stroke: new Stroke({ color: "rgba(255,255,255,0.9)", width: 3 }),
  overflow: true,
});
const landStyle = new Style({
  stroke: landStroke,
  fill: landFill,
  text: landText,
});

const workStatusColors = {
  Pending: "rgba(148, 163, 184, 0.35)",
  "In-Progress": "rgba(250, 204, 21, 0.35)",
  Handover: "rgba(34, 197, 94, 0.35)",
  Difficult: "rgba(239, 68, 68, 0.35)",
};

const workStyleCache = new Map();
const workIconCache = new Map();

const landIconStyle = new Style({
  image: new RegularShape({
    points: 4,
    radius: 7,
    angle: Math.PI / 4,
    stroke: new Stroke({ color: "#1f5dff", width: 2 }),
    fill: new Fill({ color: "rgba(31, 93, 255, 0.4)" }),
  }),
});

const highlightLandStyle = new Style({
  stroke: new Stroke({ color: "#1f5dff", width: 3 }),
  fill: new Fill({ color: "rgba(31, 93, 255, 0.08)" }),
});

const highlightWorkStyle = new Style({
  stroke: new Stroke({ color: "#0f766e", width: 3 }),
  fill: new Fill({ color: "rgba(15, 118, 110, 0.08)" }),
});

export function landLotStyle(feature) {
  const label = feature.get("lotNumber") ?? "";
  landText.setText(label);
  return landStyle;
}

export function workLotStyle(feature) {
  const status = feature.get("status") ?? "Pending";
  if (!workStyleCache.has(status)) {
    workStyleCache.set(
      status,
      new Style({
        stroke: new Stroke({ color: "#111827", width: 2, lineDash: [6, 4] }),
        fill: new Fill({ color: workStatusColors[status] ?? workStatusColors.Pending }),
        text: new Text({
          font: "12px 'IBM Plex Sans'",
          fill: new Fill({ color: "#111827" }),
          stroke: new Stroke({ color: "rgba(255,255,255,0.9)", width: 3 }),
        }),
      })
    );
  }
  const style = workStyleCache.get(status);
  style.getText().setText(feature.get("operatorName") ?? "");
  return style;
}

export function landLotIconStyle() {
  return landIconStyle;
}

export function workLotIconStyle(feature) {
  const status = feature.get("status") ?? "Pending";
  if (!workIconCache.has(status)) {
    workIconCache.set(
      status,
      new Style({
        image: new CircleStyle({
          radius: 6.5,
          stroke: new Stroke({ color: "#111827", width: 1.5 }),
          fill: new Fill({ color: workStatusColors[status] ?? workStatusColors.Pending }),
        }),
      })
    );
  }
  return workIconCache.get(status);
}

export function highlightLandLotStyle() {
  return highlightLandStyle;
}

export function highlightWorkLotStyle() {
  return highlightWorkStyle;
}
