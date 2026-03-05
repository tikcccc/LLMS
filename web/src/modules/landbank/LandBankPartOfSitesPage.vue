<template>
  <section class="page">
    <div class="header">
      <div class="header-copy">
        <h2>Part of Sites</h2>
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
          <el-select v-model="contractFilter" size="small" style="width: 130px">
            <el-option
              v-for="option in contractOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </div>
        <div class="action-buttons">
          <el-button size="small" type="primary" plain @click="exportSelectedJson">
            Export JSON
          </el-button>
          <el-dropdown trigger="click" @command="handleExportReportCommand">
            <el-button size="small" type="primary">
              Export Report
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="option in reportFormatOptions"
                  :key="option.value"
                  :command="option.value"
                >
                  {{ option.label }}
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
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
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="46" fixed="left" />
      <el-table-column prop="partId" label="Part ID" width="120" fixed="left" />
      <el-table-column prop="groupLabel" label="Group" min-width="140" />
      <el-table-column prop="systemId" label="System ID" min-width="220" />
      <el-table-column prop="contractPackage" label="Contract" width="110" />
      <el-table-column label="Access Date" width="130">
        <template #default="{ row }">
          <TimeText :value="row.accessDate" mode="date" />
        </template>
      </el-table-column>
      <el-table-column label="Area" min-width="170">
        <template #default="{ row }">
          {{ formatArea(row.area) }}
        </template>
      </el-table-column>
      <el-table-column label="Related Sections" min-width="220">
        <template #default="{ row }">
          <span v-if="relatedSectionNames(row).length === 0">
            {{ row.sectionCount > 0 ? `${row.sectionCount} related sections` : "—" }}
          </span>
          <el-popover v-else trigger="hover" placement="top-start" :width="320">
            <template #reference>
              <button type="button" class="related-sections-trigger">
                <span>{{ relatedSectionSummary(row) }}</span>
                <span class="related-count-pill">{{ relatedSectionNames(row).length }}</span>
              </button>
            </template>
            <div class="related-sections-popover">
              <div class="popover-title">
                {{ relatedSectionNames(row).length }} related sections
              </div>
              <ul class="popover-list">
                <li
                  v-for="sectionId in relatedSectionNames(row)"
                  :key="sectionId"
                >
                  {{ sectionId }}
                </li>
              </ul>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="170" align="right" fixed="right">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button link type="primary" @click="viewOnMap(row.partId)">View</el-button>
            <el-button link type="primary" @click="openEditDialog(row)">Edit</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <PartOfSiteDialog
      v-model="showEditDialog"
      title="Edit Part of Site"
      confirm-text="Save"
      :system-id="editForm.id"
      :part-id="editForm.partId"
      v-model:contractPackage="editingContractPackage"
      v-model:accessDate="editForm.accessDate"
      v-model:area="editForm.area"
      @confirm="saveEditPartOfSite"
      @cancel="cancelEditPartOfSite"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import PartOfSiteDialog from "../map/components/PartOfSiteDialog.vue";
import TimeText from "../../components/TimeText.vue";
import { useAuthStore } from "../../stores/useAuthStore";
import { usePartOfSitesStore } from "../../stores/usePartOfSitesStore";
import { fuzzyMatchAny } from "../../shared/utils/search";
import {
  PART_OF_SITES_FILE_CONCURRENCY,
  PART_OF_SITES_CACHE_TTL_MS,
  PART_OF_SITES_GEOJSON_INDEX_URL,
  PART_OF_SITES_INDEX_CONCURRENCY,
  SECTIONS_GEOJSON_INDEX_URL,
  STATIC_JSON_FETCH_CACHE_MODE,
} from "../../shared/config/mapApi";
import {
  fetchJsonWithCache,
  mapWithConcurrency,
} from "../../shared/utils/asyncDataLoader";
import { nowIso } from "../../shared/utils/time";
import {
  createPartOfSiteEditForm,
  buildPartOfSiteUpdatePayload,
} from "../../shared/utils/partOfSiteEdit";
import { featureCollectionAreaSqm } from "../../shared/utils/geojsonArea";
import {
  REPORT_FORMAT_OPTIONS,
  exportPartOfSitesReport,
} from "../../shared/utils/reportExport";
import {
  CONTRACT_PACKAGE,
  resolveContractPackage,
  toContractPhaseScopedId,
} from "../../shared/utils/contractPackage";
import { downloadJson } from "../../shared/utils/jsonDownload";
import { resolvePartGroupLabel } from "../../shared/utils/partGroup";

