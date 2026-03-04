const normalizeText = (value) => String(value || "").trim();

export const normalizePartValue = normalizeText;
export const normalizeSectionValue = normalizeText;

const normalizePartToken = (value, fallback) => {
  const token = normalizePartValue(value).replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return token || fallback;
};

export const buildPartOfSitesSystemId = (groupLabel, partId, featureIndex = 0) => {
  const seq = String(Math.max(0, Number(featureIndex) || 0) + 1).padStart(3, "0");
  return `POS-${normalizePartToken(groupLabel, "PART")}-${normalizePartToken(partId, "UNK")}-${seq}`;
};

export const buildSectionSystemId = (groupLabel, sectionId, featureIndex = 0) => {
  const seq = String(Math.max(0, Number(featureIndex) || 0) + 1).padStart(3, "0");
  return `SOW-${normalizePartToken(groupLabel, "SEC")}-${normalizePartToken(sectionId, "UNK")}-${seq}`;
};

export const normalizePositiveNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

export const normalizeIdCollection = (value) => {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => normalizeText(item)).filter(Boolean)));
  }
  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
  }
  return [];
};

export const createPartOfSiteMetaResolver =
  ({ resolveContractPackageValue } = {}) =>
  (feature, index = 0) => {
    const resolvePackage =
      typeof resolveContractPackageValue === "function"
        ? resolveContractPackageValue
        : (value) => String(Array.isArray(value) ? value[0] || "" : value || "").trim();
    const partId =
      normalizePartValue(feature?.get("partOfSitesLotId")) ||
      normalizePartValue(feature?.get("partId")) ||
      normalizePartValue(feature?.get("part_id")) ||
      normalizePartValue(feature?.get("refId")) ||
      normalizePartValue(feature?.getId?.()) ||
      normalizePartValue(feature?.get("id")) ||
      `part_of_site_${String(index + 1).padStart(5, "0")}`;
    const label =
      normalizePartValue(feature?.get("partOfSitesLotLabel")) ||
      normalizePartValue(feature?.get("partId")) ||
      partId;
    const group =
      normalizePartValue(feature?.get("partOfSitesGroup")) ||
      normalizePartValue(feature?.get("partGroup"));
    const systemId =
      normalizePartValue(feature?.get("partOfSitesSystemId")) ||
      normalizePartValue(feature?.get("systemId")) ||
      buildPartOfSitesSystemId(group, partId, index);
    const accessDate =
      normalizePartValue(feature?.get("accessDate")) ||
      normalizePartValue(feature?.get("access_date"));
    const contractPackage = resolvePackage([
      feature?.get("contractPackage"),
      feature?.get("contract_package"),
      feature?.get("phase"),
      feature?.get("package"),
      feature?.get("partOfSitesGroup"),
      feature?.get("partGroup"),
      feature?.get("sourceDxf"),
      feature?.get("sourceDxfs"),
    ]);
    const sectionIds = normalizeIdCollection(
      feature?.get("sectionIds") || feature?.get("relatedSectionIds")
    );
    const sectionId =
      normalizePartValue(feature?.get("sectionId")) ||
      normalizePartValue(feature?.get("section_id")) ||
      sectionIds[0] ||
      "";

    return {
      partId,
      label,
      group,
      systemId,
      accessDate,
      contractPackage,
      sectionId,
      sectionIds: sectionId ? Array.from(new Set([sectionId, ...sectionIds])) : sectionIds,
    };
  };

export const createSectionMetaResolver =
  ({ resolveContractPackageValue } = {}) =>
  (feature, index = 0) => {
    const resolvePackage =
      typeof resolveContractPackageValue === "function"
        ? resolveContractPackageValue
        : (value) => String(Array.isArray(value) ? value[0] || "" : value || "").trim();
    const sectionId =
      normalizeSectionValue(feature?.get("sectionLotId")) ||
      normalizeSectionValue(feature?.get("sectionId")) ||
      normalizeSectionValue(feature?.get("section_id")) ||
      normalizeSectionValue(feature?.get("refId")) ||
      normalizeSectionValue(feature?.getId?.()) ||
      normalizeSectionValue(feature?.get("id")) ||
      `section_${String(index + 1).padStart(5, "0")}`;
    const title =
      normalizeSectionValue(feature?.get("sectionLotLabel")) ||
      normalizeSectionValue(feature?.get("sectionLabel")) ||
      sectionId;
    const group =
      normalizeSectionValue(feature?.get("sectionGroup")) ||
      normalizeSectionValue(feature?.get("section_group"));
    const systemId =
      normalizeSectionValue(feature?.get("sectionSystemId")) ||
      normalizeSectionValue(feature?.get("systemId")) ||
      buildSectionSystemId(group, sectionId, index);
    const completionDate =
      normalizeSectionValue(feature?.get("completionDate")) ||
      normalizeSectionValue(feature?.get("completion_date"));
    const contractPackage = resolvePackage([
      feature?.get("contractPackage"),
      feature?.get("contract_package"),
      feature?.get("phase"),
      feature?.get("package"),
      feature?.get("sectionGroup"),
      feature?.get("section_group"),
      feature?.get("sourceDxf"),
      feature?.get("sourceDxfs"),
      feature?.get("description"),
    ]);
    const relatedPartIds = normalizeIdCollection(
      feature?.get("relatedPartIds") ||
        feature?.get("relatedPartLotIds") ||
        feature?.get("partIds")
    );
    return {
      sectionId,
      title,
      group,
      systemId,
      contractPackage,
      completionDate,
      relatedPartIds,
    };
  };
