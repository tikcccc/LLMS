export const useMapPageUiActions = ({
  uiStore,
  clearHighlightOverride,
  clearAllHighlights,
  selectInteraction,
  updateLayerVisibility,
  basemapLayer,
  labelLayer,
  refreshLayerFilters,
  updateHighlightVisibility,
  refreshHighlights,
  canEditLayer,
  setTool,
  updateLayerOpacity,
  rebuildInteractions,
}) => {
  const handleDrawerClose = () => {
    uiStore.clearSelection();
    clearHighlightOverride();
    clearAllHighlights();
    if (selectInteraction.value?.getFeatures) {
      selectInteraction.value.getFeatures().clear();
    }
  };

  const forceApplyLayerVisibilityAndFilters = () => {
    updateLayerVisibility(basemapLayer.value, labelLayer.value);
    refreshLayerFilters();
    updateHighlightVisibility();
    refreshHighlights();
  };

  const onRoleChange = () => {
    if (
      !canEditLayer.value &&
      ["POLYGON", "POLYGON_CIRCLE", "MODIFY", "DELETE"].includes(uiStore.tool)
    ) {
      setTool("PAN");
    }
    updateLayerOpacity();
    rebuildInteractions();
  };

  return {
    handleDrawerClose,
    forceApplyLayerVisibilityAndFilters,
    onRoleChange,
  };
};
