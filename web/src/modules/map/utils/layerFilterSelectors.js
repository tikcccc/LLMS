const naturalCompare = (left, right) =>
  String(left ?? "").localeCompare(String(right ?? ""), undefined, { numeric: true });

const compareById = (left, right) => naturalCompare(left?.id, right?.id);

const compareByLabelThenId = (left, right) =>
  naturalCompare(left?.label, right?.label) || naturalCompare(left?.id, right?.id);

const compareByTitleThenId = (left, right) =>
  naturalCompare(left?.title, right?.title) || naturalCompare(left?.id, right?.id);

const readFeatureValue = (feature, key) =>
  feature && typeof feature.get === "function" ? feature.get(key) : undefined;

const readFeatureId = (feature) =>
  feature && typeof feature.getId === "function" ? feature.getId() : undefined;

const resolvePackageValue = (resolver, values = []) => {
  if (typeof resolver === "function") return resolver(values);
  if (Array.isArray(values)) {
    return String(values.find((value) => value !== null && value !== undefined && value !== "") || "").trim();
  }
  return String(values || "").trim();
};

const resolveWorkLotCategoryCode = (normalizedCategory, workLotCategory = {}) => {
  if (normalizedCategory === workLotCategory.BU) return "BU";
  if (normalizedCategory === workLotCategory.HH) return "HH";
  return "GL";
};

const matchFields = (fuzzyMatchAny, fields = [], query = "") => {
  if (typeof fuzzyMatchAny === "function") {
    return fuzzyMatchAny(fields, query);
  }
  const normalizedQuery = String(query || "").trim().toLowerCase();
  if (!normalizedQuery) return true;
  return fields.some((value) => String(value || "").toLowerCase().includes(normalizedQuery));
};

export const buildLayerFilterOptions = ({
  workLots = [],
  siteBoundaryFeatures = [],
  partOfSitesFeatures = [],
  sectionFeatures = [],
  resolveContractPackageValue,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  normalizeWorkLotCategory,
  workCategoryLabel,
  workLotCategory,
} = {}) => {
  const normalizeCategory =
    typeof normalizeWorkLotCategory === "function"
      ? normalizeWorkLotCategory
      : (value) => String(value || "");
  const toCategoryLabel =
    typeof workCategoryLabel === "function" ? workCategoryLabel : (value) => String(value || "");

  const normalizedWorkLots = [...workLots]
    .map((lot) => {
      const normalizedCategory = normalizeCategory(lot?.category ?? lot?.type);
      return {
        id: String(lot?.id || ""),
        contractPackage: resolvePackageValue(resolveContractPackageValue, [
          lot?.contractPackage,
          lot?.contract_package,
          lot?.phase,
          lot?.package,
          lot?.contractNo,
        ]),
        label: lot?.operatorName || "Work Lot",
        category: normalizedCategory,
        categoryLabel: toCategoryLabel(normalizedCategory),
        categoryCode: resolveWorkLotCategoryCode(normalizedCategory, workLotCategory),
        status: lot?.status || "",
        dueDate: lot?.dueDate || "",
      };
    })
    .sort(compareByLabelThenId);

  const normalizedSiteBoundaries = [...siteBoundaryFeatures]
    .map((feature, index) => {
      const id = String(
        readFeatureId(feature) ?? readFeatureValue(feature, "refId") ?? `site_boundary_${index + 1}`
      );
      return {
        id,
        contractPackage: resolvePackageValue(resolveContractPackageValue, [
          readFeatureValue(feature, "contractPackage"),
          readFeatureValue(feature, "contract_package"),
          readFeatureValue(feature, "phase"),
          readFeatureValue(feature, "package"),
          readFeatureValue(feature, "contractNo"),
          readFeatureValue(feature, "layer"),
        ]),
        label: readFeatureValue(feature, "name") || "Site Boundary",
        boundaryStatus: readFeatureValue(feature, "boundaryStatus") || "Pending Clearance",
        boundaryStatusKey: readFeatureValue(feature, "boundaryStatusKey") || "PENDING_CLEARANCE",
        overdue: !!readFeatureValue(feature, "overdue"),
      };
    })
    .sort(compareByLabelThenId);

  const partById = new Map();
  if (typeof resolvePartOfSiteMeta === "function") {
    partOfSitesFeatures.forEach((feature, index) => {
      const meta = resolvePartOfSiteMeta(feature, index);
      if (!meta?.partId || partById.has(meta.partId)) return;
      partById.set(meta.partId, {
        id: meta.partId,
        contractPackage: meta.contractPackage,
        label: meta.label,
        group: meta.group,
        systemId: meta.systemId,
        accessDate: meta.accessDate,
      });
    });
  }
  const partOfSites = Array.from(partById.values()).sort(compareByLabelThenId);

  const sectionById = new Map();
  if (typeof resolveSectionMeta === "function") {
    sectionFeatures.forEach((feature, index) => {
      const meta = resolveSectionMeta(feature, index);
      if (!meta?.sectionId || sectionById.has(meta.sectionId)) return;
      sectionById.set(meta.sectionId, {
        id: meta.sectionId,
        contractPackage: meta.contractPackage,
        label: meta.title,
        group: meta.group,
        systemId: meta.systemId,
        partCount: Number(readFeatureValue(feature, "partCount")) || meta.relatedPartIds.length || 0,
      });
    });
  }
  const sections = Array.from(sectionById.values()).sort(compareByLabelThenId);

  return {
    workLots: normalizedWorkLots,
    siteBoundaries: normalizedSiteBoundaries,
    partOfSites,
    sections,
  };
};

