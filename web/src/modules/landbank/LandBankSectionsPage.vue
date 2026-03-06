<template>
  <section class="page">
    <div class="header">
      <div class="header-copy">
        <h2>Sections</h2>
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
      :empty-text="loading ? 'Loading…' : 'No sections'"
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="46" fixed="left" />
      <el-table-column prop="sectionId" label="Section ID" width="120" fixed="left" />
      <el-table-column prop="systemId" label="System ID" min-width="220" />
      <el-table-column prop="contractPackage" label="Contract" width="110" />
      <el-table-column label="Completion Date" width="140">
        <template #default="{ row }">
          <TimeText :value="row.completionDate" mode="date" />
        </template>
      </el-table-column>
      <el-table-column label="Area" min-width="170">
        <template #default="{ row }">
          {{ formatArea(row.area) }}
        </template>
      </el-table-column>
      <el-table-column label="Related Parts" min-width="220">
        <template #default="{ row }">
          <span v-if="relatedPartNames(row).length === 0">
            {{ row.partCount > 0 ? `${row.partCount} related parts` : "—" }}
          </span>
          <el-popover v-else trigger="hover" placement="top-start" :width="320">
            <template #reference>
              <button type="button" class="related-parts-trigger">
                <span>{{ relatedPartSummary(row) }}</span>
                <span class="related-count-pill">{{ relatedPartNames(row).length }}</span>
              </button>
            </template>
            <div class="related-parts-popover">
              <div class="popover-title">
                {{ relatedPartNames(row).length }} related parts
              </div>
              <ul class="popover-list">
                <li v-for="partId in relatedPartNames(row)" :key="partId">{{ partId }}</li>
              </ul>
            </div>
          </el-popover>
        </template>
      </el-table-column>
      <el-table-column label="Actions" width="170" align="right" fixed="right">
        <template #default="{ row }">
          <div class="row-actions">
            <el-button link type="primary" @click="viewOnMap(row.sectionId)">View</el-button>
            <el-button link type="primary" @click="openEditDialog(row)">Edit</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <SectionDialog
      v-model="showEditDialog"
      title="Edit Section"
      confirm-text="Save"
      :system-id="editForm.id"
      :section-id="editForm.sectionId"
      v-model:contractPackage="editingContractPackage"
      v-model:completionDate="editForm.completionDate"
      v-model:area="editForm.area"
      @confirm="saveEditSection"
      @cancel="cancelEditSection"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowDown } from "@element-plus/icons-vue";
import SectionDialog from "../map/components/SectionDialog.vue";
import TimeText from "../../components/TimeText.vue";
import { useAuthStore } from "../../stores/useAuthStore";
import { useSectionsStore } from "../../stores/useSectionsStore";
import { fuzzyMatchAny } from "../../shared/utils/search";
import { SECTIONS_GEOJSON_INDEX_URL } from "../../shared/config/mapApi";
import { nowIso } from "../../shared/utils/time";
import {
  createSectionEditForm,
  buildSectionUpdatePayload,
} from "../../shared/utils/sectionEdit";
import { featureCollectionAreaSqm } from "../../shared/utils/geojsonArea";
import {
  REPORT_FORMAT_OPTIONS,
  exportSectionsReport,
} from "../../shared/utils/reportExport";
import {
  CONTRACT_PACKAGE,
  CONTRACT_PACKAGE_VALUES,
  resolveContractPackage,
  toContractPhaseScopedId,
} from "../../shared/utils/contractPackage";
import { downloadJson } from "../../shared/utils/jsonDownload";

const router = useRouter();
const authStore = useAuthStore();
const sectionsStore = useSectionsStore();

const loading = ref(false);
const loadError = ref("");
const rows = ref([]);
const searchQuery = ref("");
const contractFilter = ref("ALL");
const showEditDialog = ref(false);
const selectedRows = ref([]);
const editForm = ref(createSectionEditForm());
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

const buildSectionSystemId = (groupLabel, sectionId) =>
  `SOW-${normalizeToken(groupLabel, "SEC")}-${normalizeToken(sectionId, "UNK")}-001`;

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
const resolveContractPackageValue = (values = []) =>
  resolveContractPackage(values, { fallback: CONTRACT_PACKAGE.C2 });
