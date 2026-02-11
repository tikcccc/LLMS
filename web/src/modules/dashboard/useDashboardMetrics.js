import { computed } from "vue";
import { todayHongKong } from "../../shared/utils/time";
import {
  WORK_LOT_CATEGORY,
  WORK_LOT_STATUS,
  workLotCategoryLabel,
} from "../../shared/utils/worklot";
import {
  buildWorkLotsByBoundary,
  summarizeSiteBoundary,
} from "../../shared/utils/siteBoundary";

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

const isWorkLotOverdue = (lot) => {
  if (!lot?.dueDate) return false;
  if (lot.status === WORK_LOT_STATUS.CLEARED_COMPLETED) return false;
  return lot.dueDate < todayHongKong();
};

export function useDashboardMetrics({
  workLots,
  siteBoundaries,
  timeRange,
  floatThresholdMonths,
}) {
  const filteredWorkLots = computed(() =>
    filterByRange(workLots.value, "updatedAt", timeRange.value)
  );

  const boundarySummaries = computed(() => {
    const byBoundary = buildWorkLotsByBoundary(workLots.value);
    return siteBoundaries.value.map((boundary) => {
      const summary = summarizeSiteBoundary(
        boundary,
        byBoundary.get(String(boundary.id)) || [],
        {
          floatThresholdMonths: Number(floatThresholdMonths.value) || 0,
        }
      );
      return { ...boundary, ...summary };
    });
  });

  const kpis = computed(() => {
    const totalLand = boundarySummaries.value.length;
    const handoverDone = boundarySummaries.value.filter(
      (item) => item.handoverCompleted
    ).length;
    const forceEviction = boundarySummaries.value.filter(
      (item) => item.requiresForceEviction
    ).length;
    const lowFloat = boundarySummaries.value.filter((item) => item.hasLowFloat).length;
    const overdue = boundarySummaries.value.filter((item) => item.overdue).length;
    return {
      landCount: totalLand,
      handoverRate: totalLand ? Math.round((handoverDone / totalLand) * 100) : 0,
      forceEvictionRate: totalLand ? Math.round((forceEviction / totalLand) * 100) : 0,
      lowFloatRate: totalLand ? Math.round((lowFloat / totalLand) * 100) : 0,
      overdueLandCount: overdue,
      floatThresholdMonths: Number(floatThresholdMonths.value) || 0,
    };
  });

  const workLotCategorySplit = computed(() => ({
    bu: filteredWorkLots.value.filter(
      (lot) => lot.category === WORK_LOT_CATEGORY.BU
    ).length,
    hh: filteredWorkLots.value.filter(
      (lot) => lot.category === WORK_LOT_CATEGORY.HH
    ).length,
    gl: filteredWorkLots.value.filter(
      (lot) => lot.category === WORK_LOT_CATEGORY.GL
    ).length,
  }));

  const workLotStatusSplit = computed(() => ({
    waitingAssessment: filteredWorkLots.value.filter(
      (lot) => lot.status === WORK_LOT_STATUS.WAITING_ASSESSMENT
    ).length,
    egaApproved: filteredWorkLots.value.filter(
      (lot) => lot.status === WORK_LOT_STATUS.EGA_APPROVED
    ).length,
    waitingClearance: filteredWorkLots.value.filter(
      (lot) => lot.status === WORK_LOT_STATUS.WAITING_CLEARANCE
    ).length,
    clearedCompleted: filteredWorkLots.value.filter(
      (lot) => lot.status === WORK_LOT_STATUS.CLEARED_COMPLETED
    ).length,
  }));

  const siteBoundaryStatusSplit = computed(() => ({
    pendingClearance: boundarySummaries.value.filter(
      (item) => item.statusKey === "PENDING_CLEARANCE"
    ).length,
    inProgress: boundarySummaries.value.filter(
      (item) => item.statusKey === "IN_PROGRESS"
    ).length,
    criticalRisk: boundarySummaries.value.filter(
      (item) => item.statusKey === "CRITICAL_RISK"
    ).length,
    handoverReady: boundarySummaries.value.filter(
      (item) => item.statusKey === "HANDOVER_READY"
    ).length,
    handedOver: boundarySummaries.value.filter(
      (item) => item.statusKey === "HANDED_OVER"
    ).length,
  }));

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
    boundarySummaries,
    workLotCategorySplit,
    workLotStatusSplit,
    siteBoundaryStatusSplit,
    recentWorkLots,
    isWorkLotOverdue,
  };
}