export const buildWorkLotResults = ({
  workLots = [],
  query = "",
  fuzzyMatchAny,
  workCategoryLabel,
  limit = 80,
} = {}) => {
  const trimmedQuery = String(query || "").trim();
  const sortedWorkLots = [...workLots].sort((left, right) => compareById(left, right));
  if (!trimmedQuery) {
    return sortedWorkLots.slice(0, limit);
  }
  const toCategoryLabel =
    typeof workCategoryLabel === "function" ? workCategoryLabel : (value) => String(value || "");
  return sortedWorkLots
    .filter((lot) =>
      matchFields(
        fuzzyMatchAny,
        [
          lot?.id,
          (lot?.relatedSiteBoundaryIds || []).join(", "),
          lot?.operatorName,
          toCategoryLabel(lot?.category),
          lot?.responsiblePerson,
          lot?.assessDate,
          lot?.dueDate,
          lot?.completionDate,
          lot?.floatMonths,
          lot?.area,
          lot?.status,
          lot?.description,
          lot?.remark,
        ],
        trimmedQuery
      )
    )
    .slice(0, limit);
};

export const buildPartOfSitesResults = ({
  partOfSitesFeatures = [],
  query = "",
  fuzzyMatchAny,
  resolvePartOfSiteMeta,
  limit = 120,
} = {}) => {
  if (!partOfSitesFeatures.length || typeof resolvePartOfSiteMeta !== "function") return [];

  const partById = new Map();
  partOfSitesFeatures.forEach((feature, index) => {
    const meta = resolvePartOfSiteMeta(feature, index);
    if (!meta?.partId || partById.has(meta.partId)) return;
    partById.set(meta.partId, {
      id: meta.partId,
      title: meta.label,
      group: meta.group,
      systemId: meta.systemId,
      accessDate: meta.accessDate,
    });
  });

  const trimmedQuery = String(query || "").trim();
  return Array.from(partById.values())
    .filter((item) =>
      matchFields(
        fuzzyMatchAny,
        [item?.id, item?.title, item?.group, item?.systemId, item?.accessDate],
        trimmedQuery
      )
    )
    .sort(compareByTitleThenId)
    .slice(0, limit);
};

export const buildSectionResults = ({
  sectionFeatures = [],
  query = "",
  fuzzyMatchAny,
  resolveSectionMeta,
  limit = 120,
} = {}) => {
  if (!sectionFeatures.length || typeof resolveSectionMeta !== "function") return [];

  const sectionById = new Map();
  sectionFeatures.forEach((feature, index) => {
    const meta = resolveSectionMeta(feature, index);
    if (!meta?.sectionId || sectionById.has(meta.sectionId)) return;
    const partCount = Number(readFeatureValue(feature, "partCount"));
    sectionById.set(meta.sectionId, {
      id: meta.sectionId,
      title: meta.title,
      group: meta.group,
      systemId: meta.systemId,
      completionDate: meta.completionDate,
      partCount: Number.isFinite(partCount) && partCount >= 0 ? partCount : meta.relatedPartIds.length,
    });
  });

  const trimmedQuery = String(query || "").trim();
  return Array.from(sectionById.values())
    .filter((item) =>
      matchFields(
        fuzzyMatchAny,
        [
          item?.id,
          item?.title,
          item?.group,
          item?.systemId,
          item?.completionDate,
          item?.partCount,
        ],
        trimmedQuery
      )
    )
    .sort(compareByTitleThenId)
    .slice(0, limit);
};

const normalizeScopeIdList = (values = []) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );

const normalizeFeatureId = (feature, fallback = "") =>
  String(readFeatureId(feature) ?? readFeatureValue(feature, "refId") ?? fallback);

const normalizeBoundaryId = (value) => String(value || "").trim().toLowerCase();

