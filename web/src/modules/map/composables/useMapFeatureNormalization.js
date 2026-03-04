import {
  CONTRACT_PACKAGE,
  normalizeContractPackage,
  resolveContractPackage,
  toContractPhaseScopedId,
} from "../../../shared/utils/contractPackage";
import {
  buildPartOfSitesSystemId,
  buildSectionSystemId,
  getPartOfSitesLotId,
  getSectionLotId,
  normalizeDateValue,
  normalizeFeatureId,
  normalizeIdList,
  normalizePartOfSitesId,
  normalizePositiveNumber,
  normalizeSectionId,
} from "../utils/layerFeatureHelpers";

export const useMapFeatureNormalization = ({ partOfSitesStore, sectionsStore }) => {
  const normalizeContractPackageValue = (value, fallback = CONTRACT_PACKAGE.C2) =>
    normalizeContractPackage(value, { fallback });
  const resolveContractPackageValue = (values = [], fallback = CONTRACT_PACKAGE.C2) =>
    resolveContractPackage(values, { fallback });
  const isContractPackageVisible = (
    contractPackage,
    {
      showC1 = true,
      showC2 = true,
    } = {}
  ) => {
    const normalized = normalizeContractPackageValue(contractPackage, CONTRACT_PACKAGE.C2);
    if (normalized === CONTRACT_PACKAGE.C1) return !!showC1;
    return !!showC2;
  };

  const getPartAttributeOverride = (partId, contractPackage = "") => {
    const normalizedPartId = normalizePartOfSitesId(partId);
    if (!normalizedPartId || !partOfSitesStore) return null;
    if (typeof partOfSitesStore.attributeByPartId === "function") {
      return partOfSitesStore.attributeByPartId(normalizedPartId, contractPackage);
    }
    const scopedKey = toContractPhaseScopedId(contractPackage, normalizedPartId).toLowerCase();
    return (
      partOfSitesStore.attributeOverrides?.[scopedKey] ||
      partOfSitesStore.attributeOverrides?.[normalizedPartId.toLowerCase()] ||
      null
    );
  };

  const getSectionAttributeOverride = (sectionId, contractPackage = "") => {
    const normalizedSectionId = normalizeSectionId(sectionId);
    if (!normalizedSectionId || !sectionsStore) return null;
    if (typeof sectionsStore.attributeBySectionId === "function") {
      return sectionsStore.attributeBySectionId(normalizedSectionId, contractPackage);
    }
    const scopedKey = toContractPhaseScopedId(contractPackage, normalizedSectionId).toLowerCase();
    return (
      sectionsStore.attributeOverrides?.[scopedKey] ||
      sectionsStore.attributeOverrides?.[normalizedSectionId.toLowerCase()] ||
      null
    );
  };

  const normalizePartOfSitesFeature = (
    feature,
    {
      groupLabelHint = "",
      partIdHint = "",
      partLabelHint = "",
      featureIndex = 0,
    } = {}
  ) => {
    const lotId =
      normalizePartOfSitesId(feature?.get("partId")) ||
      normalizePartOfSitesId(feature?.get("part_id")) ||
      normalizePartOfSitesId(feature?.get("partOfSitesLotId")) ||
      normalizePartOfSitesId(partIdHint) ||
      getPartOfSitesLotId(feature, featureIndex);
    const groupLabel =
      normalizeFeatureId(feature?.get("partOfSitesGroup")) ||
      normalizeFeatureId(feature?.get("partGroup")) ||
      normalizeFeatureId(groupLabelHint) ||
      "Manual Draw";
    const lotLabel =
      normalizeFeatureId(feature?.get("partOfSitesLotLabel")) ||
      normalizeFeatureId(feature?.get("partId")) ||
      normalizeFeatureId(partLabelHint) ||
      lotId;
    const systemId =
      normalizeFeatureId(feature?.get("partOfSitesSystemId")) ||
      normalizeFeatureId(feature?.get("systemId")) ||
      normalizeFeatureId(feature?.getId?.()) ||
      buildPartOfSitesSystemId({
        groupLabel,
        partId: lotId,
        featureIndex,
      });
    const contractPackage = resolveContractPackageValue(
      [
        feature?.get("contractPackage"),
        feature?.get("contract_package"),
        feature?.get("phase"),
        feature?.get("package"),
        feature?.get("partOfSitesGroup"),
        feature?.get("partGroup"),
        groupLabelHint,
        feature?.get("sourceDxf"),
        feature?.get("sourceDxfs"),
      ],
      CONTRACT_PACKAGE.C2
    );

    const baseAccessDate = normalizeDateValue(feature.get("accessDate") || feature.get("access_date"));
    const baseArea = normalizePositiveNumber(feature.get("area"));
    const override = getPartAttributeOverride(lotId, contractPackage);
    const overrideAccessDate = normalizeDateValue(override?.accessDate);
    const overrideArea = normalizePositiveNumber(override?.area);
    const resolvedAccessDate = overrideAccessDate || baseAccessDate;
    const resolvedArea = overrideArea ?? baseArea;

    feature.setId(systemId);
    feature.set("partId", lotId);
    feature.set("partGroup", groupLabel);
    feature.set("partOfSitesLotId", lotId);
    feature.set("partOfSitesLotLabel", lotLabel);
    feature.set("partOfSitesSystemId", systemId);
    feature.set("partOfSitesGroup", groupLabel);
    feature.set("contractPackage", contractPackage);
    feature.unset("name", true);
    feature.set("accessDate", resolvedAccessDate);
    if (resolvedArea !== null) {
      feature.set("area", resolvedArea);
    } else {
      feature.unset("area", true);
    }
    if (override?.updatedAt) {
      feature.set("updatedAt", normalizeFeatureId(override.updatedAt) || "");
    }
    if (override?.updatedBy) {
      feature.set("updatedBy", normalizeFeatureId(override.updatedBy) || "");
    }
    feature.set("layerType", "partOfSites");
    feature.set("refId", lotId);
    return feature;
  };

  const normalizeSectionFeature = (
    feature,
    {
      groupLabelHint = "",
      sectionIdHint = "",
      sectionLabelHint = "",
      featureIndex = 0,
    } = {}
  ) => {
    const sectionId =
      normalizeSectionId(feature?.get("sectionId")) ||
      normalizeSectionId(feature?.get("section_id")) ||
      normalizeSectionId(feature?.get("sectionLotId")) ||
      normalizeSectionId(sectionIdHint) ||
      getSectionLotId(feature, featureIndex);
    const groupLabel =
      normalizeFeatureId(feature?.get("sectionGroup")) ||
      normalizeFeatureId(feature?.get("section_group")) ||
      normalizeFeatureId(groupLabelHint) ||
      "Manual Draw";
    const sectionLabel =
      normalizeFeatureId(feature?.get("sectionLotLabel")) ||
      normalizeFeatureId(feature?.get("sectionLabel")) ||
      normalizeFeatureId(sectionLabelHint) ||
      sectionId;
    const systemId =
      normalizeFeatureId(feature?.get("sectionSystemId")) ||
      normalizeFeatureId(feature?.get("systemId")) ||
      normalizeFeatureId(feature?.getId?.()) ||
      buildSectionSystemId({
        groupLabel,
        sectionId,
        featureIndex,
      });
    const contractPackage = resolveContractPackageValue(
      [
        feature?.get("contractPackage"),
        feature?.get("contract_package"),
        feature?.get("phase"),
        feature?.get("package"),
        feature?.get("sectionGroup"),
        feature?.get("section_group"),
        groupLabelHint,
        feature?.get("sourceDxf"),
        feature?.get("sourceDxfs"),
        feature?.get("description"),
      ],
      CONTRACT_PACKAGE.C2
    );

    const explicitRelatedPartIds = normalizeIdList(
      feature?.get("relatedPartIds") ||
        feature?.get("relatedPartLotIds") ||
        feature?.get("partIds")
    );
    const baseCompletionDate = normalizeDateValue(
      feature.get("completionDate") || feature.get("completion_date")
    );
    const baseArea = normalizePositiveNumber(feature.get("area"));
    const override = getSectionAttributeOverride(sectionId, contractPackage);
    const overrideCompletionDate = normalizeDateValue(override?.completionDate);
    const overrideArea = normalizePositiveNumber(override?.area);
    const resolvedCompletionDate = overrideCompletionDate || baseCompletionDate;
    const resolvedArea = overrideArea ?? baseArea;

    feature.setId(systemId);
    feature.set("sectionId", sectionId);
    feature.set("sectionGroup", groupLabel);
    feature.set("sectionLotId", sectionId);
    feature.set("sectionLotLabel", sectionLabel);
    feature.set("sectionSystemId", systemId);
    feature.set("contractPackage", contractPackage);
    feature.set("completionDate", resolvedCompletionDate);
    if (resolvedArea !== null) {
      feature.set("area", resolvedArea);
    } else {
      feature.unset("area", true);
    }
    if (override?.updatedAt) {
      feature.set("updatedAt", normalizeFeatureId(override.updatedAt) || "");
    }
    if (override?.updatedBy) {
      feature.set("updatedBy", normalizeFeatureId(override.updatedBy) || "");
    }
    feature.set("relatedPartIds", explicitRelatedPartIds);
    feature.set("partCount", explicitRelatedPartIds.length);
    feature.set("layerType", "section");
    feature.set("refId", sectionId);
    return feature;
  };

  return {
    normalizeContractPackageValue,
    resolveContractPackageValue,
    isContractPackageVisible,
    normalizePartOfSitesFeature,
    normalizeSectionFeature,
  };
};
