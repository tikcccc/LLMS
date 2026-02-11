<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Analytics Dashboard</h2>
        <p class="muted">
          KPI scope follows Date Range using Work Lot updated date.
        </p>
      </div>
      <div class="filters">
        <div class="filter-item">
          <span class="filter-label">Float &lt; X Months</span>
          <el-input-number
            v-model="floatThresholdMonths"
            size="small"
            :min="0"
            :max="24"
            :step="1"
            controls-position="right"
            style="width: 132px"
          />
        </div>
        <div class="filter-item">
          <span class="filter-label">Date Range</span>
          <el-radio-group v-model="timeRange" size="small">
            <el-radio-button label="12M">12 Months</el-radio-button>
            <el-radio-button label="YTD">YTD</el-radio-button>
            <el-radio-button label="ALL">All Time</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi-card kpi-card--coverage">
        <div class="kpi-head">
          <div class="kpi-label">KPI Scope Coverage</div>
          <div class="kpi-chip">{{ rangeLabel }}</div>
        </div>
        <div class="kpi-value">{{ kpis.boundariesWithWorkLots }}/{{ kpis.landCount }}</div>
        <div class="kpi-progress">
          <span :style="{ width: `${kpis.coverageRate}%` }"></span>
        </div>
        <div class="kpi-pill-row">
          <div class="kpi-pill">Coverage {{ kpis.coverageRate }}%</div>
          <div class="kpi-pill">Work Lots {{ kpis.workLotCount }}</div>
          <div class="kpi-pill">Area {{ formatHectare(kpis.totalAreaSqm) }} ha</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-head">
          <div class="kpi-label">% Land Handover</div>
          <div :class="['kpi-trend', `kpi-trend--${trendTone(kpis.handover.momBoundaryDelta, true)}`]">
            {{ formatMomDelta(kpis.handover.momBoundaryDelta) }} MoM
          </div>
        </div>
        <div class="kpi-value">{{ kpis.handover.boundaryRate }}%</div>
        <div class="kpi-breakdown">
          <div class="kpi-breakdown-item">
            <span>Boundary</span>
            <strong>{{ kpis.handover.boundaryCount }}/{{ kpis.handover.boundaryDenominator }}</strong>
          </div>
          <div class="kpi-breakdown-item">
            <span>Work Lot</span>
            <strong>{{ kpis.handover.workLotRate }}% ({{ kpis.handover.workLotCount }}/{{ kpis.handover.workLotDenominator }})</strong>
          </div>
          <div class="kpi-breakdown-item">
            <span>Area</span>
            <strong>{{ formatHectare(kpis.handover.areaSqm) }} ha / {{ formatHectare(kpis.handover.areaDenominatorSqm) }} ha</strong>
          </div>
        </div>
      </div>
      <div class="kpi-card kpi-card--risk">
        <div class="kpi-head">
          <div class="kpi-label">% Land Need Force Eviction</div>
          <div :class="['kpi-trend', `kpi-trend--${trendTone(kpis.forceEviction.momBoundaryDelta, false)}`]">
            {{ formatMomDelta(kpis.forceEviction.momBoundaryDelta) }} MoM
          </div>
        </div>
        <div class="kpi-value warn">{{ kpis.forceEviction.boundaryRate }}%</div>
        <div class="kpi-breakdown">
          <div class="kpi-breakdown-item">
            <span>Boundary</span>
            <strong>{{ kpis.forceEviction.boundaryCount }}/{{ kpis.forceEviction.boundaryDenominator }}</strong>
          </div>
          <div class="kpi-breakdown-item">
            <span>Work Lot</span>
            <strong>{{ kpis.forceEviction.workLotRate }}% ({{ kpis.forceEviction.workLotCount }}/{{ kpis.forceEviction.workLotDenominator }})</strong>
          </div>
          <div class="kpi-breakdown-item">
            <span>Area</span>
            <strong>{{ formatHectare(kpis.forceEviction.areaSqm) }} ha / {{ formatHectare(kpis.forceEviction.areaDenominatorSqm) }} ha</strong>
          </div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-head">
          <div class="kpi-label">% Land with Float &lt; {{ kpis.floatThresholdMonths }} Months</div>
          <div :class="['kpi-trend', `kpi-trend--${trendTone(kpis.lowFloat.momBoundaryDelta, false)}`]">
            {{ formatMomDelta(kpis.lowFloat.momBoundaryDelta) }} MoM
          </div>
        </div>
        <div class="kpi-value">{{ kpis.lowFloat.boundaryRate }}%</div>
        <div class="kpi-breakdown">
          <div class="kpi-breakdown-item">
            <span>Boundary</span>
            <strong>{{ kpis.lowFloat.boundaryCount }}/{{ kpis.lowFloat.boundaryDenominator }}</strong>
          </div>
          <div class="kpi-breakdown-item">
            <span>Work Lot</span>
            <strong>{{ kpis.lowFloat.workLotRate }}% ({{ kpis.lowFloat.workLotCount }}/{{ kpis.lowFloat.workLotDenominator }})</strong>
          </div>
          <div class="kpi-breakdown-item">
            <span>Area</span>
            <strong>{{ formatHectare(kpis.lowFloat.areaSqm) }} ha / {{ formatHectare(kpis.lowFloat.areaDenominatorSqm) }} ha</strong>
          </div>
        </div>
      </div>
      <div class="kpi-card kpi-card--risk">
        <div class="kpi-head">
          <div class="kpi-label">Overdue Site Boundaries</div>
          <div :class="['kpi-trend', `kpi-trend--${trendTone(kpis.overdue.momBoundaryDelta, false)}`]">
            {{ formatMomDelta(kpis.overdue.momBoundaryDelta) }} MoM
          </div>
        </div>
        <div class="kpi-value warn">{{ kpis.overdue.count }}</div>
        <div class="kpi-breakdown">
          <div class="kpi-breakdown-item">
            <span>Overdue Rate</span>
            <strong>{{ kpis.overdue.rate }}% ({{ kpis.overdue.count }}/{{ kpis.overdue.denominator }})</strong>
          </div>
          <div class="kpi-breakdown-item">
            <span>Aging 0-30</span>
            <strong>{{ kpis.overdue.agingBuckets.d0to30 }}</strong>
          </div>
          <div class="kpi-breakdown-item">
            <span>Aging 31-60 / 60+</span>
            <strong>{{ kpis.overdue.agingBuckets.d31to60 }} / {{ kpis.overdue.agingBuckets.d61Plus }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="cards">
      <div class="card">
        <div class="card-head">
          <h3>Work Lot Categories</h3>
          <p>{{ rangeLabel }}</p>
        </div>
        <div class="chart-wrap">
          <canvas ref="donutRef"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <h3>Site Boundaries by Management Status</h3>
          <p>Boundaries with scoped Work Lots</p>
        </div>
        <div class="chart-wrap">
          <canvas ref="siteBarRef"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <h3>Work Lots by Operational Status</h3>
          <p>{{ rangeLabel }}</p>
        </div>
        <div class="chart-wrap">
          <canvas ref="barRef"></canvas>
        </div>
      </div>
      <div class="card">
        <div class="card-head">
          <h3>KPI Trend (12 Months)</h3>
          <p>{{ trendRangeLabel }}</p>
        </div>
        <div class="chart-wrap">
          <canvas ref="kpiTrendRef"></canvas>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Recent Work Lots</h3>
        <el-button link type="primary" @click="goWorkLots">View All</el-button>
      </div>
      <el-table :data="recentRows" height="360px">
        <el-table-column prop="id" label="System ID" width="130" />
        <el-table-column label="Related Lands" min-width="220">
          <template #default="{ row }">
            {{ relatedLandText(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorName" label="Work Lot" min-width="180" />
        <el-table-column prop="categoryLabel" label="Category" min-width="190" />
        <el-table-column prop="responsiblePerson" label="Responsible Person" min-width="160" />
        <el-table-column label="Status" width="180">
          <template #default="{ row }">
            <el-tag effect="plain" :style="statusStyle(row.status, row.dueDate)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Due Date" width="130">
          <template #default="{ row }">
            <TimeText :value="row.dueDate" mode="date" />
          </template>
        </el-table-column>
      </el-table>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  Chart,
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useSiteBoundaryStore } from "../../stores/useSiteBoundaryStore";
import { useDashboardMetrics } from "./useDashboardMetrics";
import { useRouter } from "vue-router";
import TimeText from "../../components/TimeText.vue";
import { workStatusStyle } from "../map/utils/statusStyle";

Chart.register(
  DoughnutController,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const timeRange = ref("12M");
const floatThresholdMonths = ref(3);
const donutRef = ref(null);
const siteBarRef = ref(null);
const barRef = ref(null);
const kpiTrendRef = ref(null);
let donutChart;
let siteBarChart;
let barChart;
let kpiTrendChart;

const workLotStore = useWorkLotStore();
const siteBoundaryStore = useSiteBoundaryStore();
const router = useRouter();

const { kpis, workLotCategorySplit, workLotStatusSplit, siteBoundaryStatusSplit, recentWorkLots } =
  useDashboardMetrics({
    workLots: computed(() => workLotStore.workLots),
    siteBoundaries: computed(() => siteBoundaryStore.siteBoundaries),
    timeRange,
    floatThresholdMonths,
  });

const recentRows = computed(() => recentWorkLots.value);
const statusStyle = (status, dueDate) => workStatusStyle(status, dueDate);
const rangeLabel = computed(
  () =>
    ({
      "12M": "Last 12 Months",
      YTD: "YTD",
      ALL: "All Time",
    }[timeRange.value] || timeRange.value)
);
const trendRangeLabel = computed(() => {
  const labels = Array.isArray(kpis.value?.trend?.labels) ? kpis.value.trend.labels : [];
  if (!labels.length) return "Monthly";
  return `${labels[0]} - ${labels[labels.length - 1]}`;
});
const siteBoundaryNameById = computed(() =>
  siteBoundaryStore.siteBoundaries.reduce((map, boundary) => {
    map.set(String(boundary.id).toLowerCase(), boundary.name || "");
    return map;
  }, new Map())
);
const relatedLandText = (lot) => {
  const related = Array.isArray(lot?.relatedSiteBoundaryIds) ? lot.relatedSiteBoundaryIds : [];
  if (!related.length) return "—";
  return related
    .map((id) => {
      const normalized = String(id).toLowerCase();
      return siteBoundaryNameById.value.get(normalized) || String(id);
    })
    .join(", ");
};
const goWorkLots = () => router.push("/landbank/work-lots");
const formatMomDelta = (value) => {
  const delta = Number(value) || 0;
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(1)} pt`;
};
const formatHectare = (valueSqm) =>
  ((Number(valueSqm) || 0) / 10000).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
const trendTone = (deltaValue, higherIsBetter = true) => {
  const delta = Number(deltaValue) || 0;
  if (delta === 0) return "neutral";
  const improving = higherIsBetter ? delta > 0 : delta < 0;
  return improving ? "good" : "bad";
};

const buildCharts = () => {
  if (donutRef.value) {
    donutChart = new Chart(donutRef.value, {
      type: "doughnut",
      data: {
        labels: ["Business Undertaking (BU)", "Household (HH)", "Government Land (GL)"],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: ["#3b82f6", "#22c55e", "#0ea5a3"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        cutout: "64%",
        maintainAspectRatio: false,
        layout: { padding: 8 },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 9,
              boxHeight: 9,
              padding: 12,
              color: "#64748b",
              font: { family: "IBM Plex Sans", size: 10 },
            },
          },
        },
      },
    });
  }

  if (siteBarRef.value) {
    siteBarChart = new Chart(siteBarRef.value, {
      type: "bar",
      data: {
        labels: ["Pending", "In Progress", "Critical", "Ready", "Handed Over"],
        datasets: [
          {
            data: [0, 0, 0, 0, 0],
            backgroundColor: ["#94a3b8", "#3b82f6", "#ef4444", "#f59e0b", "#22c55e"],
            borderRadius: 10,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#94a3b8",
              font: { family: "IBM Plex Sans", size: 10 },
              maxRotation: 14,
              minRotation: 14,
            },
          },
          y: {
            beginAtZero: true,
            grace: "8%",
            ticks: {
              stepSize: 1,
              color: "#94a3b8",
              font: { family: "IBM Plex Sans", size: 10 },
            },
            grid: { color: "rgba(148, 163, 184, 0.18)" },
          },
        },
      },
    });
  }

  if (barRef.value) {
    barChart = new Chart(barRef.value, {
      type: "bar",
      data: {
        labels: ["Assessment", "EGA", "Clearance", "Completed"],
        datasets: [
          {
            data: [0, 0, 0, 0],
            backgroundColor: ["#94a3b8", "#3b82f6", "#facc15", "#22c55e"],
            borderRadius: 10,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#94a3b8", font: { family: "IBM Plex Sans", size: 10 } },
          },
          y: {
            beginAtZero: true,
            grace: "8%",
            ticks: {
              stepSize: 1,
              color: "#94a3b8",
              font: { family: "IBM Plex Sans", size: 10 },
            },
            grid: { color: "rgba(148, 163, 184, 0.18)" },
          },
        },
      },
    });
  }

  if (kpiTrendRef.value) {
    kpiTrendChart = new Chart(kpiTrendRef.value, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Handover %",
            data: [],
            borderColor: "#16a34a",
            backgroundColor: "rgba(22, 163, 74, 0.12)",
            tension: 0.32,
            borderWidth: 2,
            pointRadius: 1.5,
          },
          {
            label: "Force Eviction %",
            data: [],
            borderColor: "#dc2626",
            backgroundColor: "rgba(220, 38, 38, 0.12)",
            tension: 0.32,
            borderWidth: 2,
            pointRadius: 1.5,
          },
          {
            label: `Low Float < ${floatThresholdMonths.value}M`,
            data: [],
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.12)",
            tension: 0.32,
            borderWidth: 2,
            pointRadius: 1.5,
          },
          {
            label: "Overdue %",
            data: [],
            borderColor: "#b45309",
            backgroundColor: "rgba(180, 83, 9, 0.12)",
            tension: 0.32,
            borderWidth: 2,
            pointRadius: 1.5,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              padding: 12,
              color: "#64748b",
              font: { family: "IBM Plex Sans", size: 10 },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: "#94a3b8", font: { family: "IBM Plex Sans", size: 10 } },
          },
          y: {
            beginAtZero: true,
            suggestedMax: 100,
            ticks: {
              color: "#94a3b8",
              callback: (value) => `${value}%`,
              font: { family: "IBM Plex Sans", size: 10 },
            },
            grid: { color: "rgba(148, 163, 184, 0.18)" },
          },
        },
      },
    });
  }
};

const updateCharts = () => {
  const buCount = workLotCategorySplit.value.bu;
  const hhCount = workLotCategorySplit.value.hh;
  const glCount = workLotCategorySplit.value.gl;
  if (donutChart) {
    donutChart.data.datasets[0].data = [buCount, hhCount, glCount];
    donutChart.update();
  }

  const waitingAssessmentCount = workLotStatusSplit.value.waitingAssessment;
  const egaApprovedCount = workLotStatusSplit.value.egaApproved;
  const waitingClearanceCount = workLotStatusSplit.value.waitingClearance;
  const clearedCompletedCount = workLotStatusSplit.value.clearedCompleted;
  if (barChart) {
    barChart.data.datasets[0].data = [
      waitingAssessmentCount,
      egaApprovedCount,
      waitingClearanceCount,
      clearedCompletedCount,
    ];
    barChart.update();
  }

  const pendingClearanceCount = siteBoundaryStatusSplit.value.pendingClearance;
  const inProgressCount = siteBoundaryStatusSplit.value.inProgress;
  const criticalRiskCount = siteBoundaryStatusSplit.value.criticalRisk;
  const handoverReadyCount = siteBoundaryStatusSplit.value.handoverReady;
  const handedOverCount = siteBoundaryStatusSplit.value.handedOver;
  if (siteBarChart) {
    siteBarChart.data.datasets[0].data = [
      pendingClearanceCount,
      inProgressCount,
      criticalRiskCount,
      handoverReadyCount,
      handedOverCount,
    ];
    siteBarChart.update();
  }

  if (kpiTrendChart) {
    kpiTrendChart.data.labels = kpis.value.trend.labels;
    kpiTrendChart.data.datasets[0].data = kpis.value.trend.handoverBoundaryRates;
    kpiTrendChart.data.datasets[1].data = kpis.value.trend.forceEvictionBoundaryRates;
    kpiTrendChart.data.datasets[2].data = kpis.value.trend.lowFloatBoundaryRates;
    kpiTrendChart.data.datasets[2].label = `Low Float < ${kpis.value.floatThresholdMonths}M`;
    kpiTrendChart.data.datasets[3].data = kpis.value.trend.overdueBoundaryRates;
    kpiTrendChart.update();
  }
};

onMounted(() => {
  siteBoundaryStore.ensureLoaded();
  buildCharts();
  updateCharts();
});

watch([timeRange, floatThresholdMonths, kpis, workLotCategorySplit, workLotStatusSplit, siteBoundaryStatusSplit], updateCharts);

onBeforeUnmount(() => {
  donutChart?.destroy();
  siteBarChart?.destroy();
  barChart?.destroy();
  kpiTrendChart?.destroy();
});
</script>

<style scoped>
.page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: #f8fafc;
}

.muted {
  margin: 8px 0 0;
}

.filter-label {
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  white-space: nowrap;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.kpi-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.kpi-card--coverage {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
}

.kpi-card--risk {
  border-color: rgba(239, 68, 68, 0.24);
}

.kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.kpi-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.kpi-value {
  font-size: 30px;
  font-weight: 700;
  margin-top: 8px;
  color: #0f172a;
}

.kpi-value.warn {
  color: #b91c1c;
}

.kpi-chip {
  border: 1px solid rgba(59, 130, 246, 0.28);
  background: rgba(59, 130, 246, 0.08);
  color: #1e3a8a;
  border-radius: 999px;
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.kpi-progress {
  margin-top: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.22);
  overflow: hidden;
}

.kpi-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #2563eb 0%, #0ea5e9 100%);
}

.kpi-pill-row {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.kpi-pill {
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(255, 255, 255, 0.76);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  color: #334155;
  font-weight: 600;
}

.kpi-breakdown {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.kpi-breakdown-item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 9px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

.kpi-breakdown-item span {
  color: #475569;
  font-size: 12px;
}

.kpi-breakdown-item strong {
  color: #0f172a;
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.kpi-trend {
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 4px 8px;
  white-space: nowrap;
}

.kpi-trend--neutral {
  color: #475569;
  background: rgba(148, 163, 184, 0.12);
  border-color: rgba(148, 163, 184, 0.25);
}

.kpi-trend--good {
  color: #166534;
  background: rgba(22, 163, 74, 0.12);
  border-color: rgba(22, 163, 74, 0.3);
}

.kpi-trend--bad {
  color: #991b1b;
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.3);
}

.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 14px 14px 12px;
  border: 1px solid var(--border);
  min-height: 280px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  padding: 4px 2px 8px;
}

.card-head h3 {
  margin: 0;
}

.card-head p {
  margin: 2px 0 0;
  color: #64748b;
  font-size: 12px;
  text-align: right;
}

.chart-wrap {
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 14px 12px 12px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 4px 10px;
}

.table-header h3 {
  margin: 0;
}

@media (max-width: 1180px) {
  .kpis,
  .cards {
    grid-template-columns: 1fr;
  }

  .kpi-card--coverage {
    grid-column: auto;
  }
}

@media (max-width: 980px) {
  .filters {
    width: 100%;
    justify-content: flex-start;
  }

  .chart-wrap {
    height: 220px;
  }
}
</style>
