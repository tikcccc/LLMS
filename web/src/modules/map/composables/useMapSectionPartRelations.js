import { ref } from "vue";
import {
  CONTRACT_PACKAGE_VALUES,
  normalizeContractPackage,
} from "../../../shared/utils/contractPackage";
import {
  buildResolvedPartGeometryStats,
  getGeometriesIntersectionArea,
  geometriesOverlapByArea,
  getResolvedPartGeometryStat,
} from "../utils/partGeometryResolution";

const normalizeText = (value) => String(value || "").trim();
const buildScopedKey = (id, contractPackage = "C2") => {
  const normalizedId = normalizeText(id);
  if (!normalizedId) return "";
  const normalizedContract = normalizeContractPackage(contractPackage);
  return `${normalizedContract}:${normalizedId.toLowerCase()}`;
};
const normalizeNaturalSort = (left, right) =>
  String(left || "").localeCompare(String(right || ""), undefined, { numeric: true });

const buildContractIsolatedGeometryStats = ({
  features = [],
  resolveMeta,
  resolveScopedId,
}) => {
  if (!Array.isArray(features) || features.length === 0) return new Map();
  if (typeof resolveMeta !== "function" || typeof resolveScopedId !== "function") {
    return new Map();
  }

  const metaByFeature = new WeakMap();
  const byContract = new Map();

  features.forEach((feature, index) => {
    const meta = resolveMeta(feature, index) || {};
    metaByFeature.set(feature, meta);
    const contractPackage = normalizeContractPackage(meta.contractPackage);
    if (!byContract.has(contractPackage)) {
      byContract.set(contractPackage, []);
    }
    byContract.get(contractPackage).push(feature);
  });

  const mergedStats = new Map();
  byContract.forEach((contractFeatures, contractPackage) => {
    if (!Array.isArray(contractFeatures) || contractFeatures.length === 0) return;
    const stats = buildResolvedPartGeometryStats({
      features: contractFeatures,
      resolvePartId: (feature, index) => {
        const meta =
          metaByFeature.get(feature) ||
          resolveMeta(feature, index) || { contractPackage };
        return resolveScopedId(meta, contractPackage);
      },
    });
    stats.forEach((value, key) => mergedStats.set(key, value));
  });
  return mergedStats;
};

const resolveScopedGeometryStat = (statsMap, id, contractPackage = "") => {
  const normalizedId = normalizeText(id);
  if (!normalizedId || !(statsMap instanceof Map)) return null;
  const normalizedContract = normalizeText(contractPackage).toUpperCase();
  if (CONTRACT_PACKAGE_VALUES.includes(normalizedContract)) {
    return getResolvedPartGeometryStat(
      statsMap,
      buildScopedKey(normalizedId, normalizedContract)
    );
  }
  const fallbackStats = CONTRACT_PACKAGE_VALUES
    .map((packageCode) => getResolvedPartGeometryStat(statsMap, buildScopedKey(normalizedId, packageCode)))
    .filter(Boolean);
  return fallbackStats[0] || getResolvedPartGeometryStat(statsMap, normalizedId);
};

