import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    tool: "PAN",
    selectedWorkLotId: null,
    sidebarCollapsed: false,
    mobileNavOpen: false,
    showBasemap: true,
    showLabels: true,
    showIntLand: false,
    showSiteBoundary: true,
    showWorkLots: true,
    showWorkLotsBusiness: true,
    showWorkLotsDomestic: true,
    showWorkLotsGovernment: true,
    selectedIntLandId: null,
    selectedSiteBoundaryId: null,
  }),
  actions: {
    normalizeLegacyState() {
      if (typeof this.showWorkLotsBusiness !== "boolean") {
        this.showWorkLotsBusiness = true;
      }
      if (typeof this.showWorkLotsDomestic !== "boolean") {
        this.showWorkLotsDomestic = true;
      }
      if (typeof this.showWorkLotsGovernment !== "boolean") {
        this.showWorkLotsGovernment = true;
      }
      if (typeof this.showWorkLots !== "boolean") {
        this.showWorkLots = true;
      }
      if (typeof this.showIntLand !== "boolean") {
        this.showIntLand = false;
      }
      if (
        !this.showWorkLotsBusiness &&
        !this.showWorkLotsDomestic &&
        !this.showWorkLotsGovernment
      ) {
        this.showWorkLots = false;
      }
    },
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
      const normalized = !!value;
      if (layerKey === "showWorkLots") {
        this.showWorkLots = normalized;
        if (!normalized) {
          this.showWorkLotsBusiness = false;
          this.showWorkLotsDomestic = false;
          this.showWorkLotsGovernment = false;
        } else if (
          !this.showWorkLotsBusiness &&
          !this.showWorkLotsDomestic &&
          !this.showWorkLotsGovernment
        ) {
          this.showWorkLotsBusiness = true;
          this.showWorkLotsDomestic = true;
          this.showWorkLotsGovernment = true;
        }
        return;
      }
      this[layerKey] = normalized;
      if (
        layerKey === "showWorkLotsBusiness" ||
        layerKey === "showWorkLotsDomestic" ||
        layerKey === "showWorkLotsGovernment"
      ) {
        this.showWorkLots =
          this.showWorkLotsBusiness ||
          this.showWorkLotsDomestic ||
          this.showWorkLotsGovernment;
      }
    },
  },
  persist: {
    key: "ND_LLM_V1_ui",
  },
});
