import { defineStore } from "pinia";
import {
  CONTRACT_PACKAGE,
  normalizeContractPackage,
} from "../shared/utils/contractPackage";

const MAP_FILTER_SCHEMA_VERSION = 4;
const DEFAULT_ACTIVE_CONTRACT = CONTRACT_PACKAGE.C1;
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

const resolveActiveContractValue = (value) =>
  normalizeContractPackage(value, { fallback: DEFAULT_ACTIVE_CONTRACT });

const buildPhaseVisibilityByContract = (activeContract) => {
  const resolved = resolveActiveContractValue(activeContract);
  const isC1 = resolved === CONTRACT_PACKAGE.C1;
  return {
    activeContract: resolved,
    showPartOfSitesC1: isC1,
    showPartOfSitesC2: !isC1,
    showSectionsC1: isC1,
    showSectionsC2: !isC1,
    showSiteBoundaryC1: isC1,
    showSiteBoundaryC2: !isC1,
    showWorkLotsC1: isC1,
    showWorkLotsC2: !isC1,
  };
};

export const useUiStore = defineStore("ui", {
  state: () => ({
    tool: "PAN",
    selectedWorkLotId: null,
    showBasemap: true,
    showLabels: true,
    showIntLand: false,
    activeContract: DEFAULT_ACTIVE_CONTRACT,
    showPartOfSites: false,
    showPartOfSitesC1: true,
    showPartOfSitesC2: false,
    showSections: false,
    showSectionsC1: true,
    showSectionsC2: false,
    showSiteBoundary: true,
    showSiteBoundaryC1: true,
    showSiteBoundaryC2: false,
    showWorkLots: true,
    showWorkLotsC1: true,
    showWorkLotsC2: false,
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
    applyActiveContractPhaseVisibility(activeContract = this.activeContract) {
      const phaseVisibility = buildPhaseVisibilityByContract(activeContract);
      this.activeContract = phaseVisibility.activeContract;
      this.showPartOfSitesC1 = phaseVisibility.showPartOfSitesC1;
      this.showPartOfSitesC2 = phaseVisibility.showPartOfSitesC2;
      this.showSectionsC1 = phaseVisibility.showSectionsC1;
      this.showSectionsC2 = phaseVisibility.showSectionsC2;
      this.showSiteBoundaryC1 = phaseVisibility.showSiteBoundaryC1;
      this.showSiteBoundaryC2 = phaseVisibility.showSiteBoundaryC2;
      this.showWorkLotsC1 = phaseVisibility.showWorkLotsC1;
      this.showWorkLotsC2 = phaseVisibility.showWorkLotsC2;
    },
    setActiveContract(activeContract) {
      this.applyActiveContractPhaseVisibility(activeContract);
    },
    normalizeLegacyState() {
      if (
        Number(this.mapFilterSchemaVersion) !== MAP_FILTER_SCHEMA_VERSION
      ) {
        this.showBasemap = true;
        this.showLabels = true;
        this.showIntLand = false;
        this.activeContract = DEFAULT_ACTIVE_CONTRACT;
        this.showPartOfSites = false;
        this.showPartOfSitesC1 = true;
        this.showPartOfSitesC2 = false;
        this.showSections = false;
        this.showSectionsC1 = true;
        this.showSectionsC2 = false;
        this.showSiteBoundary = true;
        this.showSiteBoundaryC1 = true;
        this.showSiteBoundaryC2 = false;
        this.showWorkLots = true;
        this.showWorkLotsC1 = true;
        this.showWorkLotsC2 = false;
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
      this.activeContract = resolveActiveContractValue(this.activeContract);
      if (typeof this.showIntLand !== "boolean") {
        this.showIntLand = false;
      }
      this.showIntLand = false;
      if (typeof this.showPartOfSites !== "boolean") {
        this.showPartOfSites = false;
      }
      if (typeof this.showSections !== "boolean") {
        this.showSections = false;
      }
      if (typeof this.showSiteBoundary !== "boolean") {
        this.showSiteBoundary = true;
      }
      this.applyActiveContractPhaseVisibility(this.activeContract);
      if (
        !this.showWorkLotsBusiness &&
        !this.showWorkLotsDomestic &&
        !this.showWorkLotsGovernment
      ) {
        this.showWorkLots = false;
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
      if (
        layerKey === "showPartOfSitesC1" ||
        layerKey === "showSectionsC1" ||
        layerKey === "showSiteBoundaryC1" ||
        layerKey === "showWorkLotsC1"
      ) {
        if (normalized) {
          this.setActiveContract(CONTRACT_PACKAGE.C1);
        } else if (this.activeContract === CONTRACT_PACKAGE.C1) {
          this.setActiveContract(CONTRACT_PACKAGE.C2);
        }
        return;
      }
      if (
        layerKey === "showPartOfSitesC2" ||
        layerKey === "showSectionsC2" ||
        layerKey === "showSiteBoundaryC2" ||
        layerKey === "showWorkLotsC2"
      ) {
        if (normalized) {
          this.setActiveContract(CONTRACT_PACKAGE.C2);
        } else if (this.activeContract === CONTRACT_PACKAGE.C2) {
          this.setActiveContract(CONTRACT_PACKAGE.C1);
        }
        return;
      }
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
      if (layerKey === "showSiteBoundary") {
        this.showSiteBoundary = normalized;
        return;
      }
      if (layerKey === "showPartOfSites") {
        this.showPartOfSites = normalized;
        return;
      }
      if (layerKey === "showSections") {
        this.showSections = normalized;
        return;
      }
      if (layerKey === "showIntLand") {
        this.showIntLand = false;
        return;
      }
      this[layerKey] = normalized;
      if (
        layerKey === "showWorkLotsBusiness" ||
        layerKey === "showWorkLotsDomestic" ||
        layerKey === "showWorkLotsGovernment"
      ) {
        this.showWorkLots =
          (this.showWorkLotsBusiness ||
            this.showWorkLotsDomestic ||
            this.showWorkLotsGovernment);
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
