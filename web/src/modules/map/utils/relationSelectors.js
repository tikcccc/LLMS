const naturalCompare = (left, right) =>
  String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });

const compareByTitleThenId = (left, right) =>
  naturalCompare(left?.title, right?.title) || naturalCompare(left?.id, right?.id);

const compareByNameThenId = (left, right) =>
  naturalCompare(left?.name, right?.name) || naturalCompare(left?.id, right?.id);

export const buildSelectedWorkLotRelatedSites = ({
  selectedWorkLot,
  resolveRelatedSiteBoundaryIdsByGeometryObject,
  withRelatedIdFallback,
  findSiteBoundaryFeatureById,
} = {}) => {
  if (!selectedWorkLot) return [];

  const resolveIdsByGeometry =
    typeof resolveRelatedSiteBoundaryIdsByGeometryObject === "function"
      ? resolveRelatedSiteBoundaryIdsByGeometryObject
      : () => [];
  const resolveIdsWithFallback =
    typeof withRelatedIdFallback === "function"
      ? withRelatedIdFallback
      : (derived, fallback = []) =>
          Array.isArray(derived) && derived.length > 0
            ? derived
            : Array.isArray(fallback)
              ? fallback
              : [];

  const relatedSiteBoundaryIds = resolveIdsWithFallback(
    resolveIdsByGeometry(selectedWorkLot.geometry),
    selectedWorkLot.relatedSiteBoundaryIds
  );

  const normalizedUniqueIds = Array.from(
    new Set((relatedSiteBoundaryIds || []).map((item) => String(item)).filter(Boolean))
  );

  return normalizedUniqueIds
    .map((siteBoundaryId) => {
      const feature =
        typeof findSiteBoundaryFeatureById === "function"
          ? findSiteBoundaryFeatureById(siteBoundaryId)
          : null;
      if (!feature) return null;
      return {
        id: String(feature?.getId?.() ?? siteBoundaryId),
        name: feature?.get?.("name") ?? "",
        status: feature?.get?.("boundaryStatus") ?? "Pending Clearance",
        statusKey: feature?.get?.("kpiStatus") ?? "PENDING_CLEARANCE",
        plannedHandoverDate: feature?.get?.("plannedHandoverDate") ?? "",
        overdue: !!feature?.get?.("overdue"),
      };
    })
    .filter(Boolean)
    .sort(compareByNameThenId);
};

export const buildSelectedSiteBoundaryRelatedWorkLots = ({
  selectedSiteBoundary,
  workLots = [],
  activeContract = "C1",
  resolveContractPackageValue,
  defaultWorkLotStatus = "Waiting for Assessment",
} = {}) => {
  const siteBoundaryId = selectedSiteBoundary?.id;
  if (!siteBoundaryId) return [];

  const normalizedSiteBoundaryId = String(siteBoundaryId).toLowerCase();
  const normalizedActiveContract = String(activeContract || "").trim().toUpperCase() === "C1" ? "C1" : "C2";
  return [...workLots]
    .filter((lot) => {
      const contractPackage =
        typeof resolveContractPackageValue === "function"
          ? resolveContractPackageValue([
              lot?.contractPackage,
              lot?.contract_package,
              lot?.phase,
              lot?.package,
              lot?.contractNo,
            ])
          : String(lot?.contractPackage || "").trim().toUpperCase();
      const normalizedContract = contractPackage === "C1" ? "C1" : "C2";
      if (normalizedContract !== normalizedActiveContract) return false;
      const relatedIds = Array.isArray(lot?.relatedSiteBoundaryIds)
        ? lot.relatedSiteBoundaryIds
        : [];
      return relatedIds.some(
        (relatedId) => String(relatedId).toLowerCase() === normalizedSiteBoundaryId
      );
    })
    .map((lot) => ({
      id: String(lot?.id || ""),
      operatorName: lot?.operatorName || "Work Lot",
      status: lot?.status || defaultWorkLotStatus,
      dueDate: lot?.dueDate || "",
    }))
    .sort((left, right) => {
      const dueLeft = left?.dueDate || "9999-12-31";
      const dueRight = right?.dueDate || "9999-12-31";
      return dueLeft.localeCompare(dueRight) || naturalCompare(left?.operatorName, right?.operatorName);
    });
};

