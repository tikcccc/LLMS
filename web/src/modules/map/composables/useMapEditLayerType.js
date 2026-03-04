import { computed, ref } from "vue";

export const useMapEditLayerType = ({ canEditWork, canEditLayer, uiStore }) => {
  const editLayerType = ref("work");
  const activeLayerType = computed(() => (canEditWork.value ? editLayerType.value : null));

  const setActiveLayerType = (layerType) => {
    if (!canEditLayer.value) return;
    if (!["work", "siteBoundary", "partOfSites", "section"].includes(layerType)) return;
    editLayerType.value = layerType;
    if (layerType === "siteBoundary") {
      if (!uiStore.showSiteBoundary) {
        uiStore.setLayerVisibility("showSiteBoundary", true);
      }
      return;
    }
    if (layerType === "section") {
      if (!uiStore.showSections) {
        uiStore.setLayerVisibility("showSections", true);
      }
      return;
    }
    if (layerType === "partOfSites") {
      if (!uiStore.showPartOfSites) {
        uiStore.setLayerVisibility("showPartOfSites", true);
      }
      return;
    }
    if (!uiStore.showWorkLots) {
      uiStore.setLayerVisibility("showWorkLots", true);
      uiStore.setLayerVisibility("showWorkLotsBusiness", true);
      uiStore.setLayerVisibility("showWorkLotsDomestic", true);
      uiStore.setLayerVisibility("showWorkLotsGovernment", true);
    }
  };

  return {
    editLayerType,
    activeLayerType,
    setActiveLayerType,
  };
};
