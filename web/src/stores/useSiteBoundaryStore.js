import { defineStore } from "pinia";
import { SITE_BOUNDARY_GEOJSON_URL } from "../shared/config/mapApi";
import {
  buildSiteBoundarySourceRef,
  normalizeSiteBoundary,
  parseSiteBoundaryGeojson,
} from "../shared/utils/siteBoundary";

const sourceRefKey = (value) => String(value || "").trim().toLowerCase();

const mergeSiteBoundaryRecord = (base, existing = null, index = 0, existingIds = new Set()) => {
  const normalizedBase = normalizeSiteBoundary(
    {
      ...base,
      id: existing?.id ?? base?.id,
      sourceRef:
        base?.sourceRef ?? existing?.sourceRef ?? buildSiteBoundarySourceRef(base, index),
    },
    index,
    { existingIds }
  );
  if (!existing) return normalizedBase;
  const normalizedExisting = normalizeSiteBoundary(existing, index, {
    existingIds: new Set(),
  });
  return {
    ...normalizedBase,
    sourceRef: normalizedExisting.sourceRef || normalizedBase.sourceRef,
    name: normalizedExisting.name || normalizedBase.name,
    contractNo: normalizedExisting.contractNo,
    futureUse: normalizedExisting.futureUse,
    assessDate: normalizedExisting.assessDate,
    plannedHandoverDate: normalizedExisting.plannedHandoverDate,
    completionDate: normalizedExisting.completionDate,
    others: normalizedExisting.others,
  };
};

export const useSiteBoundaryStore = defineStore("siteBoundaries", {
  state: () => ({
    siteBoundaries: [],
    loaded: false,
    loading: false,
  }),
  getters: {
    byId: (state) =>
      state.siteBoundaries.reduce((map, boundary) => {
        map.set(String(boundary.id), boundary);
        return map;
      }, new Map()),
  },
  actions: {
    normalizeLegacySiteBoundaries() {
      const existingIds = new Set();
      this.siteBoundaries = this.siteBoundaries.map((boundary, index) =>
        normalizeSiteBoundary(
          {
            ...boundary,
            sourceRef:
              boundary?.sourceRef ?? buildSiteBoundarySourceRef(boundary, index),
          },
          index,
          { existingIds }
        )
      );
    },
    mergeBoundaries(boundaries = []) {
      const existingById = this.byId;
      const existingBySourceRef = this.siteBoundaries.reduce((map, boundary, index) => {
        const key = sourceRefKey(buildSiteBoundarySourceRef(boundary, index));
        if (!key) return map;
        map.set(key, boundary);
        return map;
      }, new Map());
      const existingIds = new Set();
      this.siteBoundaries = boundaries.map((boundary, index) =>
        mergeSiteBoundaryRecord(
          {
            ...boundary,
            sourceRef: buildSiteBoundarySourceRef(boundary, index),
          },
          existingBySourceRef.get(
            sourceRefKey(buildSiteBoundarySourceRef(boundary, index))
          ) || existingById.get(String(boundary.id)),
          index,
          existingIds
        )
      );
      this.loaded = true;
    },
    updateSiteBoundary(id, payload = {}) {
      const normalizedId = String(id || "").trim();
      if (!normalizedId) return;
      const normalizedIdLower = normalizedId.toLowerCase();
      const index = this.siteBoundaries.findIndex(
        (boundary) => String(boundary.id || "").trim().toLowerCase() === normalizedIdLower
      );
      if (index === -1) return;
      const currentBoundary = this.siteBoundaries[index];
      const canonicalId = String(currentBoundary.id);
      const existingIds = new Set(
        this.siteBoundaries
          .filter((_, rowIndex) => rowIndex !== index)
          .map((boundary) => String(boundary.id || "").trim().toLowerCase())
      );
      const normalizedBoundary = normalizeSiteBoundary(
        {
          ...currentBoundary,
          ...payload,
          id: canonicalId,
          sourceRef:
            currentBoundary?.sourceRef ??
            buildSiteBoundarySourceRef(currentBoundary, index),
        },
        index,
        { existingIds }
      );
      const updated = {
        ...normalizedBoundary,
        id: canonicalId,
      };
      this.siteBoundaries.splice(index, 1, updated);
    },
    async ensureLoaded(force = false) {
      if (this.loading) return;
      if (this.loaded && !force) return;
      this.loading = true;
      try {
        const response = await fetch(SITE_BOUNDARY_GEOJSON_URL, { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load Site Boundary GeoJSON: ${response.status}`);
        }
        const data = await response.json();
        const parsed = parseSiteBoundaryGeojson(data);
        this.mergeBoundaries(parsed);
      } catch (error) {
        console.warn("[site-boundary-store] load failed", error);
      } finally {
        this.loading = false;
      }
    },
  },
  persist: {
    key: "ND_LLM_V1_site_boundaries",
  },
});