export const buildSelectedPartOfSiteRelatedSections = ({
  selectedPartOfSite,
  normalizeIdCollection,
  findSectionFeatureById,
  resolveSectionMeta,
  activeContract = "C1",
  sectionFeatures = [],
} = {}) => {
  const partId = selectedPartOfSite?.partId;
  if (!partId) return [];

  const normalizeIds =
    typeof normalizeIdCollection === "function" ? normalizeIdCollection : (value) => value || [];

  const explicitRelatedIds = normalizeIds(selectedPartOfSite?.sectionIds);
  const relatedById = new Map();

  if (explicitRelatedIds.length > 0) {
    explicitRelatedIds.forEach((sectionId) => {
      const normalizedSectionId = String(sectionId || "").trim();
      if (!normalizedSectionId) return;
      const key = normalizedSectionId.toLowerCase();
      if (relatedById.has(key)) return;

      const feature =
        typeof findSectionFeatureById === "function" ? findSectionFeatureById(normalizedSectionId) : null;
      if (feature && typeof resolveSectionMeta === "function") {
        const meta = resolveSectionMeta(feature);
        relatedById.set(key, {
          id: meta.sectionId,
          title: meta.title,
          group: meta.group,
          systemId: meta.systemId,
        });
        return;
      }

      relatedById.set(key, {
        id: normalizedSectionId,
        title: normalizedSectionId,
        group: "",
        systemId: "",
      });
    });
  } else if (typeof resolveSectionMeta === "function") {
    const normalizedPartId = String(partId).toLowerCase();
    const normalizedActiveContract =
      String(activeContract || "").trim().toUpperCase() === "C1" ? "C1" : "C2";
    sectionFeatures.forEach((feature, index) => {
      const meta = resolveSectionMeta(feature, index);
      const normalizedContract =
        String(meta?.contractPackage || "").trim().toUpperCase() === "C1" ? "C1" : "C2";
      if (normalizedContract !== normalizedActiveContract) return;
      const relatedPartIds = (meta?.relatedPartIds || []).map((value) => String(value).toLowerCase());
      if (!relatedPartIds.includes(normalizedPartId)) return;
      const key = String(meta?.sectionId || "").toLowerCase();
      if (!key || relatedById.has(key)) return;
      relatedById.set(key, {
        id: meta.sectionId,
        title: meta.title,
        group: meta.group,
        systemId: meta.systemId,
      });
    });
  }

  return Array.from(relatedById.values()).sort(compareByTitleThenId);
};

export const buildSelectedSectionRelatedPartOfSites = ({
  selectedSection,
  normalizeIdCollection,
  findPartOfSitesFeatureById,
  resolvePartOfSiteMeta,
  activeContract = "C1",
  partOfSitesFeatures = [],
} = {}) => {
  const sectionId = selectedSection?.sectionId;
  if (!sectionId) return [];

  const normalizeIds =
    typeof normalizeIdCollection === "function" ? normalizeIdCollection : (value) => value || [];

  const explicitRelatedIds = normalizeIds(selectedSection?.relatedPartIds);
  const relatedById = new Map();

  if (explicitRelatedIds.length > 0) {
    explicitRelatedIds.forEach((partId) => {
      const normalizedPartId = String(partId || "").trim();
      if (!normalizedPartId) return;
      const key = normalizedPartId.toLowerCase();
      if (relatedById.has(key)) return;

      const feature =
        typeof findPartOfSitesFeatureById === "function"
          ? findPartOfSitesFeatureById(normalizedPartId)
          : null;
      if (feature && typeof resolvePartOfSiteMeta === "function") {
        const meta = resolvePartOfSiteMeta(feature);
        relatedById.set(key, {
          id: meta.partId,
          title: meta.label,
          group: meta.group,
          systemId: meta.systemId,
        });
        return;
      }

      relatedById.set(key, {
        id: normalizedPartId,
        title: normalizedPartId,
        group: "",
        systemId: "",
      });
    });
  } else if (typeof resolvePartOfSiteMeta === "function") {
    const normalizedSectionId = String(sectionId).toLowerCase();
    const normalizedActiveContract =
      String(activeContract || "").trim().toUpperCase() === "C1" ? "C1" : "C2";
    partOfSitesFeatures.forEach((feature, index) => {
      const meta = resolvePartOfSiteMeta(feature, index);
      const normalizedContract =
        String(meta?.contractPackage || "").trim().toUpperCase() === "C1" ? "C1" : "C2";
      if (normalizedContract !== normalizedActiveContract) return;
      const sectionIds = (meta?.sectionIds || []).map((value) => String(value).toLowerCase());
      if (!sectionIds.includes(normalizedSectionId)) return;
      const key = String(meta?.partId || "").toLowerCase();
      if (!key || relatedById.has(key)) return;
      relatedById.set(key, {
        id: meta.partId,
        title: meta.label,
        group: meta.group,
        systemId: meta.systemId,
      });
    });
  }

  return Array.from(relatedById.values()).sort(compareByTitleThenId);
};
