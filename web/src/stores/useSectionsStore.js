import { defineStore } from "pinia";
import { normalizeSectionsGeojson } from "../shared/utils/sectionsGeojson";

const SECTIONS_SNAPSHOT_VERSION = 1;
const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};
const normalizeDateText = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};
const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};
const normalizeSectionId = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
  return normalized;
};
const normalizeSectionAttribute = (value = {}, sectionId = "") => {
  const normalizedSectionId = normalizeSectionId(value?.sectionId || sectionId);
  return {
    sectionId: normalizedSectionId,
    completionDate: normalizeDateText(value?.completionDate),
    area: normalizeNumber(value?.area),
    updatedAt: normalizeText(value?.updatedAt),
    updatedBy: normalizeText(value?.updatedBy),
  };
};
const normalizeSectionAttributeOverrides = (overrides = {}) => {
  if (!overrides || typeof overrides !== "object") return {};
  const normalized = {};
  Object.entries(overrides).forEach(([rawKey, rawValue]) => {
    const sectionId = normalizeSectionId(rawValue?.sectionId || rawKey);
    if (!sectionId) return;
    const record = normalizeSectionAttribute(rawValue, sectionId);
    normalized[sectionId.toLowerCase()] = record;
  });
  return normalized;
};
const hasSectionAttributeValue = (record = {}) =>
  !!normalizeText(record?.completionDate) ||
  Number.isFinite(Number(record?.area)) ||
  !!normalizeText(record?.updatedAt) ||
  !!normalizeText(record?.updatedBy);

export const useSectionsStore = defineStore("sections", {
  state: () => ({
    snapshotVersion: SECTIONS_SNAPSHOT_VERSION,
    snapshotGeojson: null,
    attributeOverrides: {},
  }),
  getters: {
    hasSnapshot: (state) =>
      !!state.snapshotGeojson &&
      state.snapshotGeojson.type === "FeatureCollection" &&
      Array.isArray(state.snapshotGeojson.features),
    attributeBySectionId: (state) => (sectionId) => {
      const normalizedSectionId = normalizeSectionId(sectionId);
      if (!normalizedSectionId) return null;
      return state.attributeOverrides[normalizedSectionId.toLowerCase()] || null;
    },
  },
  actions: {
    normalizeLegacySections() {
      if (Number(this.snapshotVersion) !== SECTIONS_SNAPSHOT_VERSION) {
        this.snapshotVersion = SECTIONS_SNAPSHOT_VERSION;
        this.snapshotGeojson = null;
        this.attributeOverrides = {};
      } else {
        this.snapshotGeojson = normalizeSectionsGeojson(this.snapshotGeojson);
      }
      this.attributeOverrides = normalizeSectionAttributeOverrides(this.attributeOverrides);
    },
    saveSnapshotGeojson(featureCollection) {
      const normalized = normalizeSectionsGeojson(featureCollection);
      if (!normalized) return false;
      this.snapshotGeojson = normalized;
      this.snapshotVersion = SECTIONS_SNAPSHOT_VERSION;
      return true;
    },
    clearSnapshotGeojson() {
      this.snapshotGeojson = null;
      this.snapshotVersion = SECTIONS_SNAPSHOT_VERSION;
    },
    setAttributeOverride(sectionId, payload = {}) {
      const normalizedSectionId = normalizeSectionId(sectionId);
      if (!normalizedSectionId) return null;
      const key = normalizedSectionId.toLowerCase();
      const current = this.attributeOverrides[key] || {};
      const merged = normalizeSectionAttribute(
        {
          ...current,
          ...payload,
          sectionId: normalizedSectionId,
        },
        normalizedSectionId
      );
      if (!hasSectionAttributeValue(merged)) {
        if (key in this.attributeOverrides) {
          const next = { ...this.attributeOverrides };
          delete next[key];
          this.attributeOverrides = next;
        }
        return null;
      }
      this.attributeOverrides = {
        ...this.attributeOverrides,
        [key]: merged,
      };
      return merged;
    },
    removeAttributeOverride(sectionId) {
      const normalizedSectionId = normalizeSectionId(sectionId);
      if (!normalizedSectionId) return;
      const key = normalizedSectionId.toLowerCase();
      if (!(key in this.attributeOverrides)) return;
      const next = { ...this.attributeOverrides };
      delete next[key];
      this.attributeOverrides = next;
    },
  },
  persist: {
    key: "ND_LLM_V1_sections",
  },
});
