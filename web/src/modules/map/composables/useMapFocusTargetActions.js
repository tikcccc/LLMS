export const useMapFocusTargetActions = ({
  workLotStore,
  findSiteBoundaryFeatureById,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  resolvePartOfSiteMeta,
  resolveSectionMeta,
  toggleFocusOnMapTarget,
}) => {
  const focusOnMapWorkLot = (id) => {
    const lot = workLotStore.workLots.find((item) => String(item.id) === String(id || "").trim());
    if (!lot) return;
    toggleFocusOnMapTarget("workLot", String(lot.id));
  };

  const focusOnMapSiteBoundary = (id) => {
    const feature = findSiteBoundaryFeatureById(id);
    if (!feature) return;
    const selectedId = String(feature.getId() ?? id ?? "").trim();
    if (!selectedId) return;
    toggleFocusOnMapTarget("siteBoundary", selectedId);
  };

  const focusOnMapPartOfSite = (id) => {
    const feature = findPartOfSitesFeatureById(id);
    if (!feature) return;
    const meta = resolvePartOfSiteMeta(feature);
    const selectedId = String(meta.partId || "").trim();
    if (!selectedId) return;
    toggleFocusOnMapTarget("partOfSites", selectedId);
  };

  const focusOnMapSection = (id) => {
    const feature = findSectionFeatureById(id);
    if (!feature) return;
    const meta = resolveSectionMeta(feature);
    const selectedId = String(meta.sectionId || "").trim();
    if (!selectedId) return;
    toggleFocusOnMapTarget("section", selectedId);
  };

  return {
    focusOnMapWorkLot,
    focusOnMapSiteBoundary,
    focusOnMapPartOfSite,
    focusOnMapSection,
  };
};
