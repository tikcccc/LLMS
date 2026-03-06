import {
  CONTRACT_PACKAGE_VALUES,
  normalizeContractPackage,
} from "../../../shared/utils/contractPackage";

const resolveSmallestAreaIdAtCoordinate = ({
  source,
  resolveMeta,
  resolveId,
  resolveGeometryStat,
  resolveActiveContract,
  coordinate,
}) => {
  if (!Array.isArray(coordinate) || coordinate.length < 2 || !source) return "";
  const x = Number(coordinate[0]);
  const y = Number(coordinate[1]);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return "";

  const dedupe = new Set();
  const candidates = [];
  const clickPoint = [x, y];
  const activeContractRaw =
    typeof resolveActiveContract === "function" ? resolveActiveContract() : "";
  const normalizedActiveContract = String(activeContractRaw || "").trim().toUpperCase();
  const scopedActiveContract = CONTRACT_PACKAGE_VALUES.includes(normalizedActiveContract)
    ? normalizedActiveContract
    : "";
  source.getFeatures().forEach((feature, index) => {
    const meta = resolveMeta(feature, index);
    const rawId = resolveId(meta);
    const resolvedId = String(rawId || "").trim();
    if (!resolvedId) return;
    const contractPackage = normalizeContractPackage(meta?.contractPackage || "");
    if (scopedActiveContract && contractPackage !== scopedActiveContract) return;
    const key = `${contractPackage}:${resolvedId.toLowerCase()}`;
    if (dedupe.has(key)) return;

    const stat = resolveGeometryStat(resolvedId, contractPackage);
    const geometry = stat?.geometry || feature.getGeometry();
    if (!geometry || typeof geometry.intersectsCoordinate !== "function") return;
    if (!geometry.intersectsCoordinate(clickPoint)) return;

    const areaValue =
      Number.isFinite(stat?.area) && stat.area > 0
        ? stat.area
        : Math.abs(geometry.getArea?.() || 0);
    dedupe.add(key);
    candidates.push({
      id: resolvedId,
      area: Number.isFinite(areaValue) ? areaValue : 0,
    });
  });

  if (!candidates.length) return "";
  candidates.sort((left, right) => {
    const areaDelta = left.area - right.area;
    if (Math.abs(areaDelta) > 1e-7) return areaDelta;
    return left.id.localeCompare(right.id, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });
  return candidates[0].id;
};

export const useMapCoordinateSelection = ({
  partOfSitesSource,
  sectionsSource,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  getPartGeometryStatById,
  getSectionGeometryStatById,
  resolveActiveContract = () => "",
}) => {
  const resolvePartSelectionByCoordinate = (coordinate) =>
    resolveSmallestAreaIdAtCoordinate({
      source: partOfSitesSource,
      resolveMeta: resolvePartOfSiteMeta,
      resolveId: (meta) => meta.partId,
      resolveGeometryStat: getPartGeometryStatById,
      resolveActiveContract,
      coordinate,
    });

  const resolveSectionSelectionByCoordinate = (coordinate) =>
    resolveSmallestAreaIdAtCoordinate({
      source: sectionsSource,
      resolveMeta: resolveSectionMeta,
      resolveId: (meta) => meta.sectionId,
      resolveGeometryStat: getSectionGeometryStatById,
      resolveActiveContract,
      coordinate,
    });

  return {
    resolvePartSelectionByCoordinate,
    resolveSectionSelectionByCoordinate,
  };
};
