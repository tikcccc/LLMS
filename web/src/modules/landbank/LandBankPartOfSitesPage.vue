<template>
  <section class="page">
    <div class="header">
      <div class="header-copy">
        <h2>Part of Sites</h2>
        <p class="muted">
          Reference list of imported part boundaries from the DXF index.
        </p>
      </div>

      <div class="toolbar">
        <div class="filters">
          <el-input
            v-model="searchQuery"
            size="small"
            placeholder="Search part of sites"
            clearable
            style="width: 220px"
          />
          <el-select v-model="groupFilter" size="small" style="width: 190px">
            <el-option
              v-for="option in groupOptions"
              :key="option"
              :label="option"
              :value="option"
            />
          </el-select>
        </div>
        <div class="action-buttons">
          <el-button size="small" :loading="loading" @click="reloadPartOfSites">
            Reload
          </el-button>
        </div>
      </div>
    </div>

    <el-alert
      v-if="loadError"
      type="error"
      show-icon
      :closable="false"
      class="error-alert"
      :title="loadError"
    />

    <el-table
      :data="filteredRows"
      height="calc(100vh - 260px)"
      :empty-text="loading ? 'Loading…' : 'No part of sites'"
    >
      <el-table-column prop="partId" label="Part ID" width="120" fixed="left" />
      <el-table-column prop="groupLabel" label="Group" min-width="140" />
      <el-table-column prop="systemId" label="System ID" min-width="220" />
      <el-table-column label="Features" width="90" align="center">
        <template #default="{ row }">
          {{ row.featureCount }}
        </template>
      </el-table-column>
      <el-table-column label="Geometry" min-width="150">
        <template #default="{ row }">
          {{ geometryTypeText(row.geometryTypes) }}
        </template>
      </el-table-column>
      <el-table-column label="Source DXF" min-width="280">
        <template #default="{ row }">
          <span class="mono">{{ row.sourceDxf || "—" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="Generated At" width="130">
        <template #default="{ row }">
          <TimeText :value="row.generatedAt" mode="date" />
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="120" align="right" fixed="right">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button link type="primary" @click="viewOnMap(row.partId)">View</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import TimeText from "../../components/TimeText.vue";
import { fuzzyMatchAny } from "../../shared/utils/search";
import {
  PART_OF_SITES_CACHE_TTL_MS,
  PART_OF_SITES_GEOJSON_INDEX_URL,
  PART_OF_SITES_INDEX_CONCURRENCY,
  STATIC_JSON_FETCH_CACHE_MODE,
} from "../../shared/config/mapApi";
import {
  fetchJsonWithCache,
  mapWithConcurrency,
} from "../../shared/utils/asyncDataLoader";

const router = useRouter();

const loading = ref(false);
const loadError = ref("");
const rows = ref([]);
const searchQuery = ref("");
const groupFilter = ref("All");

const compareNatural = (left, right) =>
  String(left || "").localeCompare(String(right || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });

const normalizeToken = (value, fallback) => {
  const normalized = String(value || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
  return normalized || fallback;
};

const buildPartOfSitesSystemId = (groupLabel, partId) =>
  `POS-${normalizeToken(groupLabel, "PART")}-${normalizeToken(partId, "UNK")}-001`;

const geometryTypeText = (types) => {
  const normalized = Array.isArray(types)
    ? types.map((type) => String(type || "").trim()).filter(Boolean)
    : [];
  return normalized.length > 0 ? normalized.join(", ") : "—";
};

const fetchJsonOrThrow = async (url, label, { forceRefresh = false } = {}) => {
  try {
    return await fetchJsonWithCache(url, {
      ttlMs: PART_OF_SITES_CACHE_TTL_MS,
      forceRefresh,
      requestCache: STATIC_JSON_FETCH_CACHE_MODE,
    });
  } catch (error) {
    const status = Number(error?.status);
    if (Number.isFinite(status)) {
      throw new Error(`${label} load failed (HTTP ${status})`);
    }
    throw new Error(`${label} load failed (${error?.message || "unknown error"})`);
  }
};

const loadPartOfSites = async ({ forceRefresh = false } = {}) => {
  loading.value = true;
  loadError.value = "";
  try {
    const rootIndex = await fetchJsonOrThrow(
      PART_OF_SITES_GEOJSON_INDEX_URL,
      "Part of Sites index",
      { forceRefresh }
    );
    const groups = Array.isArray(rootIndex?.groups) ? rootIndex.groups : [];
    const rootGeneratedAt = String(rootIndex?.generatedAt || "").trim();
    const groupedRows = await mapWithConcurrency(
      groups,
      async (groupMeta, groupIndex) => {
        const normalizedGroupMeta = groupMeta || {};
        const groupLabel =
          String(normalizedGroupMeta.id || "").trim() || `PART ${groupIndex + 1}`;
        const groupIndexUrl = String(normalizedGroupMeta.index || "").trim();
        if (!groupIndexUrl) return [];

        const groupIndexData = await fetchJsonOrThrow(
          groupIndexUrl,
          `Part of Sites group index (${groupLabel})`,
          { forceRefresh }
        );
        const items = Array.isArray(groupIndexData?.items) ? groupIndexData.items : [];
        const generatedAt = String(groupIndexData?.generatedAt || rootGeneratedAt).trim();

        return items.flatMap((item) => {
          const partId = String(item?.id || "").trim();
          if (!partId) return [];
          const featureCount = Number(item?.featureCount);
          const geometryTypes = Array.isArray(item?.geometryTypes) ? item.geometryTypes : [];
          return [
            {
              key: `${groupLabel}:${partId}`,
              partId,
              groupLabel,
              systemId: buildPartOfSitesSystemId(groupLabel, partId),
              featureCount:
                Number.isFinite(featureCount) && featureCount >= 0 ? featureCount : 0,
              geometryTypes,
              sourceDxf: String(item?.sourceDxf || "").trim(),
              generatedAt,
            },
          ];
        });
      },
      { concurrency: PART_OF_SITES_INDEX_CONCURRENCY }
    );
    const collected = groupedRows.flat();

    rows.value = collected.sort(
      (left, right) =>
        compareNatural(left.groupLabel, right.groupLabel) ||
        compareNatural(left.partId, right.partId)
    );
  } catch (error) {
    rows.value = [];
    loadError.value = error?.message || "Failed to load part of sites index.";
  } finally {
    loading.value = false;
  }
};

const reloadPartOfSites = () => loadPartOfSites({ forceRefresh: true });

const groupOptions = computed(() => {
  const options = Array.from(new Set(rows.value.map((row) => row.groupLabel))).sort(
    compareNatural
  );
  return ["All", ...options];
});

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    if (groupFilter.value !== "All" && row.groupLabel !== groupFilter.value) return false;
    return fuzzyMatchAny(
      [
        row.partId,
        row.groupLabel,
        row.systemId,
        row.sourceDxf,
        row.featureCount,
        geometryTypeText(row.geometryTypes),
      ],
      searchQuery.value
    );
  })
);

const viewOnMap = (partOfSiteId) => {
  router.push({ path: "/map", query: { partOfSiteId } });
};

onMounted(() => {
  loadPartOfSites();
});
</script>

<style scoped>
.page {
  padding: 24px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.header-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f8fafc;
}

.filters {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  flex: 1 1 420px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 0 0 auto;
}

.muted {
  color: var(--muted);
}

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.mono {
  font-family: "IBM Plex Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
  font-size: 12px;
}

.error-alert {
  margin-bottom: 12px;
}

@media (max-width: 1120px) {
  .toolbar {
    align-items: flex-start;
  }

  .action-buttons {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
