import { defineStore } from "pinia";
import { normalizePartOfSitesGeojson } from "../shared/utils/partOfSitesGeojson";

const PART_OF_SITES_SNAPSHOT_VERSION = 2;
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
const normalizePartId = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
  return normalized;
};
const normalizePartAttribute = (value = {}, partId = "") => {
  const normalizedPartId = normalizePartId(value?.partId || partId);
  return {
    partId: normalizedPartId,
    accessDate: normalizeDateText(value?.accessDate),
    area: normalizeNumber(value?.area),
    updatedAt: normalizeText(value?.updatedAt),
    updatedBy: normalizeText(value?.updatedBy),
  };
};
const normalizePartAttributeOverrides = (overrides = {}) => {
  if (!overrides || typeof overrides !== "object") return {};
  const normalized = {};
  Object.entries(overrides).forEach(([rawKey, rawValue]) => {
    const partId = normalizePartId(rawValue?.partId || rawKey);
    if (!partId) return;
    const record = normalizePartAttribute(rawValue, partId);
    normalized[partId.toLowerCase()] = record;
  });
  return normalized;
};
const hasPartAttributeValue = (record = {}) =>
  !!normalizeText(record?.accessDate) ||
  Number.isFinite(Number(record?.area)) ||
  !!normalizeText(record?.updatedAt) ||
  !!normalizeText(record?.updatedBy);

export const usePartOfSitesStore = defineStore("partOfSites", {
  state: () => ({
    snapshotVersion: PART_OF_SITES_SNAPSHOT_VERSION,
    snapshotGeojson: null,
    attributeOverrides: {},
  }),
  getters: {
    hasSnapshot: (state) =>
      !!state.snapshotGeojson &&
      state.snapshotGeojson.type === "FeatureCollection" &&
      Array.isArray(state.snapshotGeojson.features),
    attributeByPartId: (state) => (partId) => {
      const normalizedPartId = normalizePartId(partId);
      if (!normalizedPartId) return null;
      return state.attributeOverrides[normalizedPartId.toLowerCase()] || null;
    },
  },
  actions: {
    normalizeLegacyPartOfSites() {
      if (Number(this.snapshotVersion) !== PART_OF_SITES_SNAPSHOT_VERSION) {
        this.snapshotVersion = PART_OF_SITES_SNAPSHOT_VERSION;
        this.snapshotGeojson = null;
        this.attributeOverrides = {};
      } else {
        this.snapshotGeojson = normalizePartOfSitesGeojson(this.snapshotGeojson);
      }
      this.attributeOverrides = normalizePartAttributeOverrides(this.attributeOverrides);
    },
    saveSnapshotGeojson(featureCollection) {
      const normalized = normalizePartOfSitesGeojson(featureCollection);
      if (!normalized) return false;
      this.snapshotGeojson = normalized;
      this.snapshotVersion = PART_OF_SITES_SNAPSHOT_VERSION;
      return true;
    },
    clearSnapshotGeojson() {
      this.snapshotGeojson = null;
      this.snapshotVersion = PART_OF_SITES_SNAPSHOT_VERSION;
    },
    setAttributeOverride(partId, payload = {}) {
      const normalizedPartId = normalizePartId(partId);
      if (!normalizedPartId) return null;
      const key = normalizedPartId.toLowerCase();
      const current = this.attributeOverrides[key] || {};
      const merged = normalizePartAttribute(
        {
          ...current,
          ...payload,
          partId: normalizedPartId,
        },
        normalizedPartId
      );
      if (!hasPartAttributeValue(merged)) {
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
    removeAttributeOverride(partId) {
      const normalizedPartId = normalizePartId(partId);
      if (!normalizedPartId) return;
      const key = normalizedPartId.toLowerCase();
      if (!(key in this.attributeOverrides)) return;
      const next = { ...this.attributeOverrides };
      delete next[key];
      this.attributeOverrides = next;
    },
  },
  persist: {
    key: "ND_LLM_V1_part_of_sites",
  },
});