const router = useRouter();
const authStore = useAuthStore();
const partOfSitesStore = usePartOfSitesStore();

const loading = ref(false);
const loadError = ref("");
const rows = ref([]);
const searchQuery = ref("");
const groupFilter = ref("All");
const contractFilter = ref("ALL");
const showEditDialog = ref(false);
const selectedRows = ref([]);
const editForm = ref(createPartOfSiteEditForm());
const editingContractPackage = ref(CONTRACT_PACKAGE.C2);
const editingOriginalContractPackage = ref(CONTRACT_PACKAGE.C2);
const reportFormatOptions = REPORT_FORMAT_OPTIONS;

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
const SECTION_RELATION_INDEX_CONCURRENCY = 4;
const SECTION_RELATION_FILE_CONCURRENCY = 6;

const formatArea = (area) => {
  const value = Number(area);
  if (!Number.isFinite(value) || value <= 0) return "—";
  const hectare = value / 10000;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} m² (${hectare.toFixed(
    2
  )} ha)`;
};
const normalizeDateText = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
};
const normalizeAreaNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};
const normalizePartIdText = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";
  if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
  return normalized;
};
const normalizeSectionIdText = (value) => String(value || "").trim();
const normalizeRelatedIdCollection = (value) => {
  const sourceValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[;,|]/)
      : [value];
  const dedupe = new Set();
  sourceValues.forEach((item) => {
    if (item === null || item === undefined) return;
    const normalized = String(item).trim();
    if (!normalized) return;
    dedupe.add(normalized);
  });
  return Array.from(dedupe);
};
const resolveContractPackageValue = (values = []) =>
  resolveContractPackage(values, { fallback: CONTRACT_PACKAGE.C2 });
const contractOptions = [
  { label: "All Contracts", value: "ALL" },
  { label: CONTRACT_PACKAGE.C1, value: CONTRACT_PACKAGE.C1 },
  { label: CONTRACT_PACKAGE.C2, value: CONTRACT_PACKAGE.C2 },
];
const resolvePartAttributeOverride = (partId, contractPackage = "") => {
  const normalizedPartId = String(partId || "").trim();
  if (!normalizedPartId) return null;
  const normalizedPackage = resolveContractPackageValue(contractPackage);
  if (typeof partOfSitesStore.attributeByPartId === "function") {
    return partOfSitesStore.attributeByPartId(normalizedPartId, normalizedPackage);
  }
  return (
    partOfSitesStore.attributeOverrides?.[
      toContractPhaseScopedId(normalizedPackage, normalizedPartId).toLowerCase()
    ] || partOfSitesStore.attributeOverrides?.[normalizedPartId.toLowerCase()] || null
  );
};
const applyPartOverridesToRow = (row = {}) => {
  const contractPackage = resolveContractPackageValue([
    row.contractPackage,
    row.groupLabel,
    row.sourceDxf,
  ]);
  const override = resolvePartAttributeOverride(row.partId, contractPackage);
  const accessDate =
    normalizeDateText(override?.accessDate) || normalizeDateText(row.baseAccessDate);
  const area = normalizeAreaNumber(override?.area) ?? normalizeAreaNumber(row.baseArea);
  return {
    ...row,
    contractPackage,
    accessDate,
    area,
    updatedAt: String(override?.updatedAt || ""),
    updatedBy: String(override?.updatedBy || ""),
  };
};
const pickAccessDateFromFeatureCollection = (payload = {}) => {
  const features = Array.isArray(payload?.features) ? payload.features : [];
  for (const feature of features) {
    const properties = feature?.properties || {};
    const value = normalizeDateText(properties.accessDate || properties.access_date);
    if (value) return value;
  }
  return "";
};
const pickSectionIdsFromPartFeatureCollection = (payload = {}) => {
  const features = Array.isArray(payload?.features) ? payload.features : [];
  const sectionIdSet = new Set();

  for (const feature of features) {
    const properties = feature?.properties || {};
    const candidates = [
      properties.sectionIds,
      properties.relatedSectionIds,
      properties.related_sections,
      properties.sectionId,
      properties.section_id,
    ];
    candidates.forEach((candidate) => {
      normalizeRelatedIdCollection(candidate).forEach((sectionId) => {
        const normalized = normalizeSectionIdText(sectionId);
        if (normalized) sectionIdSet.add(normalized);
      });
    });
  }

  return Array.from(sectionIdSet).sort(compareNatural);
};
const pickRelatedPartIdsFromSectionFeatureCollection = (payload = {}) => {
  const features = Array.isArray(payload?.features) ? payload.features : [];
  const partIdSet = new Set();

  for (const feature of features) {
    const properties = feature?.properties || {};
    const candidates = [
      properties.relatedPartIds,
      properties.relatedPartLotIds,
      properties.related_part_ids,
      properties.relatedParts,
      properties.partIds,
      properties.part_id,
    ];
    candidates.forEach((candidate) => {
      normalizeRelatedIdCollection(candidate).forEach((partId) => {
        const normalized = normalizePartIdText(partId);
        if (normalized) partIdSet.add(normalized);
      });
    });
  }

  return Array.from(partIdSet);
};
const resolveSectionIdFromFeatureCollection = (payload = {}, fallback = "") => {
  const features = Array.isArray(payload?.features) ? payload.features : [];
  for (const feature of features) {
    const properties = feature?.properties || {};
    const sectionId = normalizeSectionIdText(
      properties.sectionId ||
        properties.section_id ||
        properties.sectionLotId ||
        properties.refId ||
        properties.id
    );
    if (sectionId) return sectionId;
  }
  return normalizeSectionIdText(fallback);
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
const buildPartToSectionMap = async ({ forceRefresh = false } = {}) => {
  try {
    const sectionRootIndex = await fetchJsonOrThrow(
      SECTIONS_GEOJSON_INDEX_URL,
      "Sections index",
      { forceRefresh }
    );
    const sectionGroups = Array.isArray(sectionRootIndex?.groups) ? sectionRootIndex.groups : [];
    const sectionGroupItems = await mapWithConcurrency(
      sectionGroups,
      async (sectionGroupMeta, sectionGroupIndex) => {
        const normalizedGroupMeta = sectionGroupMeta || {};
        const groupLabel =
          String(normalizedGroupMeta.id || "").trim() || `SECTION ${sectionGroupIndex + 1}`;
        const groupIndexUrl = String(normalizedGroupMeta.index || "").trim();
        if (!groupIndexUrl) return [];
        const groupIndexData = await fetchJsonOrThrow(
          groupIndexUrl,
          `Section group index (${groupLabel})`,
          { forceRefresh }
        );
        const items = Array.isArray(groupIndexData?.items) ? groupIndexData.items : [];
        return items.map((item) => ({
          item: item || {},
        }));
      },
      { concurrency: SECTION_RELATION_INDEX_CONCURRENCY }
    );

    const mappingTasks = sectionGroupItems.flat().filter((record) => {
      const sectionFileUrl = String(record?.item?.file || "").trim();
      return Boolean(sectionFileUrl);
    });
    const mappingEntries = await mapWithConcurrency(
      mappingTasks,
      async (record, itemIndex) => {
        const sectionFileUrl = String(record?.item?.file || "").trim();
        if (!sectionFileUrl) return null;
        const sectionIdHint =
          normalizeSectionIdText(record?.item?.id) ||
          `SECTION_${String(itemIndex + 1).padStart(3, "0")}`;
        try {
          const sectionFeatureCollection = await fetchJsonOrThrow(
            sectionFileUrl,
            `Section GeoJSON (${sectionIdHint})`,
            { forceRefresh }
          );
          const sectionId =
            resolveSectionIdFromFeatureCollection(sectionFeatureCollection, sectionIdHint) ||
            sectionIdHint;
          const relatedPartIds =
            pickRelatedPartIdsFromSectionFeatureCollection(sectionFeatureCollection);
          return { sectionId, relatedPartIds };
        } catch (error) {
          console.warn("[part-of-sites] related sections load failed", sectionIdHint, error);
          return null;
        }
      },
      { concurrency: SECTION_RELATION_FILE_CONCURRENCY }
    );

    const partToSectionMap = new Map();
    mappingEntries.filter(Boolean).forEach((entry) => {
      const sectionId = normalizeSectionIdText(entry.sectionId);
      if (!sectionId) return;
      entry.relatedPartIds.forEach((partId) => {
        const normalizedPartId = normalizePartIdText(partId);
        if (!normalizedPartId) return;
        const key = normalizedPartId.toLowerCase();
        if (!partToSectionMap.has(key)) {
          partToSectionMap.set(key, new Set());
        }
        partToSectionMap.get(key).add(sectionId);
      });
    });

    return new Map(
      Array.from(partToSectionMap.entries()).map(([partKey, sectionIdSet]) => [
        partKey,
        Array.from(sectionIdSet).sort(compareNatural),
      ])
    );
  } catch (error) {
    console.warn("[part-of-sites] related sections map build failed", error);
    return new Map();
  }
};

const loadPartOfSites = async ({ forceRefresh = false } = {}) => {
  loading.value = true;
  loadError.value = "";
  try {
    const [rootIndex, partToSectionMap] = await Promise.all([
      fetchJsonOrThrow(PART_OF_SITES_GEOJSON_INDEX_URL, "Part of Sites index", {
        forceRefresh,
      }),
      buildPartToSectionMap({ forceRefresh }),
    ]);
    const groups = Array.isArray(rootIndex?.groups) ? rootIndex.groups : [];
    const rootGeneratedAt = String(rootIndex?.generatedAt || "").trim();
    const groupedRows = await mapWithConcurrency(
      groups,
      async (groupMeta, groupIndex) => {
        const normalizedGroupMeta = groupMeta || {};
        const rootGroupLabel =
          String(normalizedGroupMeta.id || "").trim() || `PART ${groupIndex + 1}`;
        const groupIndexUrl = String(normalizedGroupMeta.index || "").trim();
        if (!groupIndexUrl) return [];

        const groupIndexData = await fetchJsonOrThrow(
          groupIndexUrl,
          `Part of Sites group index (${rootGroupLabel})`,
          { forceRefresh }
        );
        const items = Array.isArray(groupIndexData?.items) ? groupIndexData.items : [];
        const generatedAt = String(groupIndexData?.generatedAt || rootGeneratedAt).trim();

        return mapWithConcurrency(
          items,
          async (item) => {
            const partId = String(item?.id || "").trim();
            if (!partId) return null;
            const featureCount = Number(item?.featureCount);
            const geometryTypes = Array.isArray(item?.geometryTypes) ? item.geometryTypes : [];
            const fileUrl = String(item?.file || "").trim();
            let baseAccessDate = "";
            let baseArea = null;
            let relatedSectionIds = [];

            if (fileUrl) {
              try {
                const featureCollection = await fetchJsonOrThrow(
                  fileUrl,
                  `Part of Sites GeoJSON (${partId})`,
                  { forceRefresh }
                );
                baseAccessDate = pickAccessDateFromFeatureCollection(featureCollection);
                baseArea = normalizeAreaNumber(featureCollectionAreaSqm(featureCollection));
                relatedSectionIds = pickSectionIdsFromPartFeatureCollection(featureCollection);
              } catch (error) {
                console.warn("[part-of-sites] feature file load failed", partId, error);
              }
            }

            const contractPackage = resolveContractPackageValue([
              item?.contractPackage,
              item?.contract_package,
              item?.phase,
              item?.package,
              item?.sourceDxf,
              rootGroupLabel,
            ]);
            const groupLabel = resolvePartGroupLabel(partId, rootGroupLabel) || rootGroupLabel;
            const partKey = normalizePartIdText(partId).toLowerCase();
            const mappedSectionIds = Array.isArray(partToSectionMap.get(partKey))
              ? partToSectionMap.get(partKey)
              : [];
            const mergedSectionIds = Array.from(
              new Set([
                ...relatedSectionIds.map((sectionId) => normalizeSectionIdText(sectionId)),
                ...mappedSectionIds.map((sectionId) => normalizeSectionIdText(sectionId)),
              ])
            )
              .filter(Boolean)
              .sort(compareNatural);
            return applyPartOverridesToRow({
              key: `${groupLabel}:${partId}`,
              partId,
              groupLabel,
              contractPackage,
              systemId: buildPartOfSitesSystemId(groupLabel, partId),
              featureCount:
                Number.isFinite(featureCount) && featureCount >= 0 ? featureCount : 0,
              geometryTypes,
              sourceDxf: String(item?.sourceDxf || "").trim(),
              generatedAt,
              baseAccessDate,
              baseArea,
              relatedSectionIds: mergedSectionIds,
              sectionCount: mergedSectionIds.length,
            });
          },
          { concurrency: PART_OF_SITES_FILE_CONCURRENCY }
        );
      },
      { concurrency: PART_OF_SITES_INDEX_CONCURRENCY }
    );
    const collected = groupedRows.flat().filter(Boolean);

    rows.value = collected.sort(
      (left, right) =>
        compareNatural(left.groupLabel, right.groupLabel) ||
        compareNatural(left.partId, right.partId)
    );
    selectedRows.value = [];
  } catch (error) {
    rows.value = [];
    selectedRows.value = [];
    loadError.value = error?.message || "Failed to load part of sites index.";
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
const relatedSectionNames = (row) =>
  (Array.isArray(row?.relatedSectionIds) ? row.relatedSectionIds : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
const relatedSectionText = (row) => {
  const names = relatedSectionNames(row);
  if (names.length > 0) return names.join(", ");
  const fallbackCount = Number(row?.sectionCount);
  return Number.isFinite(fallbackCount) && fallbackCount > 0
    ? `${fallbackCount} related sections`
    : "—";
};
const relatedSectionSummary = (row) => {
  const names = relatedSectionNames(row);
  if (!names.length) return "—";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
};

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    if (groupFilter.value !== "All" && row.groupLabel !== groupFilter.value) return false;
    const rowContract = resolveContractPackageValue(row.contractPackage);
    if (contractFilter.value !== "ALL" && rowContract !== contractFilter.value) return false;
    return fuzzyMatchAny(
      [
        row.partId,
        row.groupLabel,
        row.systemId,
        row.accessDate,
        row.area,
        row.contractPackage,
        relatedSectionText(row),
      ],
      searchQuery.value
    );
  })
);
const rowsForExport = computed(() =>
  selectedRows.value.length > 0 ? selectedRows.value : filteredRows.value
);
const hasSelectedRows = computed(() => selectedRows.value.length > 0);

const partCountText = (count) => (count === 1 ? "1 part of site" : `${count} part of sites`);

const buildPartExportRecord = (row = {}) => ({
  partId: String(row.partId || "").trim(),
  contractPackage: resolveContractPackageValue(row.contractPackage),
  groupLabel: String(row.groupLabel || "").trim(),
  systemId: String(row.systemId || "").trim(),
  accessDate: normalizeDateText(row.accessDate),
  area: normalizeAreaNumber(row.area),
  updatedAt: String(row.updatedAt || "").trim(),
  updatedBy: String(row.updatedBy || "").trim(),
});

const handleSelectionChange = (rowsSelection) => {
  selectedRows.value = Array.isArray(rowsSelection) ? rowsSelection : [];
};

const exportSelectedJson = () => {
  const targets = rowsForExport.value;
  if (!targets.length) {
    ElMessage.warning("No part of sites to export.");
    return;
  }
  const selectedMode = hasSelectedRows.value;
  downloadJson(
    {
      schema: "llms.part-of-sites.list.json.v1",
      exportedAt: nowIso(),
      count: targets.length,
      partOfSites: targets.map((row) => buildPartExportRecord(row)),
    },
    selectedMode ? "part-of-sites-selected.json" : "part-of-sites.json"
  );
  ElMessage.success(
    `Exported ${partCountText(targets.length)} (${selectedMode ? "selected" : "all listed"}) to JSON.`
  );
};

const exportReport = async (format = "excel") => {
  const targets = rowsForExport.value;
  if (!targets.length) {
    ElMessage.warning("No part of sites to export.");
    return;
  }
  const selectedFormat = String(format || "excel");
  try {
    await exportPartOfSitesReport({
      partOfSites: targets,
      format: selectedFormat,
    });
    ElMessage.success(
      `Exported ${partCountText(targets.length)} (${hasSelectedRows.value ? "selected" : "all listed"}) report as ${selectedFormat.toUpperCase()}.`
    );
  } catch (error) {
    ElMessage.error(`Report export failed: ${error?.message || "unknown error."}`);
  }
};

const handleExportReportCommand = (format) => {
  exportReport(format);
};

const viewOnMap = (partOfSiteId) => {
  router.push({ path: "/map", query: { partOfSiteId } });
};

const openEditDialog = (row) => {
  editForm.value = createPartOfSiteEditForm(row);
  editingContractPackage.value = resolveContractPackageValue(row.contractPackage);
  editingOriginalContractPackage.value = editingContractPackage.value;
  showEditDialog.value = true;
};

const saveEditPartOfSite = () => {
  const partId = String(editForm.value.partId || "").trim();
  if (!partId) return;
  const payload = buildPartOfSiteUpdatePayload(editForm.value, {
    updatedAt: nowIso(),
    updatedBy: authStore.roleName,
  });
  partOfSitesStore.setAttributeOverride(partId, {
    partId,
    contractPackage: editingContractPackage.value,
    ...payload,
  }, editingContractPackage.value);
  const originalContractPackage = editingOriginalContractPackage.value;
  rows.value = rows.value.map((row) =>
    String(row.partId || "").trim().toLowerCase() === partId.toLowerCase() &&
    resolveContractPackageValue(row.contractPackage) === originalContractPackage
      ? applyPartOverridesToRow({
          ...row,
          contractPackage: editingContractPackage.value,
          baseAccessDate: row.baseAccessDate || row.accessDate || "",
          baseArea: row.baseArea ?? row.area ?? null,
        })
      : row
  );
  showEditDialog.value = false;
  editingContractPackage.value = CONTRACT_PACKAGE.C2;
  editingOriginalContractPackage.value = CONTRACT_PACKAGE.C2;
  ElMessage.success("Part of Site updated.");
};

const cancelEditPartOfSite = () => {
  showEditDialog.value = false;
  editingContractPackage.value = CONTRACT_PACKAGE.C2;
  editingOriginalContractPackage.value = CONTRACT_PACKAGE.C2;
};

watch(
  () => partOfSitesStore.attributeOverrides,
  () => {
    rows.value = rows.value.map((row) => applyPartOverridesToRow(row));
  },
  { deep: true }
);

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

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.related-sections-trigger {
  border: 0;
  background: transparent;
  color: #334155;
  font: inherit;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.related-count-pill {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  border: 1px solid rgba(15, 118, 110, 0.22);
  background: #e6f4f1;
  color: #0f766e;
  font-size: 11px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
}

.related-sections-popover {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.popover-title {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
}

.popover-list {
  margin: 0;
  padding-left: 16px;
  max-height: 180px;
  overflow-y: auto;
  font-size: 12px;
  color: #334155;
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
