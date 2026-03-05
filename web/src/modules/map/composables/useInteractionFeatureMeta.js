import { normalizeContractPackage } from "../../../shared/utils/contractPackage";
import { resolvePartGroupLabel } from "../../../shared/utils/partGroup";
import {
  buildManualPartOfSitesId as buildManualPartOfSitesIdForSource,
  buildManualPartOfSitesSystemId as buildManualPartOfSitesSystemIdForSource,
  buildManualSectionId as buildManualSectionIdForSource,
  buildManualSectionSystemId as buildManualSectionSystemIdForSource,
  getPartOfSitesIdFromFeature,
  getSectionIdFromFeature,
  normalizePartId,
  normalizeValue,
} from "../utils/interactionHelpers";

export const useInteractionFeatureMeta = ({ partOfSitesSource, sectionsSource }) => {
  const buildManualPartOfSitesId = () => buildManualPartOfSitesIdForSource(partOfSitesSource);
  const buildManualPartOfSitesSystemId = (partId) =>
    buildManualPartOfSitesSystemIdForSource(partOfSitesSource, partId);
  const buildManualSectionId = () => buildManualSectionIdForSource(sectionsSource);
  const buildManualSectionSystemId = (sectionId) =>
    buildManualSectionSystemIdForSource(sectionsSource, sectionId);

  const ensurePartOfSitesFeatureMeta = (feature) => {
    if (!feature) return null;
    const partId = getPartOfSitesIdFromFeature(feature) || buildManualPartOfSitesId();
    const systemId =
      normalizeValue(feature.get("partOfSitesSystemId")) ||
      buildManualPartOfSitesSystemId(partId);
    const partGroup = resolvePartGroupLabel(
      partId,
      normalizeValue(feature.get("partOfSitesGroup")) ||
        normalizeValue(feature.get("partGroup")) ||
        "Manual Draw"
    );
    feature.setId(systemId);
    feature.set("partId", partId);
    feature.set("partGroup", partGroup);
    feature.set("partOfSitesLotId", partId);
    feature.set(
      "partOfSitesLotLabel",
      normalizeValue(feature.get("partOfSitesLotLabel")) || partId
    );
    feature.set("partOfSitesSystemId", systemId);
    feature.set("partOfSitesGroup", partGroup);
    feature.set(
      "contractPackage",
      normalizeContractPackage(
        feature.get("contractPackage") ||
          feature.get("contract_package") ||
          feature.get("phase") ||
          feature.get("package")
      )
    );
    feature.set(
      "accessDate",
      normalizeValue(feature.get("accessDate") || feature.get("access_date"))
    );
    const areaValue = Number(feature.get("area"));
    if (!Number.isFinite(areaValue) || areaValue <= 0) {
      const geometry = feature.getGeometry();
      const geometryArea =
        geometry && typeof geometry.getArea === "function"
          ? Math.abs(geometry.getArea())
          : 0;
      if (geometryArea > 0) {
        feature.set("area", geometryArea);
      }
    }
    feature.set("layerType", "partOfSites");
    feature.set("refId", partId);
    return { partId, systemId };
  };

  const ensureSectionFeatureMeta = (feature) => {
    if (!feature) return null;
    const sectionId = getSectionIdFromFeature(feature) || buildManualSectionId();
    const systemId =
      normalizeValue(feature.get("sectionSystemId")) ||
      buildManualSectionSystemId(sectionId);
    feature.setId(systemId);
    feature.set("sectionId", sectionId);
    feature.set("sectionLotId", sectionId);
    feature.set(
      "sectionLotLabel",
      normalizeValue(feature.get("sectionLotLabel") || feature.get("sectionLabel")) || sectionId
    );
    feature.set(
      "sectionGroup",
      normalizeValue(feature.get("sectionGroup") || feature.get("section_group")) || "Manual Draw"
    );
    feature.set(
      "contractPackage",
      normalizeContractPackage(
        feature.get("contractPackage") ||
          feature.get("contract_package") ||
          feature.get("phase") ||
          feature.get("package")
      )
    );
    feature.set("sectionSystemId", systemId);
    feature.set(
      "completionDate",
      normalizeValue(feature.get("completionDate") || feature.get("completion_date"))
    );
    const relatedPartIdsRaw =
      feature.get("relatedPartIds") || feature.get("relatedPartLotIds") || feature.get("partIds");
    const relatedPartIds = Array.isArray(relatedPartIdsRaw)
      ? Array.from(
          new Set(
            relatedPartIdsRaw
              .map((item) => normalizePartId(item))
              .filter(Boolean)
          )
        )
      : [];
    feature.set("relatedPartIds", relatedPartIds);
    feature.set("partCount", relatedPartIds.length);
    const areaValue = Number(feature.get("area"));
    if (!Number.isFinite(areaValue) || areaValue <= 0) {
      const geometry = feature.getGeometry();
      const geometryArea =
        geometry && typeof geometry.getArea === "function"
          ? Math.abs(geometry.getArea())
          : 0;
      if (geometryArea > 0) {
        feature.set("area", geometryArea);
      }
    }
    feature.set("layerType", "section");
    feature.set("refId", sectionId);
    return { sectionId, systemId };
  };

  return {
    ensurePartOfSitesFeatureMeta,
    ensureSectionFeatureMeta,
  };
};
