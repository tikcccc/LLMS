import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import {
  highlightPartOfSitesStyle,
  highlightSectionStyle,
  highlightSiteBoundaryStyle,
  highlightWorkLotStyle,
} from "../ol/styles";
import {
  normalizeWorkLotCategory,
  WORK_LOT_CATEGORY,
} from "../../../shared/utils/worklot";
import { normalizeContractPackage } from "../../../shared/utils/contractPackage";

export const useMapHighlights = ({
  createWorkFeature,
  selectedWorkLot,
  uiStore,
  partOfSitesSource,
  sectionsSource,
  siteBoundarySource,
  resolvePartOfSitesHighlightGeometry = null,
  resolveSectionHighlightGeometry = null,
}) => {
  const workHighlightSource = new VectorSource();
  const partOfSitesHighlightSource = new VectorSource();
  const sectionHighlightSource = new VectorSource();
  const siteBoundaryHighlightSource = new VectorSource();

  const workHighlightLayer = new VectorLayer({
    source: workHighlightSource,
    style: highlightWorkLotStyle,
  });

  workHighlightLayer.setZIndex(26);

  let highlightOverride = null;
  let partOfSitesHighlightOverride = null;
  let sectionHighlightOverride = null;
  let siteBoundaryHighlightOverride = null;

  const partOfSitesHighlightLayer = new VectorLayer({
    source: partOfSitesHighlightSource,
    style: highlightPartOfSitesStyle,
  });

  partOfSitesHighlightLayer.setZIndex(15);
  const sectionHighlightLayer = new VectorLayer({
    source: sectionHighlightSource,
    style: highlightSectionStyle,
  });

  sectionHighlightLayer.setZIndex(16);

  const siteBoundaryHighlightLayer = new VectorLayer({
    source: siteBoundaryHighlightSource,
    style: highlightSiteBoundaryStyle,
  });

  siteBoundaryHighlightLayer.setZIndex(17);

  const cloneFeature = (feature) => {
    if (!feature) return null;
    const clone = feature.clone();
    clone.setId(feature.getId());
    return clone;
  };

  const normalizeValue = (value) => String(value || "").trim();
  const normalizePartOfSitesId = (value) => {
    const normalized = normalizeValue(value);
    if (!normalized) return "";
    if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
    return normalized;
  };
  const normalizeSectionId = (value) => {
    const normalized = normalizeValue(value);
    if (!normalized) return "";
    if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
    return normalized;
  };
  const isSelectedInFilter = (mode, selectedIds = [], id) => {
    if (mode !== "custom") return true;
    const normalized = String(id || "").trim().toLowerCase();
    if (!normalized) return false;
    return selectedIds.some(
      (item) => String(item || "").trim().toLowerCase() === normalized
    );
  };

  const canShowSelectedWorkLot = () => {
    const lot = selectedWorkLot.value;
    if (!lot || !uiStore.showWorkLots) return false;
    const category = normalizeWorkLotCategory(lot.category ?? lot.type);
    if (category === WORK_LOT_CATEGORY.BU && !uiStore.showWorkLotsBusiness) return false;
    if (category === WORK_LOT_CATEGORY.HH && !uiStore.showWorkLotsDomestic) return false;
    if (category === WORK_LOT_CATEGORY.GL && !uiStore.showWorkLotsGovernment) return false;
    return isSelectedInFilter(uiStore.workLotFilterMode, uiStore.workLotSelectedIds, lot.id);
  };

  const canShowSelectedSiteBoundary = () => {
    const siteBoundaryId = uiStore.selectedSiteBoundaryId;
    if (!siteBoundaryId || !uiStore.showSiteBoundary) return false;
    return isSelectedInFilter(
      uiStore.siteBoundaryFilterMode,
      uiStore.siteBoundarySelectedIds,
      siteBoundaryId
    );
  };

  const canShowSelectedPartOfSite = () => {
    const partOfSiteId = uiStore.selectedPartOfSiteId;
    if (!partOfSiteId || !uiStore.showPartOfSites) return false;
    return isSelectedInFilter(
      uiStore.partOfSitesFilterMode,
      uiStore.partOfSitesSelectedIds,
      partOfSiteId
    );
  };
  const canShowSelectedSection = () => {
    const sectionId = uiStore.selectedSectionId;
    if (!sectionId || !uiStore.showSections) return false;
    return isSelectedInFilter(
      uiStore.sectionFilterMode,
      uiStore.sectionSelectedIds,
      sectionId
    );
  };

  const getPartOfSitesFeatureId = (feature, index = 0) =>
    normalizePartOfSitesId(feature?.get("partOfSitesLotId")) ||
    normalizePartOfSitesId(feature?.get("partId")) ||
    normalizePartOfSitesId(feature?.get("part_id")) ||
    normalizePartOfSitesId(feature?.get("refId")) ||
    normalizePartOfSitesId(feature?.getId?.()) ||
    `part_of_site_${String(index + 1).padStart(5, "0")}`;

  const getPartOfSitesFeaturesById = (id, contractPackage = uiStore.activeContract) => {
    const normalized = normalizePartOfSitesId(id).toLowerCase();
    const scopedContract = normalizeContractPackage(contractPackage);
    if (!normalized || !partOfSitesSource) return [];
    return partOfSitesSource.getFeatures().filter((feature, index) => {
      const refId = getPartOfSitesFeatureId(feature, index).toLowerCase();
      const featureContract = normalizeContractPackage(feature?.get("contractPackage"));
      return refId === normalized && featureContract === scopedContract;
    });
  };

  const resolvePartOfSitesHighlightTargets = (overrideFeature, selectedId) => {
    if (overrideFeature) {
      const overrideId = getPartOfSitesFeatureId(overrideFeature);
      const linked = getPartOfSitesFeaturesById(
        overrideId,
        overrideFeature?.get("contractPackage")
      );
      if (linked.length > 0) return linked;
      return [overrideFeature];
    }
    return getPartOfSitesFeaturesById(selectedId, uiStore.activeContract);
  };
  const getSectionFeatureId = (feature, index = 0) =>
    normalizeSectionId(feature?.get("sectionLotId")) ||
    normalizeSectionId(feature?.get("sectionId")) ||
    normalizeSectionId(feature?.get("section_id")) ||
    normalizeSectionId(feature?.get("refId")) ||
    normalizeSectionId(feature?.getId?.()) ||
    `section_${String(index + 1).padStart(5, "0")}`;

  const getSectionFeaturesById = (id, contractPackage = uiStore.activeContract) => {
    const normalized = normalizeSectionId(id).toLowerCase();
    const scopedContract = normalizeContractPackage(contractPackage);
    if (!normalized || !sectionsSource) return [];
    return sectionsSource.getFeatures().filter((feature, index) => {
      const refId = getSectionFeatureId(feature, index).toLowerCase();
      const featureContract = normalizeContractPackage(feature?.get("contractPackage"));
      return refId === normalized && featureContract === scopedContract;
    });
  };
  const resolveSectionHighlightTargets = (overrideFeature, selectedId) => {
    if (overrideFeature) {
      const overrideId = getSectionFeatureId(overrideFeature);
      const linked = getSectionFeaturesById(
        overrideId,
        overrideFeature?.get("contractPackage")
      );
      if (linked.length > 0) return linked;
      return [overrideFeature];
    }
    return getSectionFeaturesById(selectedId, uiStore.activeContract);
  };

  const refreshHighlights = () => {
    workHighlightSource.clear(true);
    partOfSitesHighlightSource.clear(true);
    sectionHighlightSource.clear(true);
    siteBoundaryHighlightSource.clear(true);

    const workFeature = canShowSelectedWorkLot()
      ? highlightOverride
        ? cloneFeature(highlightOverride)
        : createWorkFeature(selectedWorkLot.value)
      : null;
    if (workFeature) workHighlightSource.addFeature(workFeature);

    const siteBoundaryId = uiStore.selectedSiteBoundaryId;
    const siteBoundaryFeature = canShowSelectedSiteBoundary()
      ? siteBoundaryHighlightOverride
        ? cloneFeature(siteBoundaryHighlightOverride)
        : siteBoundaryId && siteBoundarySource
          ? cloneFeature(siteBoundarySource.getFeatureById(siteBoundaryId))
          : null
      : null;
    if (siteBoundaryFeature) siteBoundaryHighlightSource.addFeature(siteBoundaryFeature);

    const partOfSiteId = uiStore.selectedPartOfSiteId;
    const partOfSiteFeatures = canShowSelectedPartOfSite()
      ? resolvePartOfSitesHighlightTargets(partOfSitesHighlightOverride, partOfSiteId)
      : [];
    const resolvedPartGeometryResult =
      typeof resolvePartOfSitesHighlightGeometry === "function"
        ? resolvePartOfSitesHighlightGeometry(partOfSiteId, uiStore.activeContract)
        : undefined;
    if (resolvedPartGeometryResult && partOfSiteFeatures.length > 0) {
      const partHighlight = cloneFeature(partOfSiteFeatures[0]);
      if (partHighlight) {
        partHighlight.setGeometry(resolvedPartGeometryResult.clone());
        partOfSitesHighlightSource.addFeature(partHighlight);
      }
    } else if (resolvedPartGeometryResult === undefined) {
      partOfSiteFeatures
        .map((feature) => cloneFeature(feature))
        .filter(Boolean)
        .forEach((feature) => partOfSitesHighlightSource.addFeature(feature));
    }
    const sectionId = uiStore.selectedSectionId;
    const sectionFeatures = canShowSelectedSection()
      ? resolveSectionHighlightTargets(sectionHighlightOverride, sectionId)
      : [];
    const resolvedSectionGeometryResult =
      typeof resolveSectionHighlightGeometry === "function"
        ? resolveSectionHighlightGeometry(sectionId, uiStore.activeContract)
        : undefined;
    if (resolvedSectionGeometryResult && sectionFeatures.length > 0) {
      const sectionHighlight = cloneFeature(sectionFeatures[0]);
      if (sectionHighlight) {
        sectionHighlight.setGeometry(resolvedSectionGeometryResult.clone());
        sectionHighlightSource.addFeature(sectionHighlight);
      }
    } else if (resolvedSectionGeometryResult === undefined) {
      sectionFeatures
        .map((feature) => cloneFeature(feature))
        .filter(Boolean)
        .forEach((feature) => sectionHighlightSource.addFeature(feature));
    }
  };

  const setHighlightFeature = (layerType, feature) => {
    if (layerType === "work") {
      highlightOverride = feature || null;
    }
    if (layerType === "partOfSites") {
      partOfSitesHighlightOverride = feature || null;
    }
    if (layerType === "section") {
      sectionHighlightOverride = feature || null;
    }
    if (layerType === "siteBoundary") {
      siteBoundaryHighlightOverride = feature || null;
    }
    refreshHighlights();
  };

  const clearHighlightOverride = (layerType) => {
    if (!layerType || layerType === "work") {
      highlightOverride = null;
    }
    if (!layerType || layerType === "partOfSites") {
      partOfSitesHighlightOverride = null;
    }
    if (!layerType || layerType === "section") {
      sectionHighlightOverride = null;
    }
    if (!layerType || layerType === "siteBoundary") {
      siteBoundaryHighlightOverride = null;
    }
    refreshHighlights();
  };

  const updateHighlightVisibility = () => {
    workHighlightLayer.setVisible(canShowSelectedWorkLot());
    partOfSitesHighlightLayer.setVisible(canShowSelectedPartOfSite());
    sectionHighlightLayer.setVisible(canShowSelectedSection());
    siteBoundaryHighlightLayer.setVisible(canShowSelectedSiteBoundary());
  };

  return {
    workHighlightSource,
    workHighlightLayer,
    partOfSitesHighlightSource,
    partOfSitesHighlightLayer,
    sectionHighlightSource,
    sectionHighlightLayer,
    siteBoundaryHighlightSource,
    siteBoundaryHighlightLayer,
    refreshHighlights,
    setHighlightFeature,
    clearHighlightOverride,
    updateHighlightVisibility,
  };
};
