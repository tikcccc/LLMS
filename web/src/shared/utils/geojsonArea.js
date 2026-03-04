const ringArea = (ring = []) => {
  if (!Array.isArray(ring) || ring.length < 3) return 0;
  let area = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index] || [];
    const [x2, y2] = ring[index + 1] || [];
    if (!Number.isFinite(x1) || !Number.isFinite(y1) || !Number.isFinite(x2) || !Number.isFinite(y2)) {
      continue;
    }
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
};

const polygonArea = (coordinates = []) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return 0;
  const outer = ringArea(coordinates[0] || []);
  const holes = coordinates
    .slice(1)
    .reduce((total, ring) => total + ringArea(ring || []), 0);
  return Math.max(0, outer - holes);
};

export const geometryAreaSqm = (geometry = null) => {
  if (!geometry || typeof geometry !== "object") return 0;
  if (geometry.type === "Polygon") {
    return polygonArea(geometry.coordinates);
  }
  if (geometry.type === "MultiPolygon") {
    const polygons = Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
    return polygons.reduce((total, polygonCoords) => total + polygonArea(polygonCoords), 0);
  }
  return 0;
};

export const featureAreaSqm = (feature = null) => geometryAreaSqm(feature?.geometry);

export const featureCollectionAreaSqm = (featureCollection = null) => {
  const features = Array.isArray(featureCollection?.features) ? featureCollection.features : [];
  return features.reduce((total, feature) => total + featureAreaSqm(feature), 0);
};
