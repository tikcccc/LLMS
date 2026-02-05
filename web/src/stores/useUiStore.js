import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    tool: "PAN",
    selectedWorkLotId: null,
    selectedLandLotId: null,
    editTarget: "work",
    sidebarCollapsed: false,
    showBasemap: true,
    showLabels: true,
    showLandLots: true,
    showIntLand: true,
    showWorkLots: true,
    selectedIntLandId: null,
  }),
  actions: {
    setTool(tool) {
      this.tool = tool;
    },
    selectWorkLot(id) {
      this.selectedWorkLotId = id;
      this.selectedLandLotId = null;
      this.selectedIntLandId = null;
    },
    selectLandLot(id) {
      this.selectedLandLotId = id;
      this.selectedWorkLotId = null;
      this.selectedIntLandId = null;
    },
    selectIntLand(id) {
      this.selectedIntLandId = id;
      this.selectedWorkLotId = null;
      this.selectedLandLotId = null;
    },
    clearIntLandSelection() {
      this.selectedIntLandId = null;
    },
    clearSelection() {
      this.selectedWorkLotId = null;
      this.selectedLandLotId = null;
      this.selectedIntLandId = null;
    },
    setEditTarget(target) {
      this.editTarget = target;
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
