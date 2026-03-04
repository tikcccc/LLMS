import { defineStore } from "pinia";
import { normalizeSectionsGeojson } from "../shared/utils/sectionsGeojson";
import {
  CONTRACT_PACKAGE,
  normalizeContractPackage,
  toContractPhaseScopedId,
} from "../shared/utils/contractPackage";

const SECTIONS_SNAPSHOT_VERSION = 1;
const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};
const normalizeContractPackageValue = (value) =>
  normalizeContractPackage(value, { fallback: CONTRACT_PACKAGE.C2 });
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
const parseScopedSectionKey = (rawKey) => {
  const normalized = normalizeText(rawKey);
  if (!normalized) {
    return {
      sectionId: "",
      contractPackage: "",
    };
  }
  const [head, ...tail] = normalized.split(":");
  if (tail.length > 0 && /^c[12]$/i.test(String(head || "").trim())) {
    return {
      sectionId: tail.join(":").trim(),
      contractPackage: String(head).trim().toUpperCase(),
    };
  }
  return {
    sectionId: normalized,
    contractPackage: "",
  };
};
const buildSectionAttributeKey = (sectionId, contractPackage = CONTRACT_PACKAGE.C2) => {
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) return "";
  return toContractPhaseScopedId(contractPackage, normalizedSectionId).toLowerCase();
};
const normalizeSectionAttribute = (
  value = {},
  sectionId = "",
  contractPackage = CONTRACT_PACKAGE.C2
) => {
  const normalizedSectionId = normalizeSectionId(value?.sectionId || sectionId);
  const normalizedPackage = normalizeContractPackageValue(
    value?.contractPackage ?? value?.contract_package ?? contractPackage
  );
  return {
    sectionId: normalizedSectionId,
    contractPackage: normalizedPackage,
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
    const scopedKey = parseScopedSectionKey(rawKey);
    const sectionId = normalizeSectionId(rawValue?.sectionId || scopedKey.sectionId);
    if (!sectionId) return;
    const contractPackage = normalizeContractPackageValue(
      rawValue?.contractPackage ??
        rawValue?.contract_package ??
        rawValue?.phase ??
        rawValue?.package ??
        scopedKey.contractPackage
    );
    const record = normalizeSectionAttribute(rawValue, sectionId, contractPackage);
    const key = buildSectionAttributeKey(sectionId, contractPackage);
    if (!key) return;
    normalized[key] = record;
  });
  return normalized;
};
const resolveSectionAttributeOverride = (overrides = {}, sectionId, contractPackage = "") => {
  if (!overrides || typeof overrides !== "object") return null;
  const normalizedSectionId = normalizeSectionId(sectionId);
  if (!normalizedSectionId) return null;
  const normalizedPackage = normalizeText(contractPackage);
  if (normalizedPackage) {
    const scopedKey = buildSectionAttributeKey(normalizedSectionId, normalizedPackage);
    if (scopedKey && overrides[scopedKey]) return overrides[scopedKey];
  }
  const legacyKey = normalizedSectionId.toLowerCase();
  if (legacyKey in overrides) return overrides[legacyKey];
  const c2Key = buildSectionAttributeKey(normalizedSectionId, CONTRACT_PACKAGE.C2);
  if (c2Key && overrides[c2Key]) return overrides[c2Key];
  const c1Key = buildSectionAttributeKey(normalizedSectionId, CONTRACT_PACKAGE.C1);
  if (c1Key && overrides[c1Key]) return overrides[c1Key];
  return null;
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
    attributeBySectionId: (state) => (sectionId, contractPackage = "") =>
      resolveSectionAttributeOverride(state.attributeOverrides, sectionId, contractPackage),
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
    setAttributeOverride(sectionId, payload = {}, contractPackage = "") {
      const normalizedSectionId = normalizeSectionId(sectionId);
      if (!normalizedSectionId) return null;
      const normalizedPackage = normalizeContractPackageValue(
        payload?.contractPackage ??
          payload?.contract_package ??
          contractPackage
      );
      const key = buildSectionAttributeKey(normalizedSectionId, normalizedPackage);
      const legacyKey = normalizedSectionId.toLowerCase();
      const current = this.attributeOverrides[key] || this.attributeOverrides[legacyKey] || {};
      const merged = normalizeSectionAttribute(
        {
          ...current,
          ...payload,
          sectionId: normalizedSectionId,
          contractPackage: normalizedPackage,
        },
        normalizedSectionId,
        normalizedPackage
      );
      if (!hasSectionAttributeValue(merged)) {
        if (key in this.attributeOverrides || legacyKey in this.attributeOverrides) {
          const next = { ...this.attributeOverrides };
          delete next[key];
          delete next[legacyKey];
          this.attributeOverrides = next;
        }
        return null;
      }
      const next = {
        ...this.attributeOverrides,
        [key]: merged,
      };
      if (legacyKey in next) {
        delete next[legacyKey];
      }
      this.attributeOverrides = next;
      return merged;
    },
    removeAttributeOverride(sectionId, contractPackage = "") {
      const normalizedSectionId = normalizeSectionId(sectionId);
      if (!normalizedSectionId) return;
      const legacyKey = normalizedSectionId.toLowerCase();
      const next = { ...this.attributeOverrides };
      let changed = false;
      if (legacyKey in next) {
        delete next[legacyKey];
        changed = true;
      }
      const normalizedPackage = normalizeText(contractPackage);
      if (normalizedPackage) {
        const scopedKey = buildSectionAttributeKey(normalizedSectionId, normalizedPackage);
        if (scopedKey && scopedKey in next) {
          delete next[scopedKey];
          changed = true;
        }
      } else {
        [CONTRACT_PACKAGE.C1, CONTRACT_PACKAGE.C2].forEach((packageCode) => {
          const scopedKey = buildSectionAttributeKey(normalizedSectionId, packageCode);
          if (scopedKey && scopedKey in next) {
            delete next[scopedKey];
            changed = true;
          }
        });
      }
      if (!changed) return;
      this.attributeOverrides = next;
    },
  },
  persist: {
    key: "ND_LLM_V1_sections",
  },
});
