import { ref } from "vue";
import {
  buildResolvedPartGeometryStats,
  getGeometriesIntersectionArea,
  geometriesOverlapByArea,
  getResolvedPartGeometryStat,
} from "../utils/partGeometryResolution";

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

  const getPartGeometryStatById = (partId) =>
    getResolvedPartGeometryStat(partGeometryStatsById.value, partId);
  const getSectionGeometryStatById = (sectionId) =>
    getResolvedPartGeometryStat(sectionGeometryStatsById.value, sectionId);

  const resolvePartHighlightGeometry = (partId) => {
    const partGeometryStat = getPartGeometryStatById(partId);
    if (!partGeometryStat) return undefined;
    const geometry = partGeometryStat.geometry;
    return geometry ? geometry.clone() : null;
  };

  const resolveSectionHighlightGeometry = (sectionId) => {
    const sectionGeometryStat = getSectionGeometryStatById(sectionId);
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

    const nextPartGeometryStats =
      partFeatures.length > 0
        ? buildResolvedPartGeometryStats({
            features: partFeatures,
            resolvePartId: (feature, index) => resolvePartOfSiteMeta(feature, index).partId,
          })
        : new Map();
    partGeometryStatsById.value = nextPartGeometryStats;

    const nextSectionGeometryStats =
      sectionFeatures.length > 0
        ? buildResolvedPartGeometryStats({
            features: sectionFeatures,
            resolvePartId: (feature, index) => resolveSectionMeta(feature, index).sectionId,
          })
        : new Map();
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

    const sectionById = new Map();
    const sectionToPartIds = new Map();
    const fallbackSectionIds = new Set();
    const partToSectionIds = new Map();

    const ensureSectionBinding = (sectionId, partId) => {
      const normalizedSectionId = String(sectionId || "").trim();
      const normalizedPartId = String(partId || "").trim();
      if (!normalizedSectionId || !normalizedPartId) return;
      if (!sectionById.has(normalizedSectionId.toLowerCase())) return;
      if (!sectionToPartIds.has(normalizedSectionId)) {
        sectionToPartIds.set(normalizedSectionId, new Set());
      }
      sectionToPartIds.get(normalizedSectionId).add(normalizedPartId);
      if (!partToSectionIds.has(normalizedPartId)) {
        partToSectionIds.set(normalizedPartId, new Set());
      }
      partToSectionIds.get(normalizedPartId).add(normalizedSectionId);
    };

    sectionFeatures.forEach((feature, index) => {
      const sectionMeta = resolveSectionMeta(feature, index);
      sectionById.set(sectionMeta.sectionId.toLowerCase(), {
        sectionId: sectionMeta.sectionId,
        feature,
      });
      sectionToPartIds.set(sectionMeta.sectionId, new Set(sectionMeta.relatedPartIds));
      if (sectionMeta.relatedPartIds.length === 0) {
        fallbackSectionIds.add(sectionMeta.sectionId.toLowerCase());
      }
    });

    // Seed reverse mapping from explicit section -> part relationships.
    sectionToPartIds.forEach((partIds, sectionId) => {
      if (!(partIds instanceof Set) || partIds.size === 0) return;
      partIds.forEach((partId) => {
        const normalizedPartId = String(partId || "").trim();
        if (!normalizedPartId) return;
        if (!partToSectionIds.has(normalizedPartId)) {
          partToSectionIds.set(normalizedPartId, new Set());
        }
        partToSectionIds.get(normalizedPartId).add(sectionId);
      });
    });

    partFeatures.forEach((feature, index) => {
      const bindingSource = String(feature.get("sectionBindingSource") || "")
        .trim()
        .toLowerCase();
      // Ignore previous auto-generated bindings as explicit input.
      if (bindingSource === "auto") return;
      const partMeta = resolvePartOfSiteMeta(feature, index);
      const explicitSectionIds = normalizeIdCollection(
        feature.get("sectionIds") || feature.get("relatedSectionIds")
      );
      const sectionIdCandidates = partMeta.sectionId
        ? [partMeta.sectionId, ...explicitSectionIds]
        : explicitSectionIds;
      sectionIdCandidates.forEach((sectionId) => ensureSectionBinding(sectionId, partMeta.partId));
    });

    partFeatures.forEach((feature, index) => {
      const partMeta = resolvePartOfSiteMeta(feature, index);
      const normalizedPartId = partMeta.partId;
      const existing = partToSectionIds.get(normalizedPartId);
      if (existing && existing.size > 0) return;
      const partGeometry =
        getResolvedPartGeometryStat(nextPartGeometryStats, normalizedPartId)?.geometry ||
        feature.getGeometry();
      if (!partGeometry) return;
      sectionFeatures.forEach((sectionFeature, sectionIndex) => {
        const sectionMeta = resolveSectionMeta(sectionFeature, sectionIndex);
        if (!fallbackSectionIds.has(sectionMeta.sectionId.toLowerCase())) return;
        const sectionGeometry =
          getSectionGeometryStatById(sectionMeta.sectionId)?.geometry ||
          sectionFeature.getGeometry();
        if (!sectionGeometry) return;
        if (!geometriesOverlapByArea(partGeometry, sectionGeometry)) return;
        const overlapArea = getGeometriesIntersectionArea(partGeometry, sectionGeometry);
        if (overlapArea < minOverlapArea) return;
        ensureSectionBinding(sectionMeta.sectionId, normalizedPartId);
      });
    });

    sectionFeatures.forEach((feature, index) => {
      const sectionMeta = resolveSectionMeta(feature, index);
      const relatedIds = Array.from(
        sectionToPartIds.get(sectionMeta.sectionId) || []
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      feature.set("relatedPartIds", relatedIds);
      feature.set("partCount", relatedIds.length);
    });

    partFeatures.forEach((feature, index) => {
      const partMeta = resolvePartOfSiteMeta(feature, index);
      const sectionIds = Array.from(
        partToSectionIds.get(partMeta.partId) || []
      ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
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
