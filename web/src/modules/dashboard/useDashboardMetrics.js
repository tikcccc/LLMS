import { computed } from "vue";
import { todayHongKong } from "../../shared/utils/time";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const toMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

const getRangeStart = (range) => {
  const now = new Date();
  if (range === "ALL") return null;
  if (range === "YTD") {
    return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  }
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - 12);
  return d;
};

const filterByRange = (items, dateField, range) => {
  const start = getRangeStart(range);
  if (!start) return items;
  return items.filter((item) => {
    const value = item?.[dateField];
    if (!value) return false;
    return new Date(value) >= start;
  });
};

const buildMonthlySeries = (items, dateField, range) => {
  const start = getRangeStart(range);
  if (!start) {
    const byMonth = new Map();
    items.forEach((item) => {
      const key = toMonthKey(item[dateField]);
      byMonth.set(key, (byMonth.get(key) || 0) + 1);
    });
    const keys = Array.from(byMonth.keys()).sort();
    return {
      labels: keys.map((key) => {
        const [year, month] = key.split("-").map(Number);
        return `${MONTH_LABELS[month - 1]} ${String(year).slice(2)}`;
      }),
      data: keys.map((key) => byMonth.get(key) || 0),
    };
  }

  const labels = [];
  const data = [];
  const startMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  const now = new Date();
  const endMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  let cursor = new Date(startMonth);
  while (cursor <= endMonth) {
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    labels.push(`${MONTH_LABELS[cursor.getUTCMonth()]} ${String(cursor.getUTCFullYear()).slice(2)}`);
    const count = items.filter((item) => toMonthKey(item[dateField]) === key).length;
    data.push(count);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return { labels, data };
};

const isOverdue = (task) => {
  if (!task?.dueDate) return false;
  if (task.status === "Done") return false;
  const today = todayHongKong();
  return task.dueDate < today;
};

export function useDashboardMetrics({ landLots, workLots, tasks, timeRange }) {
  const filteredLandLots = computed(() => filterByRange(landLots.value, "updatedAt", timeRange.value));
  const filteredWorkLots = computed(() => filterByRange(workLots.value, "updatedAt", timeRange.value));
  const filteredTasks = computed(() => filterByRange(tasks.value, "createdAt", timeRange.value));

  const kpis = computed(() => ({
    landLots: filteredLandLots.value.length,
    workLots: filteredWorkLots.value.length,
    overdueTasks: filteredTasks.value.filter(isOverdue).length,
    completionRate: filteredTasks.value.length
      ? Math.round(
          (filteredTasks.value.filter((task) => task.status === "Done").length /
            filteredTasks.value.length) *
            100
        )
      : 0,
  }));

  const workLotTypeSplit = computed(() => ({
    business: filteredWorkLots.value.filter((lot) => lot.type === "Business").length,
    household: filteredWorkLots.value.filter((lot) => lot.type === "Household").length,
  }));

  const taskStatusSplit = computed(() => ({
    done: filteredTasks.value.filter((task) => task.status === "Done").length,
    open: filteredTasks.value.filter((task) => task.status === "Open").length,
    overdue: filteredTasks.value.filter(isOverdue).length,
  }));

  const monthlyTrend = computed(() =>
    buildMonthlySeries(
      [...filteredLandLots.value, ...filteredWorkLots.value],
      "updatedAt",
      timeRange.value
    )
  );

  const recentTasks = computed(() =>
    [...filteredTasks.value]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 6)
  );

  return {
    kpis,
    workLotTypeSplit,
    taskStatusSplit,
    monthlyTrend,
    recentTasks,
    isOverdue,
  };
}
