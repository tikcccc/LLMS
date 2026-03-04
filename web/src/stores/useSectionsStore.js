import { defineStore } from "pinia";
import { normalizeSectionsGeojson } from "../shared/utils/sectionsGeojson";

const SECTIONS_SNAPSHOT_VERSION = 1;

export const useSectionsStore = defineStore("sections", {
  state: () => ({
    snapshotVersion: SECTIONS_SNAPSHOT_VERSION,
    snapshotGeojson: null,
  }),
  getters: {
    hasSnapshot: (state) =>
      !!state.snapshotGeojson &&
      state.snapshotGeojson.type === "FeatureCollection" &&
      Array.isArray(state.snapshotGeojson.features),
  },
  actions: {
    normalizeLegacySections() {
      if (Number(this.snapshotVersion) !== SECTIONS_SNAPSHOT_VERSION) {
        this.snapshotVersion = SECTIONS_SNAPSHOT_VERSION;
        this.snapshotGeojson = null;
        return;
      }
      this.snapshotGeojson = normalizeSectionsGeojson(this.snapshotGeojson);
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
  },
  persist: {
    key: "ND_LLM_V1_sections",
  },
});
