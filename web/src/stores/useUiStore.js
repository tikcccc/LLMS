import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    tool: "PAN",
    selectedWorkLotId: null,
    sidebarCollapsed: false,
    showBasemap: true,
    showLabels: true,
    showIntLand: true,
    showSiteBoundary: true,
    showWorkLots: true,
    selectedIntLandId: null,
    selectedSiteBoundaryId: null,
  }),
  actions: {
    setTool(tool) {
      this.tool = tool;
    },
    selectWorkLot(id) {
      this.selectedWorkLotId = id;
      this.selectedIntLandId = null;
      this.selectedSiteBoundaryId = null;
    },
    selectIntLand(id) {
      this.selectedIntLandId = id;
      this.selectedWorkLotId = null;
      this.selectedSiteBoundaryId = null;
    },
    selectSiteBoundary(id) {
      this.selectedSiteBoundaryId = id;
      this.selectedWorkLotId = null;
      this.selectedIntLandId = null;
    },
    clearIntLandSelection() {
      this.selectedIntLandId = null;
    },
    clearSelection() {
      this.selectedWorkLotId = null;
      this.selectedIntLandId = null;
      this.selectedSiteBoundaryId = null;
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    setLayerVisibility(layerKey, value) {
      this[layerKey] = value;
    },
  },
  persist: {
    key: "ND_LLM_V1_ui",
  },
});