export const useMapSectionPartRelations = ({
  sectionsSource,
  partOfSitesSource,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  normalizeIdCollection,
  minOverlapArea = 1.0,
}) => {
  const partGeometryStatsById = ref(new Map());
  const sectionGeometryStatsById = ref(new Map());

  const getPartGeometryStatById = (partId, contractPackage = "") =>
    resolveScopedGeometryStat(partGeometryStatsById.value, partId, contractPackage);
  const getSectionGeometryStatById = (sectionId, contractPackage = "") =>
    resolveScopedGeometryStat(sectionGeometryStatsById.value, sectionId, contractPackage);

  const resolvePartHighlightGeometry = (partId, contractPackage = "") => {
    const partGeometryStat = getPartGeometryStatById(partId, contractPackage);
    if (!partGeometryStat) return undefined;
    const geometry = partGeometryStat.geometry;
    return geometry ? geometry.clone() : null;
  };

  const resolveSectionHighlightGeometry = (sectionId, contractPackage = "") => {
    const sectionGeometryStat = getSectionGeometryStatById(sectionId, contractPackage);
    if (!sectionGeometryStat) return undefined;
    const geometry = sectionGeometryStat.geometry;
    return geometry ? geometry.clone() : null;
  };

  const syncSectionPartRelations = () => {
    if (!sectionsSource || !partOfSitesSource) {
      partGeometryStatsById.value = new Map();
      sectionGeometryStatsById.value = new Map();
      return;
    }
    if (
      typeof resolvePartOfSiteMeta !== "function" ||
      typeof resolveSectionMeta !== "function"
    ) {
      return;
    }

    const sectionFeatures = sectionsSource.getFeatures();
    const partFeatures = partOfSitesSource.getFeatures();

    const nextPartGeometryStats = buildContractIsolatedGeometryStats({
      features: partFeatures,
      resolveMeta: (feature, index) => resolvePartOfSiteMeta(feature, index),
      resolveScopedId: (partMeta, contractPackage) =>
        buildScopedKey(partMeta.partId, contractPackage),
    });
    partGeometryStatsById.value = nextPartGeometryStats;

    const nextSectionGeometryStats = buildContractIsolatedGeometryStats({
      features: sectionFeatures,
      resolveMeta: (feature, index) => resolveSectionMeta(feature, index),
      resolveScopedId: (sectionMeta, contractPackage) =>
        buildScopedKey(sectionMeta.sectionId, contractPackage),
    });
    sectionGeometryStatsById.value = nextSectionGeometryStats;

    if (!sectionFeatures.length || !partFeatures.length) {
      sectionFeatures.forEach((sectionFeature) => {
        sectionFeature.set("relatedPartIds", []);
        sectionFeature.set("partCount", 0);
      });
      partFeatures.forEach((partFeature) => {
        partFeature.set("sectionIds", []);
        partFeature.set("sectionId", "");
      });
      return;
    }

    const sectionByScopedId = new Map();
    const sectionToPartIds = new Map();
    const fallbackSectionScopedIds = new Set();
    const partToSectionIds = new Map();

    const ensureSectionBinding = ({
      sectionScopedId,
      sectionId,
      partScopedId,
      partId,
    } = {}) => {
      const normalizedSectionScopedId = normalizeText(sectionScopedId);
      const normalizedSectionId = normalizeText(sectionId);
      const normalizedPartScopedId = normalizeText(partScopedId);
      const normalizedPartId = normalizeText(partId);
      if (
        !normalizedSectionScopedId ||
        !normalizedSectionId ||
        !normalizedPartScopedId ||
        !normalizedPartId
      ) {
        return;
      }
      if (!sectionByScopedId.has(normalizedSectionScopedId)) return;
      if (!sectionToPartIds.has(normalizedSectionScopedId)) {
        sectionToPartIds.set(normalizedSectionScopedId, new Set());
      }
      sectionToPartIds.get(normalizedSectionScopedId).add(normalizedPartId);
      if (!partToSectionIds.has(normalizedPartScopedId)) {
        partToSectionIds.set(normalizedPartScopedId, new Set());
      }
      partToSectionIds.get(normalizedPartScopedId).add(normalizedSectionId);
    };

    sectionFeatures.forEach((feature, index) => {
      const sectionMeta = resolveSectionMeta(feature, index);
      const sectionScopedId = buildScopedKey(
        sectionMeta.sectionId,
        sectionMeta.contractPackage
      );
      if (!sectionScopedId) return;
      const relatedPartIds = (sectionMeta.relatedPartIds || [])
        .map((partId) => normalizeText(partId))
        .filter(Boolean);

      sectionByScopedId.set(sectionScopedId, {
        sectionId: sectionMeta.sectionId,
        contractPackage: normalizeContractPackage(sectionMeta.contractPackage),
        feature,
      });
      sectionToPartIds.set(sectionScopedId, new Set(relatedPartIds));
      if (relatedPartIds.length === 0) {
        fallbackSectionScopedIds.add(sectionScopedId);
      }
    });

    // Seed reverse mapping from explicit section -> part relationships.
    sectionToPartIds.forEach((partIds, sectionScopedId) => {
      if (!(partIds instanceof Set) || partIds.size === 0) return;
      const sectionRecord = sectionByScopedId.get(sectionScopedId);
      if (!sectionRecord) return;
      partIds.forEach((partId) => {
        const normalizedPartId = normalizeText(partId);
        if (!normalizedPartId) return;
        const partScopedId = buildScopedKey(
          normalizedPartId,
          sectionRecord.contractPackage
        );
        if (!partScopedId) return;
        if (!partToSectionIds.has(partScopedId)) {
          partToSectionIds.set(partScopedId, new Set());
        }
        partToSectionIds.get(partScopedId).add(sectionRecord.sectionId);
      });
    });

    partFeatures.forEach((feature, index) => {
      const bindingSource = String(feature.get("sectionBindingSource") || "")
        .trim()
        .toLowerCase();
      // Ignore previous auto-generated bindings as explicit input.
      if (bindingSource === "auto") return;
      const partMeta = resolvePartOfSiteMeta(feature, index);
      const partScopedId = buildScopedKey(partMeta.partId, partMeta.contractPackage);
      if (!partScopedId) return;
      const explicitSectionIds = normalizeIdCollection(
        feature.get("sectionIds") || feature.get("relatedSectionIds")
      );
      const sectionIdCandidates = partMeta.sectionId
        ? [partMeta.sectionId, ...explicitSectionIds]
        : explicitSectionIds;
      sectionIdCandidates.forEach((sectionId) => {
        const sectionScopedId = buildScopedKey(sectionId, partMeta.contractPackage);
        const sectionRecord = sectionByScopedId.get(sectionScopedId);
        if (!sectionRecord) return;
        ensureSectionBinding({
          sectionScopedId,
          sectionId: sectionRecord.sectionId,
          partScopedId,
          partId: partMeta.partId,
        });
      });
    });

    partFeatures.forEach((feature, index) => {
      const partMeta = resolvePartOfSiteMeta(feature, index);
      const normalizedPartId = partMeta.partId;
      const normalizedPartScopedId = buildScopedKey(
        normalizedPartId,
        partMeta.contractPackage
      );
      if (!normalizedPartScopedId) return;
      const existing = partToSectionIds.get(normalizedPartScopedId);
      if (existing && existing.size > 0) return;
      const partGeometry =
        getPartGeometryStatById(normalizedPartId, partMeta.contractPackage)?.geometry ||
        feature.getGeometry();
      if (!partGeometry) return;
      sectionFeatures.forEach((sectionFeature, sectionIndex) => {
        const sectionMeta = resolveSectionMeta(sectionFeature, sectionIndex);
        const normalizedSectionScopedId = buildScopedKey(
          sectionMeta.sectionId,
          sectionMeta.contractPackage
        );
        if (!fallbackSectionScopedIds.has(normalizedSectionScopedId)) return;
        if (
          normalizeContractPackage(sectionMeta.contractPackage) !==
          normalizeContractPackage(partMeta.contractPackage)
        ) {
          return;
        }
        const sectionGeometry =
          getSectionGeometryStatById(
            sectionMeta.sectionId,
            sectionMeta.contractPackage
          )?.geometry ||
          sectionFeature.getGeometry();
        if (!sectionGeometry) return;
        if (!geometriesOverlapByArea(partGeometry, sectionGeometry)) return;
        const overlapArea = getGeometriesIntersectionArea(partGeometry, sectionGeometry);
        if (overlapArea < minOverlapArea) return;
        ensureSectionBinding({
          sectionScopedId: normalizedSectionScopedId,
          sectionId: sectionMeta.sectionId,
          partScopedId: normalizedPartScopedId,
          partId: normalizedPartId,
        });
      });
    });

    sectionFeatures.forEach((feature, index) => {
      const sectionMeta = resolveSectionMeta(feature, index);
      const sectionScopedId = buildScopedKey(
        sectionMeta.sectionId,
        sectionMeta.contractPackage
      );
      const relatedIds = Array.from(
        sectionToPartIds.get(sectionScopedId) || []
      ).sort(normalizeNaturalSort);
      feature.set("relatedPartIds", relatedIds);
      feature.set("partCount", relatedIds.length);
    });

    partFeatures.forEach((feature, index) => {
      const partMeta = resolvePartOfSiteMeta(feature, index);
      const partScopedId = buildScopedKey(partMeta.partId, partMeta.contractPackage);
      const sectionIds = Array.from(
        partToSectionIds.get(partScopedId) || []
      ).sort(normalizeNaturalSort);
      feature.set("sectionIds", sectionIds);
      feature.set("sectionId", sectionIds[0] || "");
      feature.set("sectionBindingSource", "auto");
    });
  };

  return {
    getPartGeometryStatById,
    getSectionGeometryStatById,
    resolvePartHighlightGeometry,
    resolveSectionHighlightGeometry,
    syncSectionPartRelations,
  };
};
