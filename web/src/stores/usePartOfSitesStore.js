import { defineStore } from "pinia";
import { normalizePartOfSitesGeojson } from "../shared/utils/partOfSitesGeojson";
import {
  CONTRACT_PACKAGE,
  CONTRACT_PACKAGE_VALUES,
  normalizeContractPackage,
  toContractPhaseScopedId,
} from "../shared/utils/contractPackage";

const PART_OF_SITES_SNAPSHOT_VERSION = 2;
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
const normalizePartId = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
  return normalized;
};
const parseScopedPartKey = (rawKey) => {
  const normalized = normalizeText(rawKey);
  if (!normalized) {
    return {
      partId: "",
      contractPackage: "",
    };
  }
  const [head, ...tail] = normalized.split(":");
  if (tail.length > 0 && /^c[123]$/i.test(String(head || "").trim())) {
    return {
      partId: tail.join(":").trim(),
      contractPackage: String(head).trim().toUpperCase(),
    };
  }
  return {
    partId: normalized,
    contractPackage: "",
  };
};
const buildPartAttributeKey = (partId, contractPackage = CONTRACT_PACKAGE.C2) => {
  const normalizedPartId = normalizePartId(partId);
  if (!normalizedPartId) return "";
  return toContractPhaseScopedId(contractPackage, normalizedPartId).toLowerCase();
};
const normalizePartAttribute = (
  value = {},
  partId = "",
  contractPackage = CONTRACT_PACKAGE.C2
) => {
  const normalizedPartId = normalizePartId(value?.partId || partId);
  const normalizedPackage = normalizeContractPackageValue(
    value?.contractPackage ?? value?.contract_package ?? contractPackage
  );
  return {
    partId: normalizedPartId,
    contractPackage: normalizedPackage,
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
    const scopedKey = parseScopedPartKey(rawKey);
    const partId = normalizePartId(rawValue?.partId || scopedKey.partId);
    if (!partId) return;
    const contractPackage = normalizeContractPackageValue(
      rawValue?.contractPackage ??
        rawValue?.contract_package ??
        rawValue?.phase ??
        rawValue?.package ??
        scopedKey.contractPackage
    );
    const record = normalizePartAttribute(rawValue, partId, contractPackage);
    const key = buildPartAttributeKey(partId, contractPackage);
    if (!key) return;
    normalized[key] = record;
  });
  return normalized;
};
const resolvePartAttributeOverride = (overrides = {}, partId, contractPackage = "") => {
  if (!overrides || typeof overrides !== "object") return null;
  const normalizedPartId = normalizePartId(partId);
  if (!normalizedPartId) return null;
  const normalizedPackage = normalizeText(contractPackage);
  if (normalizedPackage) {
    const scopedKey = buildPartAttributeKey(normalizedPartId, normalizedPackage);
    if (scopedKey && overrides[scopedKey]) return overrides[scopedKey];
  }
  const legacyKey = normalizedPartId.toLowerCase();
  if (legacyKey in overrides) return overrides[legacyKey];
  for (const packageCode of [
    CONTRACT_PACKAGE.C2,
    CONTRACT_PACKAGE.C1,
    CONTRACT_PACKAGE.C3,
  ]) {
    const scopedKey = buildPartAttributeKey(normalizedPartId, packageCode);
    if (scopedKey && overrides[scopedKey]) return overrides[scopedKey];
  }
  return null;
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
    attributeByPartId: (state) => (partId, contractPackage = "") =>
      resolvePartAttributeOverride(state.attributeOverrides, partId, contractPackage),
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
    setAttributeOverride(partId, payload = {}, contractPackage = "") {
      const normalizedPartId = normalizePartId(partId);
      if (!normalizedPartId) return null;
      const normalizedPackage = normalizeContractPackageValue(
        payload?.contractPackage ??
          payload?.contract_package ??
          contractPackage
      );
      const key = buildPartAttributeKey(normalizedPartId, normalizedPackage);
      const legacyKey = normalizedPartId.toLowerCase();
      const current = this.attributeOverrides[key] || this.attributeOverrides[legacyKey] || {};
      const merged = normalizePartAttribute(
        {
          ...current,
          ...payload,
          partId: normalizedPartId,
          contractPackage: normalizedPackage,
        },
        normalizedPartId,
        normalizedPackage
      );
      if (!hasPartAttributeValue(merged)) {
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
    removeAttributeOverride(partId, contractPackage = "") {
      const normalizedPartId = normalizePartId(partId);
      if (!normalizedPartId) return;
      const legacyKey = normalizedPartId.toLowerCase();
      const next = { ...this.attributeOverrides };
      let changed = false;
      if (legacyKey in next) {
        delete next[legacyKey];
        changed = true;
      }
      const normalizedPackage = normalizeText(contractPackage);
      if (normalizedPackage) {
        const scopedKey = buildPartAttributeKey(normalizedPartId, normalizedPackage);
        if (scopedKey && scopedKey in next) {
          delete next[scopedKey];
          changed = true;
        }
      } else {
        CONTRACT_PACKAGE_VALUES.forEach((packageCode) => {
          const scopedKey = buildPartAttributeKey(normalizedPartId, packageCode);
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
    key: "ND_LLM_V1_part_of_sites",
  },
});
