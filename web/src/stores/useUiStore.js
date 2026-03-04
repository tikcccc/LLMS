import { defineStore } from "pinia";

const MAP_FILTER_SCHEMA_VERSION = 2;
const FILTER_MODE_ALL = "all";
const FILTER_MODE_CUSTOM = "custom";

const FILTER_GROUP_MAP = {
  workLot: {
    modeKey: "workLotFilterMode",
    idsKey: "workLotSelectedIds",
  },
  siteBoundary: {
    modeKey: "siteBoundaryFilterMode",
    idsKey: "siteBoundarySelectedIds",
  },
  partOfSites: {
    modeKey: "partOfSitesFilterMode",
    idsKey: "partOfSitesSelectedIds",
  },
  section: {
    modeKey: "sectionFilterMode",
    idsKey: "sectionSelectedIds",
  },
};

const normalizeFilterMode = (value) =>
  value === FILTER_MODE_CUSTOM ? FILTER_MODE_CUSTOM : FILTER_MODE_ALL;

const normalizeIdList = (value) => {
  if (!Array.isArray(value)) return [];
  const dedupe = new Set();
  value.forEach((item) => {
    const normalized = String(item || "").trim();
    if (!normalized) return;
    dedupe.add(normalized);
  });
  return Array.from(dedupe);
};

const resolveFilterGroupKeys = (filterGroup) => FILTER_GROUP_MAP[filterGroup] || null;