export const buildSiteBoundaryResults = ({
  siteBoundaryFeatures = [],
  workLots = [],
  query = "",
} = {}) => {
  if (!siteBoundaryFeatures.length) return [];

  const workLotCountByBoundaryId = workLots.reduce((map, lot) => {
    const relatedIds = Array.isArray(lot?.relatedSiteBoundaryIds)
      ? lot.relatedSiteBoundaryIds
      : [];
    relatedIds
      .map((value) => normalizeBoundaryId(value))
      .filter(Boolean)
      .forEach((normalizedId) => {
        map.set(normalizedId, (map.get(normalizedId) || 0) + 1);
      });
    return map;
  }, new Map());

  const normalizedQuery = String(query || "").trim().toLowerCase();
  return siteBoundaryFeatures
    .map((feature, index) => {
      const fallbackId = `site_boundary_${String(index + 1).padStart(5, "0")}`;
      const id = normalizeFeatureId(feature, fallbackId);
      const fallbackCount = Number(readFeatureValue(feature, "operatorTotal"));
      const mappedCount = workLotCountByBoundaryId.get(normalizeBoundaryId(id));
      const workLotCount = Number.isFinite(mappedCount)
        ? mappedCount
        : Number.isFinite(fallbackCount)
          ? fallbackCount
          : 0;
      return {
        id,
        name: readFeatureValue(feature, "name") ?? "",
        plannedHandoverDate: readFeatureValue(feature, "plannedHandoverDate") ?? "",
        boundaryStatus: readFeatureValue(feature, "boundaryStatus") ?? "Pending Clearance",
        boundaryStatusKey: readFeatureValue(feature, "kpiStatus") ?? "PENDING_CLEARANCE",
        overdue: !!readFeatureValue(feature, "overdue"),
        workLotCount,
      };
    })
    .filter((item) => {
      if (!normalizedQuery) return true;
      return (
        String(item.id || "").toLowerCase().includes(normalizedQuery) ||
        String(item.name || "").toLowerCase().includes(normalizedQuery) ||
        String(item.boundaryStatus || "").toLowerCase().includes(normalizedQuery) ||
        String(item.plannedHandoverDate || "").toLowerCase().includes(normalizedQuery) ||
        String(item.workLotCount).includes(normalizedQuery)
      );
    })
    .sort(compareById);
};

export const buildScopeWorkLotResults = ({ scopeWorkLotIds = [], workLots = [] } = {}) => {
  const normalizedScopeIds = normalizeScopeIdList(scopeWorkLotIds);
  if (!normalizedScopeIds.length) return [];
  const byId = new Map(workLots.map((lot) => [String(lot?.id || ""), lot]));
  return normalizedScopeIds.map((id) => byId.get(id)).filter(Boolean);
};

export const buildScopeSiteBoundaryResults = ({
  scopeSiteBoundaryIds = [],
  findSiteBoundaryFeatureById,
} = {}) => {
  const normalizedScopeIds = normalizeScopeIdList(scopeSiteBoundaryIds);
  if (!normalizedScopeIds.length || typeof findSiteBoundaryFeatureById !== "function") return [];

  return normalizedScopeIds
    .map((id) => findSiteBoundaryFeatureById(id))
    .filter(Boolean)
    .map((feature) => ({
      id: normalizeFeatureId(feature),
      name: readFeatureValue(feature, "name") ?? "",
    }))
    .sort(compareByLabelThenId);
};

export const buildScopePartOfSitesResults = ({
  scopePartOfSitesIds = [],
  findPartOfSitesFeatureById,
  resolvePartOfSiteMeta,
} = {}) => {
  const normalizedScopeIds = normalizeScopeIdList(scopePartOfSitesIds);
  if (
    !normalizedScopeIds.length ||
    typeof findPartOfSitesFeatureById !== "function" ||
    typeof resolvePartOfSiteMeta !== "function"
  ) {
    return [];
  }
  return normalizedScopeIds
    .map((id) => findPartOfSitesFeatureById(id))
    .filter(Boolean)
    .map((feature, index) => {
      const meta = resolvePartOfSiteMeta(feature, index);
      return {
        id: meta.partId,
        title: meta.label,
        group: meta.group,
        systemId: meta.systemId,
      };
    })
    .sort(compareByTitleThenId);
};

export const buildScopeSectionResults = ({
  scopeSectionIds = [],
  findSectionFeatureById,
  resolveSectionMeta,
} = {}) => {
  const normalizedScopeIds = normalizeScopeIdList(scopeSectionIds);
  if (
    !normalizedScopeIds.length ||
    typeof findSectionFeatureById !== "function" ||
    typeof resolveSectionMeta !== "function"
  ) {
    return [];
  }
  return normalizedScopeIds
    .map((id) => findSectionFeatureById(id))
    .filter(Boolean)
    .map((feature, index) => {
      const meta = resolveSectionMeta(feature, index);
      return {
        id: meta.sectionId,
        title: meta.title,
        group: meta.group,
        systemId: meta.systemId,
      };
    })
    .sort(compareByTitleThenId);
};
