import { computed } from "vue";
import { todayHongKong } from "../../shared/utils/time";
import {
  WORK_LOT_CATEGORY,
  WORK_LOT_STATUS,
  workLotCategoryLabel,
} from "../../shared/utils/worklot";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

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

const isWorkLotOverdue = (lot) => {
  if (!lot?.dueDate) return false;
  if (lot.status === WORK_LOT_STATUS.EGA_APPROVED) return false;
  return lot.dueDate < todayHongKong();
};

export function useDashboardMetrics({ workLots, timeRange }) {
  const filteredWorkLots = computed(() =>
    filterByRange(workLots.value, "updatedAt", timeRange.value)
  );

  const kpis = computed(() => {
    const total = filteredWorkLots.value.length;
    const approved = filteredWorkLots.value.filter(
      (lot) => lot.status === WORK_LOT_STATUS.EGA_APPROVED
    ).length;
    return {
      workLots: total,
      overdueWorkLots: filteredWorkLots.value.filter(isWorkLotOverdue).length,
      approvedRate: total ? Math.round((approved / total) * 100) : 0,
    };
  });

  const workLotCategorySplit = computed(() => ({
    business: filteredWorkLots.value.filter(
      (lot) => lot.category === WORK_LOT_CATEGORY.BU
    ).length,
    domestic: filteredWorkLots.value.filter(
      (lot) => lot.category === WORK_LOT_CATEGORY.DOMESTIC
    ).length,
  }));

  const workLotStatusSplit = computed(() => ({
    approved: filteredWorkLots.value.filter(
      (lot) => lot.status === WORK_LOT_STATUS.EGA_APPROVED
    ).length,
    waiting: filteredWorkLots.value.filter(
      (lot) => lot.status === WORK_LOT_STATUS.WAITING_CLEARANCE
    ).length,
    overdue: filteredWorkLots.value.filter(isWorkLotOverdue).length,
  }));

  const monthlyTrend = computed(() =>
    buildMonthlySeries(filteredWorkLots.value, "updatedAt", timeRange.value)
  );

  const recentWorkLots = computed(() =>
    [...filteredWorkLots.value]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 6)
      .map((lot) => ({
        ...lot,
        categoryLabel: workLotCategoryLabel(lot.category),
      }))
  );

  return {
    kpis,
    workLotCategorySplit,
    workLotStatusSplit,
    monthlyTrend,
    recentWorkLots,
    isWorkLotOverdue,
  };
}