export const useUiStore = defineStore("ui", {
  state: () => ({
    tool: "PAN",
    selectedWorkLotId: null,
    showBasemap: true,
    showLabels: true,
    showIntLand: false,
    showPartOfSites: false,
    showPartOfSitesC1: true,
    showPartOfSitesC2: true,
    showSections: false,
    showSectionsC1: true,
    showSectionsC2: true,
    showSiteBoundary: true,
    showSiteBoundaryC1: true,
    showSiteBoundaryC2: true,
    showWorkLots: true,
    showWorkLotsC1: true,
    showWorkLotsC2: true,
    showWorkLotsBusiness: true,
    showWorkLotsDomestic: true,
    showWorkLotsGovernment: true,
    workLotFilterMode: FILTER_MODE_ALL,
    workLotSelectedIds: [],
    siteBoundaryFilterMode: FILTER_MODE_ALL,
    siteBoundarySelectedIds: [],
    partOfSitesFilterMode: FILTER_MODE_ALL,
    partOfSitesSelectedIds: [],
    sectionFilterMode: FILTER_MODE_ALL,
    sectionSelectedIds: [],
    mapFilterSchemaVersion: MAP_FILTER_SCHEMA_VERSION,
    selectedIntLandId: null,
    selectedSiteBoundaryId: null,
    selectedPartOfSiteId: null,
    selectedSectionId: null,
  }),
  actions: {
    normalizeLegacyState() {
      if (
        Number(this.mapFilterSchemaVersion) !== MAP_FILTER_SCHEMA_VERSION
      ) {
        this.showBasemap = true;
        this.showLabels = true;
        this.showIntLand = false;
        this.showPartOfSites = false;
        this.showPartOfSitesC1 = true;
        this.showPartOfSitesC2 = true;
        this.showSections = false;
        this.showSectionsC1 = true;
        this.showSectionsC2 = true;
        this.showSiteBoundary = true;
        this.showSiteBoundaryC1 = true;
        this.showSiteBoundaryC2 = true;
        this.showWorkLots = true;
        this.showWorkLotsC1 = true;
        this.showWorkLotsC2 = true;
        this.showWorkLotsBusiness = true;
        this.showWorkLotsDomestic = true;
        this.showWorkLotsGovernment = true;
        this.workLotFilterMode = FILTER_MODE_ALL;
        this.workLotSelectedIds = [];
        this.siteBoundaryFilterMode = FILTER_MODE_ALL;
        this.siteBoundarySelectedIds = [];
        this.partOfSitesFilterMode = FILTER_MODE_ALL;
        this.partOfSitesSelectedIds = [];
        this.sectionFilterMode = FILTER_MODE_ALL;
        this.sectionSelectedIds = [];
        this.mapFilterSchemaVersion = MAP_FILTER_SCHEMA_VERSION;
      }
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
      if (typeof this.showWorkLotsC1 !== "boolean") {
        this.showWorkLotsC1 = true;
      }
      if (typeof this.showWorkLotsC2 !== "boolean") {
        this.showWorkLotsC2 = true;
      }
      if (typeof this.showIntLand !== "boolean") {
        this.showIntLand = false;
      }
      if (typeof this.showPartOfSites !== "boolean") {
        this.showPartOfSites = false;
      }
      if (typeof this.showPartOfSitesC1 !== "boolean") {
        this.showPartOfSitesC1 = true;
      }
      if (typeof this.showPartOfSitesC2 !== "boolean") {
        this.showPartOfSitesC2 = true;
      }
      if (typeof this.showSections !== "boolean") {
        this.showSections = false;
      }
      if (typeof this.showSiteBoundary !== "boolean") {
        this.showSiteBoundary = true;
      }
      if (typeof this.showSectionsC1 !== "boolean") {
        this.showSectionsC1 = true;
      }
      if (typeof this.showSectionsC2 !== "boolean") {
        this.showSectionsC2 = true;
      }
      if (typeof this.showSiteBoundaryC1 !== "boolean") {
        this.showSiteBoundaryC1 = true;
      }
      if (typeof this.showSiteBoundaryC2 !== "boolean") {
        this.showSiteBoundaryC2 = true;
      }
      if (
        !this.showWorkLotsBusiness &&
        !this.showWorkLotsDomestic &&
        !this.showWorkLotsGovernment
      ) {
        this.showWorkLots = false;
      }
      if (!this.showWorkLotsC1 && !this.showWorkLotsC2) {
        this.showWorkLots = false;
      }
      if (!this.showPartOfSitesC1 && !this.showPartOfSitesC2) {
        this.showPartOfSites = false;
      }
      if (!this.showSectionsC1 && !this.showSectionsC2) {
        this.showSections = false;
      }
      if (!this.showSiteBoundaryC1 && !this.showSiteBoundaryC2) {
        this.showSiteBoundary = false;
      }
      this.workLotFilterMode = normalizeFilterMode(this.workLotFilterMode);
      this.siteBoundaryFilterMode = normalizeFilterMode(this.siteBoundaryFilterMode);
      this.partOfSitesFilterMode = normalizeFilterMode(this.partOfSitesFilterMode);
      this.sectionFilterMode = normalizeFilterMode(this.sectionFilterMode);
      this.workLotSelectedIds = normalizeIdList(this.workLotSelectedIds);
      this.siteBoundarySelectedIds = normalizeIdList(this.siteBoundarySelectedIds);
      this.partOfSitesSelectedIds = normalizeIdList(this.partOfSitesSelectedIds);
      this.sectionSelectedIds = normalizeIdList(this.sectionSelectedIds);
      if (this.workLotFilterMode === FILTER_MODE_ALL) {
        this.workLotSelectedIds = [];
      }
      if (this.siteBoundaryFilterMode === FILTER_MODE_ALL) {
        this.siteBoundarySelectedIds = [];
      }
      if (this.partOfSitesFilterMode === FILTER_MODE_ALL) {
        this.partOfSitesSelectedIds = [];
      }
      if (this.sectionFilterMode === FILTER_MODE_ALL) {
        this.sectionSelectedIds = [];
      }
    },
    setTool(tool) {
      this.tool = tool;
    },
    selectWorkLot(id) {
      this.selectedWorkLotId = id;
      this.selectedIntLandId = null;
      this.selectedSiteBoundaryId = null;
      this.selectedPartOfSiteId = null;
      this.selectedSectionId = null;
    },
    selectIntLand(id) {
      this.selectedIntLandId = id;
      this.selectedWorkLotId = null;
      this.selectedSiteBoundaryId = null;
      this.selectedPartOfSiteId = null;
      this.selectedSectionId = null;
    },
    selectSiteBoundary(id) {
      this.selectedSiteBoundaryId = id;
      this.selectedWorkLotId = null;
      this.selectedIntLandId = null;
      this.selectedPartOfSiteId = null;
      this.selectedSectionId = null;
    },
    selectPartOfSite(id) {
      this.selectedPartOfSiteId = id;
      this.selectedSiteBoundaryId = null;
      this.selectedWorkLotId = null;
      this.selectedIntLandId = null;
      this.selectedSectionId = null;
    },
    selectSection(id) {
      this.selectedSectionId = id;
      this.selectedPartOfSiteId = null;
      this.selectedSiteBoundaryId = null;
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
      this.selectedPartOfSiteId = null;
      this.selectedSectionId = null;
    },
    setLayerVisibility(layerKey, value) {
      const normalized = !!value;
      if (layerKey === "showWorkLots") {
        this.showWorkLots = normalized;
        if (!normalized) {
          this.showWorkLotsBusiness = false;
          this.showWorkLotsDomestic = false;
          this.showWorkLotsGovernment = false;
          this.showWorkLotsC1 = false;
          this.showWorkLotsC2 = false;
        } else if (
          !this.showWorkLotsBusiness &&
          !this.showWorkLotsDomestic &&
          !this.showWorkLotsGovernment
        ) {
          this.showWorkLotsBusiness = true;
          this.showWorkLotsDomestic = true;
          this.showWorkLotsGovernment = true;
          this.showWorkLotsC1 = true;
          this.showWorkLotsC2 = true;
        } else if (!this.showWorkLotsC1 && !this.showWorkLotsC2) {
          this.showWorkLotsC1 = true;
          this.showWorkLotsC2 = true;
        }
        return;
      }
      if (layerKey === "showSiteBoundary") {
        this.showSiteBoundary = normalized;
        if (!normalized) {
          this.showSiteBoundaryC1 = false;
          this.showSiteBoundaryC2 = false;
        } else if (!this.showSiteBoundaryC1 && !this.showSiteBoundaryC2) {
          this.showSiteBoundaryC1 = true;
          this.showSiteBoundaryC2 = true;
        }
        return;
      }
      if (layerKey === "showPartOfSites") {
        this.showPartOfSites = normalized;
        if (!normalized) {
          this.showPartOfSitesC1 = false;
          this.showPartOfSitesC2 = false;
        } else if (!this.showPartOfSitesC1 && !this.showPartOfSitesC2) {
          this.showPartOfSitesC1 = true;
          this.showPartOfSitesC2 = true;
        }
        return;
      }
      if (layerKey === "showSections") {
        this.showSections = normalized;
        if (!normalized) {
          this.showSectionsC1 = false;
          this.showSectionsC2 = false;
        } else if (!this.showSectionsC1 && !this.showSectionsC2) {
          this.showSectionsC1 = true;
          this.showSectionsC2 = true;
        }
        return;
      }
      this[layerKey] = normalized;
      if (
        layerKey === "showWorkLotsBusiness" ||
        layerKey === "showWorkLotsDomestic" ||
        layerKey === "showWorkLotsGovernment" ||
        layerKey === "showWorkLotsC1" ||
        layerKey === "showWorkLotsC2"
      ) {
        this.showWorkLots =
          (this.showWorkLotsBusiness ||
            this.showWorkLotsDomestic ||
            this.showWorkLotsGovernment) &&
          (this.showWorkLotsC1 || this.showWorkLotsC2);
      }
      if (layerKey === "showSiteBoundaryC1" || layerKey === "showSiteBoundaryC2") {
        this.showSiteBoundary = this.showSiteBoundaryC1 || this.showSiteBoundaryC2;
      }
      if (layerKey === "showPartOfSitesC1" || layerKey === "showPartOfSitesC2") {
        this.showPartOfSites = this.showPartOfSitesC1 || this.showPartOfSitesC2;
      }
      if (layerKey === "showSectionsC1" || layerKey === "showSectionsC2") {
        this.showSections = this.showSectionsC1 || this.showSectionsC2;
      }
    },
    setMapFilterMode(filterGroup, mode) {
      const keys = resolveFilterGroupKeys(filterGroup);
      if (!keys) return;
      const normalizedMode = normalizeFilterMode(mode);
      this[keys.modeKey] = normalizedMode;
      if (normalizedMode === FILTER_MODE_ALL) {
        this[keys.idsKey] = [];
      }
    },
    setMapSelectedIds(filterGroup, ids = []) {
      const keys = resolveFilterGroupKeys(filterGroup);
      if (!keys) return;
      const normalizedIds = normalizeIdList(ids);
      this[keys.idsKey] = normalizedIds;
      this[keys.modeKey] = FILTER_MODE_CUSTOM;
    },
    ensureMapSelectedId(filterGroup, id) {
      const keys = resolveFilterGroupKeys(filterGroup);
      if (!keys) return;
      const normalizedId = String(id || "").trim();
      if (!normalizedId) return;
      const nextIds = normalizeIdList([...this[keys.idsKey], normalizedId]);
      this[keys.idsKey] = nextIds;
      this[keys.modeKey] = FILTER_MODE_CUSTOM;
    },
    sanitizeMapSelectedIds({
      workLotIds = [],
      siteBoundaryIds = [],
      partOfSitesIds = [],
      sectionIds = [],
    } = {}) {
      const sanitizeByAllowed = (selectedIds, allowedIds) => {
        const normalizedAllowed = new Map();
        normalizeIdList(allowedIds).forEach((id) => {
          normalizedAllowed.set(id.toLowerCase(), id);
        });
        return normalizeIdList(selectedIds).filter((id) =>
          normalizedAllowed.has(id.toLowerCase())
        );
      };

      this.workLotSelectedIds = sanitizeByAllowed(
        this.workLotSelectedIds,
        workLotIds
      );
      this.siteBoundarySelectedIds = sanitizeByAllowed(
        this.siteBoundarySelectedIds,
        siteBoundaryIds
      );
      this.partOfSitesSelectedIds = sanitizeByAllowed(
        this.partOfSitesSelectedIds,
        partOfSitesIds
      );
      this.sectionSelectedIds = sanitizeByAllowed(
        this.sectionSelectedIds,
        sectionIds
      );
    },
  },
  persist: {
    key: "ND_LLM_V1_ui",
  },
});