const contractOptions = [
  { label: "All Contracts", value: "ALL" },
  ...CONTRACT_PACKAGE_VALUES.map((value) => ({ label: value, value })),
];
const resolveSectionAttributeOverride = (sectionId, contractPackage = "") => {
  const normalizedSectionId = String(sectionId || "").trim();
  if (!normalizedSectionId) return null;
  const normalizedPackage = resolveContractPackageValue(contractPackage);
  if (typeof sectionsStore.attributeBySectionId === "function") {
    return sectionsStore.attributeBySectionId(normalizedSectionId, normalizedPackage);
  }
  return (
    sectionsStore.attributeOverrides?.[
      toContractPhaseScopedId(normalizedPackage, normalizedSectionId).toLowerCase()
    ] || sectionsStore.attributeOverrides?.[normalizedSectionId.toLowerCase()] || null
  );
};
const applySectionOverridesToRow = (row = {}) => {
  const contractPackage = resolveContractPackageValue([
    row.contractPackage,
    row.groupLabel,
    row.sourceDxf,
    row.description,
  ]);
  const override = resolveSectionAttributeOverride(row.sectionId, contractPackage);
  const completionDate =
    normalizeDateText(override?.completionDate) || normalizeDateText(row.baseCompletionDate);
  const area = normalizeAreaNumber(override?.area) ?? normalizeAreaNumber(row.baseArea);
  return {
    ...row,
    contractPackage,
    completionDate,
    area,
    updatedAt: String(override?.updatedAt || ""),
    updatedBy: String(override?.updatedBy || ""),
  };
};
const pickCompletionDateFromFeatureCollection = (payload = {}) => {
  const features = Array.isArray(payload?.features) ? payload.features : [];
  for (const feature of features) {
    const properties = feature?.properties || {};
    const value = normalizeDateText(properties.completionDate || properties.completion_date);
    if (value) return value;
  }
  return "";
};
const normalizeRelatedPartIds = (value) => {
  const sourceValues = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[;,|]/)
      : [];
  return sourceValues
    .map((item) => String(item || "").trim())
    .filter(Boolean);
};
const pickRelatedPartIdsFromFeatureCollection = (payload = {}) => {
  const features = Array.isArray(payload?.features) ? payload.features : [];
  const partIdSet = new Set();

  for (const feature of features) {
    const properties = feature?.properties || {};
    const candidates = [
      properties.relatedPartIds,
      properties.related_part_ids,
      properties.relatedParts,
      properties.related_parts,
      properties.partIds,
      properties.part_ids,
    ];

    candidates.forEach((candidate) => {
      normalizeRelatedPartIds(candidate).forEach((partId) => partIdSet.add(partId));
    });
  }

  return Array.from(partIdSet).sort(compareNatural);
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

      for (let itemIndex = 0; itemIndex < items.length; itemIndex += 1) {
        const item = items[itemIndex] || {};
        const sectionId = String(item?.id || "").trim();
        if (!sectionId) continue;
        const featureCount = Number(item?.featureCount);
        const partCount = Number(item?.partCount);
        const geometryTypes = Array.isArray(item?.geometryTypes) ? item.geometryTypes : [];
        const fileUrl = String(item?.file || "").trim();
        let baseCompletionDate = "";
        let baseArea = null;
        let relatedPartIds = [];

        if (fileUrl) {
          try {
            const featureCollection = await fetchJsonOrThrow(
              fileUrl,
              `Section GeoJSON (${sectionId})`
            );
            baseCompletionDate = pickCompletionDateFromFeatureCollection(featureCollection);
            baseArea = normalizeAreaNumber(featureCollectionAreaSqm(featureCollection));
            relatedPartIds = pickRelatedPartIdsFromFeatureCollection(featureCollection);
          } catch (error) {
            console.warn("[sections] feature file load failed", sectionId, error);
          }
        }

        const normalizedPartCount =
          relatedPartIds.length > 0
            ? relatedPartIds.length
            : Number.isFinite(partCount) && partCount >= 0
              ? partCount
              : 0;

        collected.push(
          applySectionOverridesToRow({
            key: `${groupLabel}:${sectionId}`,
            sectionId,
            groupLabel,
            contractPackage: resolveContractPackageValue([
              item?.contractPackage,
              item?.contract_package,
              item?.phase,
              item?.package,
              item?.sourceDxf,
              item?.description,
              groupLabel,
            ]),
            systemId: buildSectionSystemId(groupLabel, sectionId),
            featureCount:
              Number.isFinite(featureCount) && featureCount >= 0 ? featureCount : 0,
            partCount: normalizedPartCount,
            relatedPartIds,
            geometryTypes,
            sourceDxf: String(item?.sourceDxf || "").trim(),
            generatedAt,
            baseCompletionDate,
            baseArea,
          })
        );
      }
    }

    rows.value = collected.sort(
      (left, right) =>
        compareNatural(left.groupLabel, right.groupLabel) ||
        compareNatural(left.sectionId, right.sectionId)
    );
    selectedRows.value = [];
  } catch (error) {
    rows.value = [];
    selectedRows.value = [];
    loadError.value = error?.message || "Failed to load sections index.";
  } finally {
    loading.value = false;
  }
};

const relatedPartNames = (row) =>
  (Array.isArray(row?.relatedPartIds) ? row.relatedPartIds : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);
const relatedPartText = (row) => {
  const names = relatedPartNames(row);
  if (names.length > 0) return names.join(", ");
  const fallbackCount = Number(row?.partCount);
  return Number.isFinite(fallbackCount) && fallbackCount > 0
    ? `${fallbackCount} related parts`
    : "—";
};
const relatedPartSummary = (row) => {
  const names = relatedPartNames(row);
  if (!names.length) return "—";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
};

