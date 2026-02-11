import { defineStore } from "pinia";
import { SITE_BOUNDARY_GEOJSON_URL } from "../shared/config/mapApi";
import {
  buildSiteBoundarySourceRef,
  normalizeSiteBoundary,
  parseSiteBoundaryGeojson,
} from "../shared/utils/siteBoundary";

const sourceRefKey = (value) => String(value || "").trim().toLowerCase();
const hasPolygonGeometry = (geometry) =>
  !!geometry &&
  typeof geometry === "object" &&
  (geometry.type === "Polygon" || geometry.type === "MultiPolygon") &&
  Array.isArray(geometry.coordinates);

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
    area: normalizedExisting.geometry ? normalizedExisting.area : normalizedBase.area,
    hectare: normalizedExisting.geometry ? normalizedExisting.hectare : normalizedBase.hectare,
    contractNo: normalizedExisting.contractNo,
    futureUse: normalizedExisting.futureUse,
    assessDate: normalizedExisting.assessDate,
    plannedHandoverDate: normalizedExisting.plannedHandoverDate,
    completionDate: normalizedExisting.completionDate,
    others: normalizedExisting.others,
    geometry: normalizedExisting.geometry || normalizedBase.geometry,
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
    hydrateMissingGeometry(boundaries = []) {
      if (!Array.isArray(boundaries) || boundaries.length === 0) return;

      const fallbackById = new Map();
      const fallbackBySourceRef = new Map();
      boundaries.forEach((boundary, index) => {
        const sourceRef = sourceRefKey(buildSiteBoundarySourceRef(boundary, index));
        const id = String(boundary?.id || "").trim().toLowerCase();
        if (id) fallbackById.set(id, boundary);
        if (sourceRef) fallbackBySourceRef.set(sourceRef, boundary);
      });

      this.siteBoundaries = this.siteBoundaries.map((boundary, index) => {
        if (hasPolygonGeometry(boundary?.geometry)) return boundary;

        const sourceRef = sourceRefKey(buildSiteBoundarySourceRef(boundary, index));
        const id = String(boundary?.id || "").trim().toLowerCase();
        const fallback =
          fallbackBySourceRef.get(sourceRef) ||
          fallbackById.get(id) ||
          null;
        if (!hasPolygonGeometry(fallback?.geometry)) {
          return boundary;
        }

        const area =
          Number.isFinite(Number(boundary?.area)) && Number(boundary.area) > 0
            ? Number(boundary.area)
            : Number.isFinite(Number(fallback?.area))
              ? Number(fallback.area)
              : 0;

        return {
          ...boundary,
          geometry: fallback.geometry,
          area,
          hectare: area > 0 ? area / 10000 : 0,
        };
      });
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
    addSiteBoundary(payload = {}) {
      const existingIds = new Set(
        this.siteBoundaries.map((boundary) => String(boundary.id || "").trim().toLowerCase())
      );
      const index = this.siteBoundaries.length;
      const explicitSourceRef = String(payload?.sourceRef || "").trim();
      const normalizedBoundary = normalizeSiteBoundary(
        {
          ...payload,
          sourceRef: explicitSourceRef,
        },
        index,
        { existingIds }
      );
      normalizedBoundary.sourceRef = explicitSourceRef || `manual:${normalizedBoundary.id}`;
      this.siteBoundaries.push(normalizedBoundary);
      return normalizedBoundary;
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
    removeSiteBoundary(id) {
      const normalizedId = String(id || "").trim().toLowerCase();
      if (!normalizedId) return;
      this.siteBoundaries = this.siteBoundaries.filter(
        (boundary) => String(boundary.id || "").trim().toLowerCase() !== normalizedId
      );
    },
    async ensureLoaded(force = false) {
      if (this.loading) return;
      const needsGeometryHydration =
        this.loaded &&
        !force &&
        this.siteBoundaries.some((boundary) => !hasPolygonGeometry(boundary?.geometry));
      if (this.loaded && !force && !needsGeometryHydration) return;
      this.loading = true;
      try {
        const response = await fetch(SITE_BOUNDARY_GEOJSON_URL, { cache: "no-cache" });
        if (!response.ok) {
          throw new Error(`Failed to load Site Boundary GeoJSON: ${response.status}`);
        }
        const data = await response.json();
        const parsed = parseSiteBoundaryGeojson(data);
        if (this.loaded && !force) {
          this.hydrateMissingGeometry(parsed);
        } else {
          this.mergeBoundaries(parsed);
        }
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
