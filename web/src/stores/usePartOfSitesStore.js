import { defineStore } from "pinia";
import { normalizePartOfSitesGeojson } from "../shared/utils/partOfSitesGeojson";

const PART_OF_SITES_SNAPSHOT_VERSION = 2;

export const usePartOfSitesStore = defineStore("partOfSites", {
  state: () => ({
    snapshotVersion: PART_OF_SITES_SNAPSHOT_VERSION,
    snapshotGeojson: null,
  }),
  getters: {
    hasSnapshot: (state) =>
      !!state.snapshotGeojson &&
      state.snapshotGeojson.type === "FeatureCollection" &&
      Array.isArray(state.snapshotGeojson.features),
  },
  actions: {
    normalizeLegacyPartOfSites() {
      if (Number(this.snapshotVersion) !== PART_OF_SITES_SNAPSHOT_VERSION) {
        this.snapshotVersion = PART_OF_SITES_SNAPSHOT_VERSION;
        this.snapshotGeojson = null;
        return;
      }
      this.snapshotGeojson = normalizePartOfSitesGeojson(this.snapshotGeojson);
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
  },
  persist: {
    key: "ND_LLM_V1_part_of_sites",
  },
});
