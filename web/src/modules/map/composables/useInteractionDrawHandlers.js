import { getCenter } from "ol/extent";

export const useInteractionDrawHandlers = ({
  workSources,
  siteBoundarySource,
  partOfSitesSource,
  sectionsSource,
  onScopeQueryResult,
  activeLayerType,
  uiStore,
  pendingGeometry,
  hasDraft,
  showWorkDialog,
  showSiteBoundaryDialog,
  onSiteBoundaryDrawStart,
  clearHighlightOverride,
  notifyPartOfSitesSourceChange,
  notifySectionsSourceChange,
  ensurePartOfSitesFeatureMeta,
  ensureSectionFeatureMeta,
  format,
  projectionCode,
  setDraftFeature,
}) => {
  const featureIntersectsScope = (feature, scopeGeometry) => {
    const geometry = feature?.getGeometry();
    if (!geometry || !scopeGeometry) return false;

    const scopeExtent = scopeGeometry.getExtent();
    const featureExtent = geometry.getExtent();

    if (!geometry.intersectsExtent(scopeExtent)) return false;
    if (!scopeGeometry.intersectsExtent(featureExtent)) return false;

    const featureCenter = getCenter(featureExtent);
    if (scopeGeometry.intersectsCoordinate(featureCenter)) return true;

    const scopeCenter = getCenter(scopeExtent);
    if (geometry.intersectsCoordinate(scopeCenter)) return true;

    return true;
  };

  const collectScopeMatches = (scopeGeometry) => {
    const workLotIds = [];
    (workSources || []).forEach((source) => {
      source?.getFeatures().forEach((feature) => {
        if (!featureIntersectsScope(feature, scopeGeometry)) return;
        const id = feature.get("refId") || feature.getId();
        if (id !== null && id !== undefined) {
          workLotIds.push(String(id));
        }
      });
    });

    const siteBoundaryIds = [];
    siteBoundarySource?.getFeatures().forEach((feature) => {
      if (!featureIntersectsScope(feature, scopeGeometry)) return;
      const id = feature.get("refId") || feature.getId();
      if (id !== null && id !== undefined) {
        siteBoundaryIds.push(String(id));
      }
    });

    const partOfSitesIds = [];
    partOfSitesSource?.getFeatures().forEach((feature) => {
      if (!featureIntersectsScope(feature, scopeGeometry)) return;
      const id =
        feature.get("partOfSitesLotId") ||
        feature.get("partId") ||
        feature.get("part_id") ||
        feature.get("refId") ||
        feature.getId();
      if (id !== null && id !== undefined) {
        partOfSitesIds.push(String(id));
      }
    });

    const sectionIds = [];
    sectionsSource?.getFeatures().forEach((feature) => {
      if (!featureIntersectsScope(feature, scopeGeometry)) return;
      const id =
        feature.get("sectionLotId") ||
        feature.get("sectionId") ||
        feature.get("section_id") ||
        feature.get("refId") ||
        feature.getId();
      if (id !== null && id !== undefined) {
        sectionIds.push(String(id));
      }
    });

    return {
      workLotIds: Array.from(new Set(workLotIds)),
      siteBoundaryIds: Array.from(new Set(siteBoundaryIds)),
      partOfSitesIds: Array.from(new Set(partOfSitesIds)),
      sectionIds: Array.from(new Set(sectionIds)),
    };
  };

  const handleScopeDrawEnd = (event) => {
    setDraftFeature(null, null);
    hasDraft.value = false;

    const geometry = event.feature?.getGeometry();
    if (!geometry) {
      onScopeQueryResult?.({
        workLotIds: [],
        siteBoundaryIds: [],
        partOfSitesIds: [],
        sectionIds: [],
      });
      return;
    }

    onScopeQueryResult?.(collectScopeMatches(geometry));
  };

  const handlePolygonDrawEnd = (event) => {
    setDraftFeature(event.feature, null);
    hasDraft.value = true;

    if (activeLayerType.value === "partOfSites") {
      const meta = ensurePartOfSitesFeatureMeta(event.feature);
      if (uiStore.partOfSitesFilterMode === "custom" && meta?.partId) {
        uiStore.ensureMapSelectedId("partOfSites", meta.partId);
      }
      pendingGeometry.value = null;
      setDraftFeature(null, null);
      hasDraft.value = false;
      uiStore.selectPartOfSite(meta?.partId || null);
      clearHighlightOverride();
      notifyPartOfSitesSourceChange();
      return;
    }

    if (activeLayerType.value === "section") {
      const meta = ensureSectionFeatureMeta(event.feature);
      if (uiStore.sectionFilterMode === "custom" && meta?.sectionId) {
        uiStore.ensureMapSelectedId("section", meta.sectionId);
      }
      pendingGeometry.value = null;
      setDraftFeature(null, null);
      hasDraft.value = false;
      uiStore.selectSection(meta?.sectionId || null);
      clearHighlightOverride();
      notifySectionsSourceChange();
      return;
    }

    const geometry = format.writeGeometryObject(event.feature.getGeometry(), {
      dataProjection: projectionCode,
      featureProjection: projectionCode,
    });
    pendingGeometry.value = geometry;
    if (activeLayerType.value === "work") {
      showWorkDialog.value = true;
    } else if (activeLayerType.value === "siteBoundary") {
      onSiteBoundaryDrawStart?.();
      if (showSiteBoundaryDialog) {
        showSiteBoundaryDialog.value = true;
      }
    }
  };

  return {
    handleScopeDrawEnd,
    handlePolygonDrawEnd,
  };
};
