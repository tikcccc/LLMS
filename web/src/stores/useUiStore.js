import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    tool: "PAN",
    selectedWorkLotId: null,
    selectedLandLotId: null,
    editTarget: "land",
    sidebarCollapsed: false,
    showBasemap: true,
    showLabels: true,
    showLandLots: true,
    showWorkLots: true,
  }),
  actions: {
    setTool(tool) {
      this.tool = tool;
    },
    selectWorkLot(id) {
      this.selectedWorkLotId = id;
      this.selectedLandLotId = null;
    },
    selectLandLot(id) {
      this.selectedLandLotId = id;
      this.selectedWorkLotId = null;
    },
    clearSelection() {
      this.selectedWorkLotId = null;
      this.selectedLandLotId = null;
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
