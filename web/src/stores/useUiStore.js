import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    tool: "DRAW_CIRCLE",
    selectedWorkLotId: null,
    sidebarCollapsed: false,
    mobileNavOpen: false,
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
    setMobileNavOpen(value) {
      this.mobileNavOpen = !!value;
    },
    toggleMobileNav() {
      this.mobileNavOpen = !this.mobileNavOpen;
    },
    setLayerVisibility(layerKey, value) {
      this[layerKey] = value;
    },
  },
  persist: {
    key: "ND_LLM_V1_ui",
  },
});
