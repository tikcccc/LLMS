import { isEmpty as isEmptyExtent } from "ol/extent";

const FIT_PADDING = [80, 80, 80, 80];

const isIdSelected = (ids = [], id) => {
  const normalized = String(id || "").trim().toLowerCase();
  if (!normalized) return false;
  return ids.some((item) => String(item || "").trim().toLowerCase() === normalized);
};

export const useMapZoomRouteActions = ({
  mapRef,
  route,
  uiStore,
  workLotStore,
  siteBoundarySource,
  partOfSitesSource,
  sectionsSource,
  getWorkFeatureById,
  createWorkFeature,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  getPartGeometryStatById,
  ensureContractPackageVisible,
  resolveContractPackageValue,
  normalizeWorkLotCategory,
  workLotCategory,
  refreshHighlights,
}) => {
  const getQueryValue = (value) => (Array.isArray(value) ? value[0] : value ?? null);

  const hasFocusQueryInRoute = () =>
    !!(
      getQueryValue(route.query.workLotId) ||
      getQueryValue(route.query.siteBoundaryId) ||
      getQueryValue(route.query.partOfSiteId) ||
      getQueryValue(route.query.sectionId)
    );

  const fitToSiteBoundary = () => {
    if (!mapRef.value || !siteBoundarySource) return;
    const extent = siteBoundarySource.getExtent();
    if (!extent || isEmptyExtent(extent)) return;
    mapRef.value.getView().fit(extent, {
      padding: FIT_PADDING,
      duration: 600,
      maxZoom: 17,
    });
  };

  const zoomToWorkLot = (id) => {
    if (!mapRef.value) return;
    const lot = workLotStore.workLots.find((item) => String(item.id) === String(id));
    if (lot) {
      const contractPackage = resolveContractPackageValue([
        lot.contractPackage,
        lot.contract_package,
        lot.phase,
        lot.package,
        lot.contractNo,
      ]);
      const category = normalizeWorkLotCategory(lot.category ?? lot.type);
      if (!uiStore.showWorkLots) {
        uiStore.setLayerVisibility("showWorkLots", true);
      }
      ensureContractPackageVisible("workLot", contractPackage);
      if (category === workLotCategory.BU && !uiStore.showWorkLotsBusiness) {
        uiStore.setLayerVisibility("showWorkLotsBusiness", true);
      }
      if (category === workLotCategory.HH && !uiStore.showWorkLotsDomestic) {
        uiStore.setLayerVisibility("showWorkLotsDomestic", true);
      }
      if (category === workLotCategory.GL && !uiStore.showWorkLotsGovernment) {
        uiStore.setLayerVisibility("showWorkLotsGovernment", true);
      }
      if (
        uiStore.workLotFilterMode === "custom" &&
        !isIdSelected(uiStore.workLotSelectedIds, lot.id)
      ) {
        uiStore.ensureMapSelectedId("workLot", lot.id);
      }
    }
    const view = mapRef.value.getView();
    const feature = getWorkFeatureById(id, lot?.contractPackage) || createWorkFeature(lot);
    if (!feature) return;
    const extent = feature.getGeometry().getExtent();
    view.fit(extent, { padding: FIT_PADDING, duration: 500, maxZoom: 18 });
    uiStore.selectWorkLot(id);
  };

  const zoomToSiteBoundary = (id) => {
    if (!mapRef.value || !siteBoundarySource) return;
    if (!uiStore.showSiteBoundary) {
      uiStore.setLayerVisibility("showSiteBoundary", true);
    }
    const view = mapRef.value.getView();
    const feature = findSiteBoundaryFeatureById(id);
    if (!feature) return;
    ensureContractPackageVisible(
      "siteBoundary",
      resolveContractPackageValue([
        feature.get("contractPackage"),
        feature.get("contract_package"),
        feature.get("phase"),
        feature.get("package"),
        feature.get("contractNo"),
        feature.get("layer"),
      ])
    );
    const selectedId = String(feature.getId() ?? id);
    if (
      uiStore.siteBoundaryFilterMode === "custom" &&
      !isIdSelected(uiStore.siteBoundarySelectedIds, selectedId)
    ) {
      uiStore.ensureMapSelectedId("siteBoundary", selectedId);
    }
    const extent = feature.getGeometry().getExtent();
    view.fit(extent, { padding: FIT_PADDING, duration: 500, maxZoom: 18 });
    uiStore.selectSiteBoundary(selectedId);
    refreshHighlights();
  };

  const zoomToPartOfSite = (id) => {
    if (!mapRef.value || !partOfSitesSource) return;
    if (!uiStore.showPartOfSites) {
      uiStore.setLayerVisibility("showPartOfSites", true);
    }
    const feature = findPartOfSitesFeatureById(id);
    if (!feature) return;
    const meta = resolvePartOfSiteMeta(feature);
    ensureContractPackageVisible("partOfSites", meta.contractPackage);
    if (
      uiStore.partOfSitesFilterMode === "custom" &&
      !isIdSelected(uiStore.partOfSitesSelectedIds, meta.partId)
    ) {
      uiStore.ensureMapSelectedId("partOfSites", meta.partId);
    }
    const geometry =
      getPartGeometryStatById(meta.partId, meta.contractPackage)?.geometry ||
      feature.getGeometry();
    if (!geometry) return;
    const extent = geometry.getExtent();
    mapRef.value.getView().fit(extent, {
      padding: FIT_PADDING,
      duration: 500,
      maxZoom: 18,
    });
    uiStore.selectPartOfSite(meta.partId);
    refreshHighlights();
  };

  const zoomToSection = (id) => {
    if (!mapRef.value || !sectionsSource) return;
    if (!uiStore.showSections) {
      uiStore.setLayerVisibility("showSections", true);
    }
    const feature = findSectionFeatureById(id);
    if (!feature) return;
    const meta = resolveSectionMeta(feature);
    ensureContractPackageVisible("section", meta.contractPackage);
    if (
      uiStore.sectionFilterMode === "custom" &&
      !isIdSelected(uiStore.sectionSelectedIds, meta.sectionId)
    ) {
      uiStore.ensureMapSelectedId("section", meta.sectionId);
    }
    const geometry = feature.getGeometry();
    if (!geometry) return;
    const extent = geometry.getExtent();
    mapRef.value.getView().fit(extent, {
      padding: FIT_PADDING,
      duration: 500,
      maxZoom: 18,
    });
    uiStore.selectSection(meta.sectionId);
    refreshHighlights();
  };

  const applyFocusFromRoute = () => {
    if (!mapRef.value) return;

    const workLotId = getQueryValue(route.query.workLotId);
    const siteBoundaryId = getQueryValue(route.query.siteBoundaryId);
    const partOfSiteId = getQueryValue(route.query.partOfSiteId);
    const sectionId = getQueryValue(route.query.sectionId);

    if (!workLotId && !siteBoundaryId && !partOfSiteId && !sectionId) return;

    if (uiStore.tool !== "PAN") {
      uiStore.setTool("PAN");
    }

    if (workLotId) {
      zoomToWorkLot(workLotId);
      return;
    }
    if (siteBoundaryId) {
      zoomToSiteBoundary(siteBoundaryId);
      return;
    }
    if (partOfSiteId) {
      zoomToPartOfSite(partOfSiteId);
      return;
    }
    if (sectionId) {
      zoomToSection(sectionId);
    }
  };

  return {
    getQueryValue,
    hasFocusQueryInRoute,
    fitToSiteBoundary,
    applyFocusFromRoute,
    zoomToWorkLot,
    zoomToSiteBoundary,
    zoomToPartOfSite,
    zoomToSection,
  };
};
