<template>
  <section class="page">
    <div class="header">
      <div>
        <h2>Analytics Dashboard</h2>
        <p class="muted">Land utilization snapshot and recent activity.</p>
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
        <div class="kpi-label">Total Land Lots</div>
        <div class="kpi-value">{{ kpis.landLots }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Active Work Lots</div>
        <div class="kpi-value">{{ kpis.workLots }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Overdue Tasks</div>
        <div class="kpi-value warn">{{ kpis.overdueTasks }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Completion Rate</div>
        <div class="kpi-value">{{ kpis.completionRate }}%</div>
      </div>
    </div>

    <div class="cards">
      <div class="card">
        <h3>Land Usage Distribution</h3>
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
        <h3>Tasks by Status</h3>
        <div class="chart-wrap">
          <canvas ref="barRef"></canvas>
        </div>
      </div>
    </div>

    <div class="table-card">
      <div class="table-header">
        <h3>Recent Activity</h3>
        <el-button link type="primary" @click="goTasks">View All</el-button>
      </div>
      <el-table :data="recentRows" height="360px">
        <el-table-column prop="workLotId" label="Work Lot" width="140" />
        <el-table-column prop="title" label="Task" min-width="200" />
        <el-table-column prop="assignee" label="Assignee" min-width="160" />
        <el-table-column label="Status" width="140">
          <template #default="{ row }">
            <el-tag effect="plain" :style="statusStyle(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Due Date" width="140">
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
import { useLandLotStore } from "../../stores/useLandLotStore";
import { useWorkLotStore } from "../../stores/useWorkLotStore";
import { useTaskStore } from "../../stores/useTaskStore";
import { useDashboardMetrics } from "./useDashboardMetrics";
import { useRouter } from "vue-router";
import TimeText from "../../components/TimeText.vue";

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

const landLotStore = useLandLotStore();
const workLotStore = useWorkLotStore();
const taskStore = useTaskStore();
const router = useRouter();

const { kpis, workLotTypeSplit, taskStatusSplit, monthlyTrend, recentTasks, isOverdue } =
  useDashboardMetrics({
    landLots: computed(() => landLotStore.landLots),
    workLots: computed(() => workLotStore.workLots),
    tasks: computed(() => taskStore.tasks),
    timeRange,
  });

const recentRows = computed(() => recentTasks.value);

const statusStyle = (status) => {
  if (status === "Done") return { backgroundColor: "rgba(34,197,94,0.18)", borderColor: "rgba(34,197,94,0.5)", color: "#14532d" };
  if (status === "Open") return { backgroundColor: "rgba(59,130,246,0.18)", borderColor: "rgba(59,130,246,0.5)", color: "#1e3a8a" };
  return { backgroundColor: "rgba(239,68,68,0.18)", borderColor: "rgba(239,68,68,0.5)", color: "#7f1d1d" };
};

const goTasks = () => router.push("/tasks-ops");

const buildCharts = () => {
  if (donutRef.value) {
    donutChart = new Chart(donutRef.value, {
      type: "doughnut",
      data: {
        labels: ["Business", "Household"],
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
          x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { family: "IBM Plex Sans", size: 10 } } },
          y: { grid: { color: "#eef2f7" }, ticks: { color: "#94a3b8", font: { family: "IBM Plex Sans", size: 10 } } },
        },
      },
    });
  }

  if (barRef.value) {
    barChart = new Chart(barRef.value, {
      type: "bar",
      data: {
        labels: ["Completed", "In Progress", "Overdue"],
        datasets: [
          {
            data: [0, 0, 0],
            backgroundColor: ["#22c55e", "#3b82f6", "#f97316"],
            borderRadius: 10,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#94a3b8", font: { family: "IBM Plex Sans", size: 10 } } },
          y: { display: false },
        },
      },
    });
  }
};

const updateCharts = () => {
  const businessCount = workLotTypeSplit.value.business;
  const householdCount = workLotTypeSplit.value.household;
  if (donutChart) {
    donutChart.data.datasets[0].data = [businessCount, householdCount];
    donutChart.update();
  }

  const taskCompleted = taskStatusSplit.value.done;
  const taskInProgress = taskStatusSplit.value.open;
  const taskOverdue = taskStatusSplit.value.overdue;
  if (barChart) {
    barChart.data.datasets[0].data = [taskCompleted, taskInProgress, taskOverdue];
    barChart.update();
  }

  if (lineChart) {
    lineChart.data.labels = monthlyTrend.value.labels;
    lineChart.data.datasets[0].data = monthlyTrend.value.data;
    lineChart.update();
  }
};

onMounted(() => {
  landLotStore.seedIfEmpty();
  workLotStore.seedIfEmpty();
  taskStore.seedIfEmpty();
  buildCharts();
  updateCharts();
});

watch([timeRange, workLotTypeSplit, taskStatusSplit, monthlyTrend], updateCharts);

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
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
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
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.chart-wrap {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-wrap canvas {
  width: 100% !important;
  height: 180px !important;
}

.table-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.06);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.muted {
  color: var(--muted);
}
</style>
