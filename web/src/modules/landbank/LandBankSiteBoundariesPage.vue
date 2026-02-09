<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Land Bank · Site Boundaries</h2>
        <p class="muted">Inventory view of all site boundaries.</p>
      </div>
      <div class="actions">
        <el-input
          v-model="searchQuery"
          size="small"
          placeholder="Search site boundaries"
          clearable
          style="width: 220px"
        />
        <el-select v-model="layerFilter" size="small" style="width: 180px">
          <el-option v-for="option in layerOptions" :key="option" :label="option" :value="option" />
        </el-select>
        <el-button type="primary" @click="exportExcel">Export Site Boundaries</el-button>
      </div>
    </div>

    <el-table :data="filteredBoundaries" height="calc(100vh - 260px)" :empty-text="loading ? 'Loading…' : 'No data'">
      <el-table-column prop="id" label="ID" width="150" />
      <el-table-column prop="name" label="Name" min-width="200" />
      <el-table-column prop="layer" label="Source Layer" min-width="180" />
      <el-table-column prop="entity" label="Entity" width="130" />
      <el-table-column label="Area" min-width="180">
        <template #default="{ row }">
          {{ formatArea(row.area) }}
        </template>
      </el-table-column>
      <el-table-column label="" width="90" align="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="viewOnMap(row.id)">View</el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { SITE_BOUNDARY_GEOJSON_URL } from "../../shared/config/mapApi";
import { exportSiteBoundaries } from "../../shared/utils/excel";
import { fuzzyMatchAny } from "../../shared/utils/search";

const router = useRouter();

const boundaries = ref([]);
const layerOptions = ref(["All"]);
const layerFilter = ref("All");
const searchQuery = ref("");
const loading = ref(false);

const ringArea = (ring = []) => {
  if (ring.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < ring.length - 1; i += 1) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    area += x1 * y2 - x2 * y1;
  }
  return Math.abs(area) / 2;
};

const normalizeFeatureId = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const formatArea = (area) => {
  if (!area || Number.isNaN(area)) return "—";
  const ha = area / 10000;
  return `${area.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${ha.toFixed(2)} ha)`;
};

const loadBoundaries = async () => {
  loading.value = true;
  try {
    const response = await fetch(SITE_BOUNDARY_GEOJSON_URL, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to load Site Boundary GeoJSON: ${response.status}`);
    }
    const data = await response.json();
    const features = data.features || [];
    const parsed = features.map((feature, index) => {
      const properties = feature.properties || {};
      const geometry = feature.geometry || {};
      const ring = (geometry.coordinates && geometry.coordinates[0]) || [];
      const area = ringArea(ring);
      const id =
        normalizeFeatureId(feature.id) ||
        normalizeFeatureId(properties.id) ||
        normalizeFeatureId(properties.handle) ||
        `SB-${index + 1}`;
      return {
        id,
        name: properties.name ?? "Site Boundary",
        layer: properties.layer ?? "—",
        entity: properties.entity ?? "Polygon",
        area,
      };
    });
    boundaries.value = parsed;
    const layers = new Set(parsed.map((item) => item.layer).filter(Boolean));
    layerOptions.value = ["All", ...Array.from(layers)];
  } catch (error) {
    console.warn("[site-boundary] load failed", error);
    boundaries.value = [];
    layerOptions.value = ["All"];
  } finally {
    loading.value = false;
  }
};

const filteredBoundaries = computed(() =>
  boundaries.value.filter((item) => {
    if (layerFilter.value !== "All" && item.layer !== layerFilter.value) return false;
    return fuzzyMatchAny(
      [item.id, item.name, item.layer, item.entity],
      searchQuery.value
    );
  })
);

const exportExcel = () => {
  exportSiteBoundaries(filteredBoundaries.value);
};

const viewOnMap = (siteBoundaryId) => {
  router.push({ path: "/map", query: { siteBoundaryId } });
};

onMounted(() => {
  loadBoundaries();
});
</script>

<style scoped>
.page {
  padding: 24px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16px;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.muted {
  color: var(--muted);
}
</style>
