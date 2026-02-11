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

const DAY_MS = 24 * 60 * 60 * 1000;
const YYYY_MM_DD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const toPercent = (numerator, denominator) =>
  denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;

const toFiniteNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toValidDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toDateTextUtc = (date) => {
  const value = toValidDate(date);
  if (!value) return "";
  const yyyy = value.getUTCFullYear();
  const mm = String(value.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(value.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const parseYyyyMmDdUtc = (value) => {
  const text = String(value || "").trim();
  if (!YYYY_MM_DD_PATTERN.test(text)) return null;
  const [year, month, day] = text.split("-").map((item) => Number(item));
  return new Date(Date.UTC(year, month - 1, day));
};

const addUtcMonths = (date, offset) => {
  const value = toValidDate(date);
  if (!value) return null;
  const out = new Date(value);
  out.setUTCMonth(out.getUTCMonth() + offset);
  return out;
};

const toMonthKey = (date) => {
  const value = toValidDate(date);
  if (!value) return "";
  const yyyy = value.getUTCFullYear();
  const mm = String(value.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
};

const monthLabel = (date) => {
  const value = toValidDate(date);
  if (!value) return "";
  const short = value.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${short} ${String(value.getUTCFullYear()).slice(-2)}`;
};

const bucketOverdueDays = (days, buckets) => {
  if (days <= 30) {
    buckets.d0to30 += 1;
    return;
  }
  if (days <= 60) {
    buckets.d31to60 += 1;
    return;
  }
  buckets.d61Plus += 1;
};

const overdueDaysBetween = (plannedDate, today) => {
  const planned = parseYyyyMmDdUtc(plannedDate);
  const now = parseYyyyMmDdUtc(today);
  if (!planned || !now) return null;
  return Math.max(0, Math.floor((now.getTime() - planned.getTime()) / DAY_MS));
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

const isWorkLotOverdue = (lot) => {
  if (!lot?.dueDate) return false;
  if (lot.status === WORK_LOT_STATUS.CLEARED_COMPLETED) return false;
  return lot.dueDate < todayHongKong();
};

const isWorkLotHandoverDone = (lot) =>
  lot?.status === WORK_LOT_STATUS.CLEARED_COMPLETED || !!lot?.completionDate;

const isWorkLotLowFloat = (lot, floatThresholdMonths) => {
  const value = Number(lot?.floatMonths);
  return Number.isFinite(value) && value < floatThresholdMonths;
};

const workLotAreaSqm = (lot) => {
  const area = Number(lot?.area);
  return Number.isFinite(area) && area > 0 ? area : 0;
};

const summarizeBoundaries = ({
  siteBoundaries = [],
  scopedWorkLots = [],
  floatThresholdMonths = 3,
  today = todayHongKong(),
}) => {
  const byBoundary = buildWorkLotsByBoundary(scopedWorkLots);
  return siteBoundaries.map((boundary) => {
    const summary = summarizeSiteBoundary(
      boundary,
      byBoundary.get(String(boundary.id)) || [],
      { floatThresholdMonths, today }
    );
    return { ...boundary, ...summary };
  });
};

const buildKpiSnapshot = ({
  boundarySummaries = [],
  scopedWorkLots = [],
  totalBoundaries = 0,
  floatThresholdMonths = 3,
  today = todayHongKong(),
}) => {
  const boundariesWithWorkLots = boundarySummaries.filter((item) => item.totalOperators > 0);
  const boundaryDenominator = boundariesWithWorkLots.length;
  const workLotDenominator = scopedWorkLots.length;

  const handoverBoundaryCount = boundariesWithWorkLots.filter(
    (item) => item.handoverCompleted
  ).length;
  const forceEvictionBoundaryCount = boundariesWithWorkLots.filter(
    (item) => item.requiresForceEviction
  ).length;
  const lowFloatBoundaryCount = boundariesWithWorkLots.filter((item) => item.hasLowFloat).length;

  const overdueTrackableBoundaries = boundariesWithWorkLots.filter((item) =>
    YYYY_MM_DD_PATTERN.test(String(item.plannedHandoverDate || ""))
  );
  const overdueBoundaries = overdueTrackableBoundaries.filter((item) => item.overdue);
  const overdueAgingBuckets = overdueBoundaries.reduce(
    (buckets, item) => {
      const days = overdueDaysBetween(item.plannedHandoverDate, today);
      if (days === null) return buckets;
      bucketOverdueDays(days, buckets);
      return buckets;
    },
    { d0to30: 0, d31to60: 0, d61Plus: 0 }
  );

  const handoverWorkLotCount = scopedWorkLots.filter((lot) => isWorkLotHandoverDone(lot)).length;
  const forceEvictionWorkLotCount = scopedWorkLots.filter((lot) => !!lot?.forceEviction).length;
  const lowFloatWorkLotCount = scopedWorkLots.filter((lot) =>
    isWorkLotLowFloat(lot, floatThresholdMonths)
  ).length;

  const totalAreaSqm = scopedWorkLots.reduce((sum, lot) => sum + workLotAreaSqm(lot), 0);
  const handoverAreaSqm = scopedWorkLots.reduce(
    (sum, lot) => sum + (isWorkLotHandoverDone(lot) ? workLotAreaSqm(lot) : 0),
    0
  );
  const forceEvictionAreaSqm = scopedWorkLots.reduce(
    (sum, lot) => sum + (!!lot?.forceEviction ? workLotAreaSqm(lot) : 0),
    0
  );
  const lowFloatAreaSqm = scopedWorkLots.reduce(
    (sum, lot) =>
      sum + (isWorkLotLowFloat(lot, floatThresholdMonths) ? workLotAreaSqm(lot) : 0),
    0
  );

  return {
    totalBoundaries,
    boundariesWithWorkLots: boundaryDenominator,
    boundaryCoverageRate: toPercent(boundaryDenominator, totalBoundaries),
    workLotDenominator,
    handover: {
      boundaryCount: handoverBoundaryCount,
      boundaryRate: toPercent(handoverBoundaryCount, boundaryDenominator),
      workLotCount: handoverWorkLotCount,
      workLotRate: toPercent(handoverWorkLotCount, workLotDenominator),
      areaSqm: handoverAreaSqm,
      areaRate: toPercent(handoverAreaSqm, totalAreaSqm),
    },
    forceEviction: {
      boundaryCount: forceEvictionBoundaryCount,
      boundaryRate: toPercent(forceEvictionBoundaryCount, boundaryDenominator),
      workLotCount: forceEvictionWorkLotCount,
      workLotRate: toPercent(forceEvictionWorkLotCount, workLotDenominator),
      areaSqm: forceEvictionAreaSqm,
      areaRate: toPercent(forceEvictionAreaSqm, totalAreaSqm),
    },
    lowFloat: {
      boundaryCount: lowFloatBoundaryCount,
      boundaryRate: toPercent(lowFloatBoundaryCount, boundaryDenominator),
      workLotCount: lowFloatWorkLotCount,
      workLotRate: toPercent(lowFloatWorkLotCount, workLotDenominator),
      areaSqm: lowFloatAreaSqm,
      areaRate: toPercent(lowFloatAreaSqm, totalAreaSqm),
    },
    overdue: {
      count: overdueBoundaries.length,
      denominator: overdueTrackableBoundaries.length,
      rate: toPercent(overdueBoundaries.length, overdueTrackableBoundaries.length),
      agingBuckets: overdueAgingBuckets,
    },
    totalAreaSqm,
  };
};

const buildMonthlyTrend = ({
  siteBoundaries = [],
  workLots = [],
  floatThresholdMonths = 3,
}) => {
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const months = [];
  for (let offset = 11; offset >= 0; offset -= 1) {
    const start = addUtcMonths(thisMonthStart, -offset);
    if (!start) continue;
    const next = addUtcMonths(start, 1);
    if (!next) continue;
    const endOfMonth = new Date(next.getTime() - DAY_MS);
    months.push({
      start,
      next,
      label: monthLabel(start),
      today: toDateTextUtc(endOfMonth),
      key: toMonthKey(start),
    });
  }

  const byMonth = workLots.reduce((map, lot) => {
    const updatedAt = toValidDate(lot?.updatedAt);
    if (!updatedAt) return map;
    const key = toMonthKey(updatedAt);
    if (!key) return map;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(lot);
    return map;
  }, new Map());

  const series = {
    labels: [],
    handoverBoundaryRates: [],
    handoverWorkLotRates: [],
    forceEvictionBoundaryRates: [],
    forceEvictionWorkLotRates: [],
    lowFloatBoundaryRates: [],
    lowFloatWorkLotRates: [],
    overdueBoundaryRates: [],
  };

  months.forEach((month) => {
    const scopedLots = byMonth.get(month.key) || [];
    const boundarySummaries = summarizeBoundaries({
      siteBoundaries,
      scopedWorkLots: scopedLots,
      floatThresholdMonths,
      today: month.today,
    });
    const snapshot = buildKpiSnapshot({
      boundarySummaries,
      scopedWorkLots: scopedLots,
      totalBoundaries: siteBoundaries.length,
      floatThresholdMonths,
      today: month.today,
    });
    series.labels.push(month.label);
    series.handoverBoundaryRates.push(snapshot.handover.boundaryRate);
    series.handoverWorkLotRates.push(snapshot.handover.workLotRate);
    series.forceEvictionBoundaryRates.push(snapshot.forceEviction.boundaryRate);
    series.forceEvictionWorkLotRates.push(snapshot.forceEviction.workLotRate);
    series.lowFloatBoundaryRates.push(snapshot.lowFloat.boundaryRate);
    series.lowFloatWorkLotRates.push(snapshot.lowFloat.workLotRate);
    series.overdueBoundaryRates.push(snapshot.overdue.rate);
  });

  return series;
};

const momDelta = (values = []) => {
  if (!Array.isArray(values) || values.length < 2) return 0;
  const current = toFiniteNumber(values[values.length - 1], 0);
  const previous = toFiniteNumber(values[values.length - 2], 0);
  return Math.round((current - previous) * 10) / 10;
};

export function useDashboardMetrics({
  workLots,
  siteBoundaries,
  timeRange,
  floatThresholdMonths,
}) {
  const normalizedFloatThreshold = computed(() => {
    const parsed = Number(floatThresholdMonths.value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  });

  const filteredWorkLots = computed(() =>
    filterByRange(workLots.value, "updatedAt", timeRange.value)
  );

  const boundarySummaries = computed(() => {
    return summarizeBoundaries({
      siteBoundaries: siteBoundaries.value,
      scopedWorkLots: filteredWorkLots.value,
      floatThresholdMonths: normalizedFloatThreshold.value,
    });
  });

  const trend = computed(() =>
    buildMonthlyTrend({
      siteBoundaries: siteBoundaries.value,
      workLots: workLots.value,
      floatThresholdMonths: normalizedFloatThreshold.value,
    })
  );

  const kpis = computed(() => {
    const snapshot = buildKpiSnapshot({
      boundarySummaries: boundarySummaries.value,
      scopedWorkLots: filteredWorkLots.value,
      totalBoundaries: siteBoundaries.value.length,
      floatThresholdMonths: normalizedFloatThreshold.value,
    });

    return {
      landCount: snapshot.totalBoundaries,
      boundariesWithWorkLots: snapshot.boundariesWithWorkLots,
      workLotCount: snapshot.workLotDenominator,
      coverageRate: snapshot.boundaryCoverageRate,
      handoverRate: snapshot.handover.boundaryRate,
      forceEvictionRate: snapshot.forceEviction.boundaryRate,
      lowFloatRate: snapshot.lowFloat.boundaryRate,
      overdueLandCount: snapshot.overdue.count,
      overdueRate: snapshot.overdue.rate,
      floatThresholdMonths: normalizedFloatThreshold.value,
      totalAreaSqm: Math.round(snapshot.totalAreaSqm),
      handover: {
        ...snapshot.handover,
        boundaryDenominator: snapshot.boundariesWithWorkLots,
        workLotDenominator: snapshot.workLotDenominator,
        areaDenominatorSqm: snapshot.totalAreaSqm,
        momBoundaryDelta: momDelta(trend.value.handoverBoundaryRates),
        momWorkLotDelta: momDelta(trend.value.handoverWorkLotRates),
      },
      forceEviction: {
        ...snapshot.forceEviction,
        boundaryDenominator: snapshot.boundariesWithWorkLots,
        workLotDenominator: snapshot.workLotDenominator,
        areaDenominatorSqm: snapshot.totalAreaSqm,
        momBoundaryDelta: momDelta(trend.value.forceEvictionBoundaryRates),
        momWorkLotDelta: momDelta(trend.value.forceEvictionWorkLotRates),
      },
      lowFloat: {
        ...snapshot.lowFloat,
        boundaryDenominator: snapshot.boundariesWithWorkLots,
        workLotDenominator: snapshot.workLotDenominator,
        areaDenominatorSqm: snapshot.totalAreaSqm,
        momBoundaryDelta: momDelta(trend.value.lowFloatBoundaryRates),
        momWorkLotDelta: momDelta(trend.value.lowFloatWorkLotRates),
      },
      overdue: {
        ...snapshot.overdue,
        momBoundaryDelta: momDelta(trend.value.overdueBoundaryRates),
      },
      trend: trend.value,
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

  const siteBoundaryStatusSplit = computed(() => {
    const scopedBoundaries = boundarySummaries.value.filter((item) => item.totalOperators > 0);
    return {
      pendingClearance: scopedBoundaries.filter(
      (item) => item.statusKey === "PENDING_CLEARANCE"
      ).length,
      inProgress: scopedBoundaries.filter(
      (item) => item.statusKey === "IN_PROGRESS"
      ).length,
      criticalRisk: scopedBoundaries.filter(
      (item) => item.statusKey === "CRITICAL_RISK"
      ).length,
      handoverReady: scopedBoundaries.filter(
      (item) => item.statusKey === "HANDOVER_READY"
      ).length,
      handedOver: scopedBoundaries.filter(
      (item) => item.statusKey === "HANDED_OVER"
      ).length,
    };
  });

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