const filteredRows = computed(() =>
  rows.value.filter((row) => {
    const rowContract = resolveContractPackageValue(row.contractPackage);
    if (contractFilter.value !== "ALL" && rowContract !== contractFilter.value) return false;
    return fuzzyMatchAny(
      [
        row.sectionId,
        row.systemId,
        row.completionDate,
        row.area,
        row.contractPackage,
        row.partCount,
        relatedPartText(row),
      ],
      searchQuery.value
    );
  })
);
const rowsForExport = computed(() =>
  selectedRows.value.length > 0 ? selectedRows.value : filteredRows.value
);
const hasSelectedRows = computed(() => selectedRows.value.length > 0);

const sectionCountText = (count) => (count === 1 ? "1 section" : `${count} sections`);

const buildSectionExportRecord = (row = {}) => ({
  sectionId: String(row.sectionId || "").trim(),
  contractPackage: resolveContractPackageValue(row.contractPackage),
  groupLabel: String(row.groupLabel || "").trim(),
  systemId: String(row.systemId || "").trim(),
  completionDate: normalizeDateText(row.completionDate),
  area: normalizeAreaNumber(row.area),
  relatedPartIds: relatedPartNames(row),
  partCount: Number.isFinite(Number(row.partCount)) ? Number(row.partCount) : 0,
  updatedAt: String(row.updatedAt || "").trim(),
  updatedBy: String(row.updatedBy || "").trim(),
});

const handleSelectionChange = (rowsSelection) => {
  selectedRows.value = Array.isArray(rowsSelection) ? rowsSelection : [];
};

const exportSelectedJson = () => {
  const targets = rowsForExport.value;
  if (!targets.length) {
    ElMessage.warning("No sections to export.");
    return;
  }
  const selectedMode = hasSelectedRows.value;
  downloadJson(
    {
      schema: "llms.sections.list.json.v1",
      exportedAt: nowIso(),
      count: targets.length,
      sections: targets.map((row) => buildSectionExportRecord(row)),
    },
    selectedMode ? "sections-selected.json" : "sections.json"
  );
  ElMessage.success(
    `Exported ${sectionCountText(targets.length)} (${selectedMode ? "selected" : "all listed"}) to JSON.`
  );
};

const exportReport = async (format = "excel") => {
  const targets = rowsForExport.value;
  if (!targets.length) {
    ElMessage.warning("No sections to export.");
    return;
  }
  const selectedFormat = String(format || "excel");
  try {
    await exportSectionsReport({
      sections: targets,
      format: selectedFormat,
    });
    ElMessage.success(
      `Exported ${sectionCountText(targets.length)} (${hasSelectedRows.value ? "selected" : "all listed"}) report as ${selectedFormat.toUpperCase()}.`
    );
  } catch (error) {
    ElMessage.error(`Report export failed: ${error?.message || "unknown error."}`);
  }
};

const handleExportReportCommand = (format) => {
  exportReport(format);
};

const viewOnMap = (sectionId) => {
  router.push({ path: "/map", query: { sectionId } });
};

const openEditDialog = (row) => {
  editForm.value = createSectionEditForm(row);
  editingContractPackage.value = resolveContractPackageValue(row.contractPackage);
  editingOriginalContractPackage.value = editingContractPackage.value;
  showEditDialog.value = true;
};

const saveEditSection = () => {
  const sectionId = String(editForm.value.sectionId || "").trim();
  if (!sectionId) return;
  const payload = buildSectionUpdatePayload(editForm.value, {
    updatedAt: nowIso(),
    updatedBy: authStore.roleName,
  });
  sectionsStore.setAttributeOverride(sectionId, {
    sectionId,
    contractPackage: editingContractPackage.value,
    ...payload,
  }, editingContractPackage.value);
  const originalContractPackage = editingOriginalContractPackage.value;
  rows.value = rows.value.map((row) =>
    String(row.sectionId || "").trim().toLowerCase() === sectionId.toLowerCase() &&
    resolveContractPackageValue(row.contractPackage) === originalContractPackage
      ? applySectionOverridesToRow({
          ...row,
          contractPackage: editingContractPackage.value,
          baseCompletionDate: row.baseCompletionDate || row.completionDate || "",
          baseArea: row.baseArea ?? row.area ?? null,
        })
      : row
  );
  showEditDialog.value = false;
  editingContractPackage.value = CONTRACT_PACKAGE.C2;
  editingOriginalContractPackage.value = CONTRACT_PACKAGE.C2;
  ElMessage.success("Section updated.");
};

const cancelEditSection = () => {
  showEditDialog.value = false;
  editingContractPackage.value = CONTRACT_PACKAGE.C2;
  editingOriginalContractPackage.value = CONTRACT_PACKAGE.C2;
};

watch(
  () => sectionsStore.attributeOverrides,
  () => {
    rows.value = rows.value.map((row) => applySectionOverridesToRow(row));
  },
  { deep: true }
);

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

.row-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.related-parts-trigger {
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

.related-parts-popover {
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
