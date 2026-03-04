import Point from "ol/geom/Point";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";

export const scopeSketchStyle = new Style({
  stroke: new Stroke({
    color: "rgba(13, 148, 136, 0.95)",
    width: 2.8,
    lineDash: [10, 6],
  }),
  fill: new Fill({
    color: "rgba(13, 148, 136, 0.18)",
  }),
});

const measureLineStyle = new Style({
  stroke: new Stroke({
    color: "rgba(37, 99, 235, 0.92)",
    width: 2.6,
    lineDash: [8, 6],
  }),
});

const measureSketchLineStyle = new Style({
  stroke: new Stroke({
    color: "rgba(29, 78, 216, 0.95)",
    width: 3,
    lineDash: [10, 5],
  }),
});

export const formatMeasureDistance = (distance = 0) => {
  if (!Number.isFinite(distance) || distance <= 0) return "0 m";
  if (distance >= 1000) return `${(distance / 1000).toFixed(2)} km`;
  return `${Math.round(distance)} m`;
};

const createMeasureLabelStyle = (distanceLabel) =>
  new Style({
    geometry: (feature) => {
      const geometry = feature?.getGeometry();
      if (!geometry || geometry.getType() !== "LineString") return null;
      const coordinates = geometry.getCoordinates();
      if (!coordinates?.length) return null;
      return new Point(coordinates[coordinates.length - 1]);
    },
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({ color: "rgba(37, 99, 235, 0.96)" }),
      stroke: new Stroke({ color: "rgba(255, 255, 255, 0.95)", width: 1.8 }),
    }),
    text: new Text({
      text: distanceLabel,
      offsetY: -16,
      font: "600 12px 'IBM Plex Sans'",
      fill: new Fill({ color: "#1e3a8a" }),
      stroke: new Stroke({ color: "rgba(255, 255, 255, 0.98)", width: 4 }),
      backgroundFill: new Fill({ color: "rgba(239, 246, 255, 0.95)" }),
      padding: [3, 6, 3, 6],
    }),
  });

export const measureStyle = (feature) => {
  const geometry = feature?.getGeometry();
  if (!geometry || geometry.getType() !== "LineString") {
    return [measureLineStyle];
  }
  const distanceLabel =
    feature.get("measureLabel") || formatMeasureDistance(geometry.getLength());
  return [measureLineStyle, createMeasureLabelStyle(distanceLabel)];
};

export const measureSketchStyle = (feature) => {
  const geometry = feature?.getGeometry();
  if (!geometry || geometry.getType() !== "LineString") {
    return [measureSketchLineStyle];
  }
  const distanceLabel = formatMeasureDistance(geometry.getLength());
  return [measureSketchLineStyle, createMeasureLabelStyle(distanceLabel)];
};
