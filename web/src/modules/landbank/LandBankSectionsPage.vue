<template>
  <section class="page">
    <div class="header">
      <div class="header-copy">
        <h2>Sections</h2>
        <p class="muted">
          Reference list of imported section boundaries from the DXF index.
        </p>
      </div>

      <div class="toolbar">
        <div class="filters">
          <el-input
            v-model="searchQuery"
            size="small"
            placeholder="Search sections"
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
          <el-button size="small" :loading="loading" @click="loadSections">
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
      :empty-text="loading ? 'Loading…' : 'No sections'"
    >
      <el-table-column prop="sectionId" label="Section ID" width="120" fixed="left" />
      <el-table-column prop="groupLabel" label="Group" min-width="140" />
      <el-table-column prop="systemId" label="System ID" min-width="220" />
      <el-table-column label="Related Parts" width="120" align="center">
        <template #default="{ row }">
          {{ row.partCount }}
        </template>
      </el-table-column>
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
            <el-button link type="primary" @click="viewOnMap(row.sectionId)">View</el-button>
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
import { SECTIONS_GEOJSON_INDEX_URL } from "../../shared/config/mapApi";

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

const buildSectionSystemId = (groupLabel, sectionId) =>
  `SOW-${normalizeToken(groupLabel, "SEC")}-${normalizeToken(sectionId, "UNK")}-001`;

const geometryTypeText = (types) => {
  const normalized = Array.isArray(types)
    ? types.map((type) => String(type || "").trim()).filter(Boolean)
    : [];
  return normalized.length > 0 ? normalized.join(", ") : "—";
};

const fetchJsonOrThrow = async (url, label) => {
  const response = await fetch(url, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`${label} load failed (HTTP ${response.status})`);
  }
  return response.json();
};

const loadSections = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    const rootIndex = await fetchJsonOrThrow(
      SECTIONS_GEOJSON_INDEX_URL,
      "Sections index"
    );
    const groups = Array.isArray(rootIndex?.groups) ? rootIndex.groups : [];
    const rootGeneratedAt = String(rootIndex?.generatedAt || "").trim();
    const collected = [];

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
      const groupMeta = groups[groupIndex] || {};
      const groupLabel = String(groupMeta.id || "").trim() || `SECTION ${groupIndex + 1}`;
      const groupIndexUrl = String(groupMeta.index || "").trim();
      if (!groupIndexUrl) continue;

      const groupIndexData = await fetchJsonOrThrow(
        groupIndexUrl,
        `Section group index (${groupLabel})`
      );
      const items = Array.isArray(groupIndexData?.items) ? groupIndexData.items : [];
      const generatedAt = String(groupIndexData?.generatedAt || rootGeneratedAt).trim();

      items.forEach((item) => {
        const sectionId = String(item?.id || "").trim();
        if (!sectionId) return;
        const featureCount = Number(item?.featureCount);
        const partCount = Number(item?.partCount);
        const geometryTypes = Array.isArray(item?.geometryTypes) ? item.geometryTypes : [];
        collected.push({
          key: `${groupLabel}:${sectionId}`,
          sectionId,
          groupLabel,
          systemId: buildSectionSystemId(groupLabel, sectionId),
          featureCount:
            Number.isFinite(featureCount) && featureCount >= 0 ? featureCount : 0,
          partCount: Number.isFinite(partCount) && partCount >= 0 ? partCount : 0,
          geometryTypes,
          sourceDxf: String(item?.sourceDxf || "").trim(),
          generatedAt,
        });
      });
    }

    rows.value = collected.sort(
      (left, right) =>
        compareNatural(left.groupLabel, right.groupLabel) ||
        compareNatural(left.sectionId, right.sectionId)
    );
  } catch (error) {
    rows.value = [];
    loadError.value = error?.message || "Failed to load sections index.";
  } finally {
    loading.value = false;
  }
};

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
        row.sectionId,
        row.groupLabel,
        row.systemId,
        row.partCount,
        row.sourceDxf,
        row.featureCount,
        geometryTypeText(row.geometryTypes),
      ],
      searchQuery.value
    );
  })
);

const viewOnMap = (sectionId) => {
  router.push({ path: "/map", query: { sectionId } });
};

onMounted(() => {
  loadSections();
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
