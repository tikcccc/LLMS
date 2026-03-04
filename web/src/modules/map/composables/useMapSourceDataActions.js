import { computed } from "vue";

export const useMapSourceDataActions = ({
  partOfSitesSourceVersion,
  sectionSourceVersion,
  partOfSitesSource,
  sectionsSource,
  persistPartOfSitesSnapshot,
  persistSectionsSnapshot,
  syncSectionPartRelations,
  sanitizeMapFilterSelections,
  refreshLayerFilters,
  updateHighlightVisibility,
  refreshHighlights,
  exportPartOfSitesSnapshot,
  exportSectionsSnapshot,
  notify,
}) => {
  const canExportPartOfSites = computed(() => {
    partOfSitesSourceVersion.value;
    return (partOfSitesSource?.getFeatures().length || 0) > 0;
  });

  const canExportSections = computed(() => {
    sectionSourceVersion.value;
    return (sectionsSource?.getFeatures().length || 0) > 0;
  });

  const handlePartOfSitesSourceChange = () => {
    persistPartOfSitesSnapshot({ source: "map-edit" });
    partOfSitesSourceVersion.value += 1;
    syncSectionPartRelations();
    sectionSourceVersion.value += 1;
    sanitizeMapFilterSelections();
    refreshLayerFilters();
    updateHighlightVisibility();
    refreshHighlights();
  };

  const handleSectionsSourceChange = () => {
    persistSectionsSnapshot({ source: "map-edit" });
    sectionSourceVersion.value += 1;
    syncSectionPartRelations();
    partOfSitesSourceVersion.value += 1;
    sanitizeMapFilterSelections();
    refreshLayerFilters();
    updateHighlightVisibility();
    refreshHighlights();
  };

  const handleExportPartOfSites = () => {
    if (!canExportPartOfSites.value) return;
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      exportPartOfSitesSnapshot(`part-of-sites-map-${timestamp}.geojson`);
      notify?.success?.("Part of Sites GeoJSON exported.");
    } catch (error) {
      console.warn("[map] export part of sites failed", error);
      notify?.error?.("Failed to export Part of Sites GeoJSON.");
    }
  };

  const handleExportSections = () => {
    if (!canExportSections.value) return;
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      exportSectionsSnapshot(`sections-map-${timestamp}.geojson`);
      notify?.success?.("Sections GeoJSON exported.");
    } catch (error) {
      console.warn("[map] export sections failed", error);
      notify?.error?.("Failed to export Sections GeoJSON.");
    }
  };

  return {
    canExportPartOfSites,
    canExportSections,
    handlePartOfSitesSourceChange,
    handleSectionsSourceChange,
    handleExportPartOfSites,
    handleExportSections,
  };
};
