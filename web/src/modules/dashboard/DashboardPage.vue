<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Analytics Dashboard</h2>
        <p class="muted">
          KPI denominator uses Site Boundaries and planned handover schedule.
        </p>
      </div>
      <div class="filters">
        <el-input-number
          v-model="floatThresholdMonths"
          size="small"
          :min="0"
          :max="24"
          :step="1"
          controls-position="right"
          style="width: 180px"
        />
        <el-button size="small" :type="timeRange === '12M' ? 'primary' : 'default'" @click="timeRange = '12M'">
          12 Months
        </el-button>
        <el-button size="small" :type="timeRange === 'YTD' ? 'primary' : 'default'" @click="timeRange = 'YTD'">
          YTD
        </el-button>
        <el-button size="small" :type="timeRange === 'ALL' ? 'primary' : 'default'" @click="timeRange = 'ALL'">
          All Time
        </el-button>
      </div>
    </div>

    <div class="kpis">
      <div class="kpi-card">
        <div class="kpi-label">Site Boundaries</div>
        <div class="kpi-value">{{ kpis.landCount }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">% Land Handover</div>
        <div class="kpi-value">{{ kpis.handoverRate }}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">% Land Need Force Eviction</div>
        <div class="kpi-value warn">{{ kpis.forceEvictionRate }}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">% Land with Float &lt; {{ kpis.floatThresholdMonths }} Months</div>
        <div class="kpi-value">{{ kpis.lowFloatRate }}%</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Overdue Site Boundaries</div>
        <div class="kpi-value warn">{{ kpis.overdueLandCount }}</div>
      </div>
    </div>

    <div class="cards">
      <div class="card">
        <h3>Work Lot Categories</h3>
        <div class="chart-wrap">
          <canvas ref="donutRef"></canvas>
        </div>
      </div>
      <div class="card">
        <h3>Site Boundaries by Management Status</h3>
        <div class="chart-wrap">
          <canvas ref="siteBarRef"></canvas>
        </div>
      </div>
      <div class="card">
        <h3>Work Lots by Operational Status</h3>
        <div class="chart-wrap">
          <canvas ref="barRef"></canvas>
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
            <el-tag effect="plain" :style="statusStyle(row.status)">
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
  Tooltip,
  Legend
);

const timeRange = ref("12M");
const floatThresholdMonths = ref(3);
const donutRef = ref(null);
const siteBarRef = ref(null);
const barRef = ref(null);
let donutChart;
let siteBarChart;
let barChart;

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
const statusStyle = (status) => workStatusStyle(status);
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
        cutout: "70%",
        maintainAspectRatio: false,
        layout: { padding: 8 },
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              boxWidth: 10,
              boxHeight: 10,
              color: "#64748b",
              font: { family: "IBM Plex Sans", size: 11 },
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
        labels: [
          "Pending Clearance",
          "In Progress",
          "Critical / Risk",
          "Handover Ready",
          "Handed Over",
        ],
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
              maxRotation: 22,
              minRotation: 22,
            },
          },
          y: { display: false },
        },
      },
    });
  }

  if (barRef.value) {
    barChart = new Chart(barRef.value, {
      type: "bar",
      data: {
        labels: [
          "Waiting for Assessment",
          "EGA Approved",
          "Waiting for Clearance",
          "Completed",
        ],
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
          y: { display: false },
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
};

onMounted(() => {
  siteBoundaryStore.ensureLoaded();
  buildCharts();
  updateCharts();
});

watch(
  [timeRange, workLotCategorySplit, workLotStatusSplit, siteBoundaryStatusSplit],
  updateCharts
);

onBeforeUnmount(() => {
  donutChart?.destroy();
  siteBarChart?.destroy();
  barChart?.destroy();
});
</script>

<style scoped>
.page {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filters {
  display: flex;
  gap: 8px;
}

.kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.kpi-card {
  background: white;
  border-radius: 14px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

.kpi-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.kpi-value {
  font-size: 24px;
  font-weight: 700;
  margin-top: 6px;
}

.kpi-value.warn {
  color: #b91c1c;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  min-height: 160px;
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.05);
}

.chart-wrap {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-card {
  background: white;
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 12px;
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
</style>
