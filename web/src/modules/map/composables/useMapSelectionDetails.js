import { computed } from "vue";
import { normalizeContractPackage } from "../../../shared/utils/contractPackage";
import {
  buildSelectedPartOfSiteRelatedSections,
  buildSelectedSectionRelatedPartOfSites,
  buildSelectedSiteBoundaryRelatedWorkLots,
  buildSelectedWorkLotRelatedSites,
} from "../utils/relationSelectors";

export const useMapSelectionDetails = ({
  uiStore,
  workLotStore,
  selectedWorkLot,
  siteBoundarySourceVersion,
  partOfSitesSourceVersion,
  sectionSourceVersion,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  getPartGeometryStatById,
  getSectionGeometryStatById,
  getPartAreaOverride,
  getSectionAreaOverride,
  normalizePositiveNumber,
  normalizeIdCollection,
  resolveContractPackageValue,
  resolveRelatedSiteBoundaryIdsByGeometryObject,
  withRelatedIdFallback,
  partOfSitesSource,
  sectionsSource,
  defaultWorkLotStatus,
}) => {
  const selectedSiteBoundary = computed(() => {
    siteBoundarySourceVersion.value;
    const id = uiStore.selectedSiteBoundaryId;
    const feature = findSiteBoundaryFeatureById(id);
    if (!feature) return null;
    const geometry = feature.getGeometry();
    const area =
      feature.get("area") ??
      (geometry && typeof geometry.getArea === "function" ? geometry.getArea() : null);
    const normalizedBoundaryId = String(feature.getId() ?? id);
    const relatedWorkLotIds = workLotStore.workLots
      .filter((lot) => {
        const normalizedContractPackage = normalizeContractPackage(
          resolveContractPackageValue([
            lot.contractPackage,
            lot.contract_package,
            lot.phase,
            lot.package,
            lot.contractNo,
          ])
        );
        const normalizedActiveContract = normalizeContractPackage(uiStore.activeContract);
        if (normalizedContractPackage !== normalizedActiveContract) return false;
        const relatedIds = Array.isArray(lot.relatedSiteBoundaryIds)
          ? lot.relatedSiteBoundaryIds
          : [];
        const normalizedBoundaryIdLower = normalizedBoundaryId.toLowerCase();
        return relatedIds.some(
          (relatedId) => String(relatedId).toLowerCase() === normalizedBoundaryIdLower
        );
      })
      .map((lot) => String(lot.id));
    return {
      id: normalizedBoundaryId,
      contractPackage: normalizeContractPackage(feature.get("contractPackage")),
      name: feature.get("name") ?? "",
      layer: feature.get("layer") ?? "—",
      entity: feature.get("entity") ?? "Polygon",
      area,
      contractNo: feature.get("contractNo") ?? "",
      futureUse: feature.get("futureUse") ?? "",
      completionDate: feature.get("completionDate") ?? "",
      others: feature.get("others") ?? "",
      plannedHandoverDate: feature.get("plannedHandoverDate") ?? "",
      handoverProgress: feature.get("handoverProgress") ?? 0,
      operatorTotal: feature.get("operatorTotal") ?? 0,
      operatorCompleted: feature.get("operatorCompleted") ?? 0,
      boundaryStatus: feature.get("boundaryStatus") ?? "Pending Clearance",
      boundaryStatusKey: feature.get("kpiStatus") ?? "PENDING_CLEARANCE",
      categoryAreasHectare: feature.get("categoryAreasHectare") ?? { BU: 0, HH: 0, GL: 0 },
      overdue: !!feature.get("overdue"),
      relatedWorkLotIds,
    };
  });

  const selectedPartOfSite = computed(() => {
    partOfSitesSourceVersion.value;
    const id = uiStore.selectedPartOfSiteId;
    const feature = findPartOfSitesFeatureById(id);
    if (!feature) return null;
    const meta = resolvePartOfSiteMeta(feature);
    const geometry = feature.getGeometry();
    const rawArea =
      geometry && typeof geometry.getArea === "function" ? Math.abs(geometry.getArea()) : 0;
    const partGeometryStat = getPartGeometryStatById(
      meta.partId,
      meta.contractPackage
    );
    const effectiveArea =
      Number.isFinite(partGeometryStat?.area) && partGeometryStat.area >= 0
        ? partGeometryStat.area
        : rawArea;
    const storedRawArea =
      Number.isFinite(partGeometryStat?.rawArea) && partGeometryStat.rawArea >= 0
        ? partGeometryStat.rawArea
        : rawArea;
    const overlapArea =
      Number.isFinite(partGeometryStat?.overlapArea) && partGeometryStat.overlapArea >= 0
        ? partGeometryStat.overlapArea
        : Math.max(0, storedRawArea - effectiveArea);
    const overrideArea = getPartAreaOverride(meta.partId, meta.contractPackage);
    const featureArea = normalizePositiveNumber(feature.get("area"));
    const areaValue = overrideArea ?? featureArea ?? effectiveArea;

    return {
      partId: meta.partId,
      id: meta.systemId,
      title: meta.label,
      contractPackage: meta.contractPackage,
      accessDate: meta.accessDate,
      sectionId: meta.sectionId,
      sectionIds: meta.sectionIds,
      area: areaValue,
      rawArea: storedRawArea,
      overlapArea,
      areaAdjusted: !!partGeometryStat?.wasAdjusted,
    };
  });

  const selectedSection = computed(() => {
    sectionSourceVersion.value;
    const id = uiStore.selectedSectionId;
    const feature = findSectionFeatureById(id);
    if (!feature) return null;
    const meta = resolveSectionMeta(feature);
    const partCount = Number(feature.get("partCount"));
    const geometry = feature.getGeometry();
    const rawArea =
      geometry && typeof geometry.getArea === "function" ? Math.abs(geometry.getArea()) : 0;
    const sectionGeometryStat = getSectionGeometryStatById(
      meta.sectionId,
      meta.contractPackage
    );
    const effectiveArea =
      Number.isFinite(sectionGeometryStat?.area) && sectionGeometryStat.area >= 0
        ? sectionGeometryStat.area
        : rawArea;
    const storedRawArea =
      Number.isFinite(sectionGeometryStat?.rawArea) && sectionGeometryStat.rawArea >= 0
        ? sectionGeometryStat.rawArea
        : rawArea;
    const overlapArea =
      Number.isFinite(sectionGeometryStat?.overlapArea) && sectionGeometryStat.overlapArea >= 0
        ? sectionGeometryStat.overlapArea
        : Math.max(0, storedRawArea - effectiveArea);
    const overrideArea = getSectionAreaOverride(meta.sectionId, meta.contractPackage);
    const featureArea = normalizePositiveNumber(feature.get("area"));
    const areaValue = overrideArea ?? featureArea ?? effectiveArea;
    return {
      id: meta.systemId,
      sectionId: meta.sectionId,
      title: meta.title,
      group: meta.group,
      contractPackage: meta.contractPackage,
      completionDate: meta.completionDate,
      partCount:
        Number.isFinite(partCount) && partCount >= 0 ? partCount : meta.relatedPartIds.length,
      relatedPartIds: meta.relatedPartIds,
      area: areaValue,
      rawArea: storedRawArea,
      overlapArea,
      areaAdjusted: !!sectionGeometryStat?.wasAdjusted,
    };
  });

  const selectedWorkLotRelatedSites = computed(() => {
    siteBoundarySourceVersion.value;
    return buildSelectedWorkLotRelatedSites({
      selectedWorkLot: selectedWorkLot.value,
      resolveRelatedSiteBoundaryIdsByGeometryObject,
      withRelatedIdFallback,
      findSiteBoundaryFeatureById,
    });
  });

  const selectedSiteBoundaryRelatedWorkLots = computed(() =>
    buildSelectedSiteBoundaryRelatedWorkLots({
      selectedSiteBoundary: selectedSiteBoundary.value,
      workLots: workLotStore.workLots,
      activeContract: uiStore.activeContract,
      resolveContractPackageValue,
      defaultWorkLotStatus,
    })
  );

  const selectedPartOfSiteRelatedSections = computed(() => {
    sectionSourceVersion.value;
    return buildSelectedPartOfSiteRelatedSections({
      selectedPartOfSite: selectedPartOfSite.value,
      normalizeIdCollection,
      findSectionFeatureById,
      resolveSectionMeta,
      activeContract: uiStore.activeContract,
      sectionFeatures: sectionsSource?.getFeatures() || [],
    });
  });

  const selectedSectionRelatedPartOfSites = computed(() => {
    partOfSitesSourceVersion.value;
    return buildSelectedSectionRelatedPartOfSites({
      selectedSection: selectedSection.value,
      normalizeIdCollection,
      findPartOfSitesFeatureById,
      resolvePartOfSiteMeta,
      activeContract: uiStore.activeContract,
      partOfSitesFeatures: partOfSitesSource?.getFeatures() || [],
    });
  });

  return {
    selectedSiteBoundary,
    selectedPartOfSite,
    selectedSection,
    selectedWorkLotRelatedSites,
    selectedSiteBoundaryRelatedWorkLots,
    selectedPartOfSiteRelatedSections,
    selectedSectionRelatedPartOfSites,
  };
};
