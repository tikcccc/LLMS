<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Analytics Dashboard</h2>
        <p class="muted">Land utilization snapshot and recent work lot activity.</p>
      </div>
      <div class="filters">
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
        <div class="kpi-label">Active Work Lots</div>
        <div class="kpi-value">{{ kpis.workLots }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Overdue Work Lots</div>
        <div class="kpi-value warn">{{ kpis.overdueWorkLots }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">EGA Approved Rate</div>
        <div class="kpi-value">{{ kpis.approvedRate }}%</div>
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
        <h3>Lot Acquisition Trend</h3>
        <div class="chart-wrap">
          <canvas ref="lineRef"></canvas>
        </div>
      </div>
      <div class="card">
        <h3>Work Lots by Status</h3>
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
        <el-table-column prop="id" label="ID" width="130" />
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
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useDashboardMetrics } from "./useDashboardMetrics";
import { useRouter } from "vue-router";
import TimeText from "../../components/TimeText.vue";
import { workStatusStyle } from "../map/utils/statusStyle";

Chart.register(
  DoughnutController,
  ArcElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  BarController,
  BarElement,
  Tooltip,
  Legend
);

const timeRange = ref("12M");
const donutRef = ref(null);
const lineRef = ref(null);
const barRef = ref(null);
let donutChart;
let lineChart;
let barChart;

const workLotStore = useWorkLotStore();
const router = useRouter();

const { kpis, workLotCategorySplit, workLotStatusSplit, monthlyTrend, recentWorkLots } =
  useDashboardMetrics({
    workLots: computed(() => workLotStore.workLots),
    timeRange,
  });

const recentRows = computed(() => recentWorkLots.value);
const statusStyle = (status) => workStatusStyle(status);
const goWorkLots = () => router.push("/landbank/work-lots");

const buildCharts = () => {
  if (donutRef.value) {
    donutChart = new Chart(donutRef.value, {
      type: "doughnut",
      data: {
        labels: ["BU Business Undertaking", "Domestic"],
        datasets: [
          {
            data: [0, 0],
            backgroundColor: ["#3b82f6", "#22c55e"],
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

  if (lineRef.value) {
    lineChart = new Chart(lineRef.value, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Lots",
            data: [],
            borderColor: "#ef4444",
            tension: 0.35,
            fill: false,
            pointRadius: 3,
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
            grid: { color: "#eef2f7" },
            ticks: { color: "#94a3b8", font: { family: "IBM Plex Sans", size: 10 } },
          },
        },
      },
    });
  }

  if (barRef.value) {
    barChart = new Chart(barRef.value, {
      type: "bar",
      data: {
        labels: ["EGA approved", "Waiting for clearance", "Overdue"],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: ["#22c55e", "#facc15", "#f97316"],
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
  const businessCount = workLotCategorySplit.value.business;
  const domesticCount = workLotCategorySplit.value.domestic;
  if (donutChart) {
    donutChart.data.datasets[0].data = [businessCount, domesticCount];
    donutChart.update();
  }

  const approvedCount = workLotStatusSplit.value.approved;
  const waitingCount = workLotStatusSplit.value.waiting;
  const overdueCount = workLotStatusSplit.value.overdue;
  if (barChart) {
    barChart.data.datasets[0].data = [approvedCount, waitingCount, overdueCount];
    barChart.update();
  }

  if (lineChart) {
    lineChart.data.labels = monthlyTrend.value.labels;
    lineChart.data.datasets[0].data = monthlyTrend.value.data;
    lineChart.update();
  }
};

onMounted(() => {
  buildCharts();
  updateCharts();
});

watch([timeRange, workLotCategorySplit, workLotStatusSplit, monthlyTrend], updateCharts);

onBeforeUnmount(() => {
  donutChart?.destroy();
  lineChart?.destroy();
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
