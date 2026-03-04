import { defineStore } from "pinia";
import { todayHongKong } from "../shared/utils/time";
import { WORK_LOT_STATUS } from "../shared/utils/worklot";
import { useWorkLotStore } from "./useWorkLotStore";
import { useSiteBoundaryStore } from "./useSiteBoundaryStore";
import { usePartOfSitesStore } from "./usePartOfSitesStore";
import { useSectionsStore } from "./useSectionsStore";

const NOTIFICATION_SCHEMA_VERSION = 1;
const ALERT_LOOKAHEAD_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const YYYY_MM_DD_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const TYPE_ALERT = "alert";
const TYPE_TASK = "task";
const TYPE_SYSTEM = "system";

const SEVERITY_CRITICAL = "critical";
const SEVERITY_WARNING = "warning";
const SEVERITY_INFO = "info";

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeDateText = (value) => {
  const normalized = normalizeText(value);
  if (!YYYY_MM_DD_PATTERN.test(normalized)) return "";
  return normalized;
};

const normalizeIdList = (value) => {
  if (!Array.isArray(value)) return [];
  const dedupe = new Set();
  value.forEach((item) => {
    const normalized = normalizeText(item);
    if (!normalized) return;
    dedupe.add(normalized);
  });
  return Array.from(dedupe);
};

const dateToUtcMs = (value) => {
  const normalized = normalizeDateText(value);
  if (!normalized) return null;
  const parts = normalized.split("-").map((part) => Number(part));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const [year, month, day] = parts;
  return Date.UTC(year, month - 1, day);
};

const diffDaysFromToday = (targetDate, todayDate) => {
  const targetMs = dateToUtcMs(targetDate);
  const todayMs = dateToUtcMs(todayDate);
  if (!Number.isFinite(targetMs) || !Number.isFinite(todayMs)) return null;
  return Math.floor((targetMs - todayMs) / DAY_MS);
};

const isCompletedWorkLot = (workLot = {}) =>
  workLot?.status === WORK_LOT_STATUS.CLEARED_COMPLETED || !!normalizeDateText(workLot?.completionDate);

const isCompletedBoundary = (boundary = {}) => !!normalizeDateText(boundary?.completionDate);

const severityRank = (severity) => {
  if (severity === SEVERITY_CRITICAL) return 0;
  if (severity === SEVERITY_WARNING) return 1;
  return 2;
};

const sortNotifications = (left, right) => {
  const severityDelta = severityRank(left.severity) - severityRank(right.severity);
  if (severityDelta !== 0) return severityDelta;

  const dayDeltaLeft = Number.isFinite(left.dayDelta) ? left.dayDelta : 999999;
  const dayDeltaRight = Number.isFinite(right.dayDelta) ? right.dayDelta : 999999;
  if (dayDeltaLeft !== dayDeltaRight) return dayDeltaLeft - dayDeltaRight;

  return String(left.title || "").localeCompare(String(right.title || ""), undefined, {
    numeric: true,
    sensitivity: "base",
  });
};

const buildWorkLotAlertNotifications = (workLots = [], today = "") => {
  const notifications = [];
  workLots.forEach((lot) => {
    const workLotId = normalizeText(lot?.id);
    const dueDate = normalizeDateText(lot?.dueDate);
    if (!workLotId || !dueDate || isCompletedWorkLot(lot)) return;

    const dayDelta = diffDaysFromToday(dueDate, today);
    if (!Number.isFinite(dayDelta) || dayDelta > ALERT_LOOKAHEAD_DAYS) return;

    const overdue = dayDelta < 0;
    notifications.push({
      id: `alert-work-lot-${workLotId.toLowerCase()}`,
      type: TYPE_ALERT,
      severity: overdue ? SEVERITY_CRITICAL : SEVERITY_WARNING,
      title: overdue
        ? `Work Lot ${workLotId} is overdue`
        : `Work Lot ${workLotId} due in ${dayDelta} day(s)`,
      message: `Due date: ${dueDate}`,
      entityType: "work-lot",
      entityLabel: "Work Lot",
      entityId: workLotId,
      happenedOn: dueDate,
      dayDelta,
      primaryAction: {
        label: "View on Map",
        path: "/map",
        query: { workLotId },
      },
      secondaryAction: {
        label: "Open List",
        path: "/landbank/work-lots",
      },
    });
  });
  return notifications;
};

const buildBoundaryAlertNotifications = (boundaries = [], today = "") => {
  const notifications = [];
  boundaries.forEach((boundary) => {
    const boundaryId = normalizeText(boundary?.id);
    const plannedHandoverDate = normalizeDateText(boundary?.plannedHandoverDate);
    if (!boundaryId || !plannedHandoverDate || isCompletedBoundary(boundary)) return;

    const dayDelta = diffDaysFromToday(plannedHandoverDate, today);
    if (!Number.isFinite(dayDelta) || dayDelta > ALERT_LOOKAHEAD_DAYS) return;

    const overdue = dayDelta < 0;
    notifications.push({
      id: `alert-site-boundary-${boundaryId.toLowerCase()}`,
      type: TYPE_ALERT,
      severity: overdue ? SEVERITY_CRITICAL : SEVERITY_WARNING,
      title: overdue
        ? `Site Boundary ${boundaryId} is overdue`
        : `Site Boundary ${boundaryId} due in ${dayDelta} day(s)`,
      message: `Planned handover date: ${plannedHandoverDate}`,
      entityType: "site-boundary",
      entityLabel: "Site Boundary",
      entityId: boundaryId,
      happenedOn: plannedHandoverDate,
      dayDelta,
      primaryAction: {
        label: "View on Map",
        path: "/map",
        query: { siteBoundaryId: boundaryId },
      },
      secondaryAction: {
        label: "Open List",
        path: "/landbank/site-boundaries",
      },
    });
  });
  return notifications;
};

const buildPartAlertNotifications = (attributeOverrides = {}, today = "") => {
  const notifications = [];
  Object.values(attributeOverrides || {}).forEach((record) => {
    const partId = normalizeText(record?.partId);
    const accessDate = normalizeDateText(record?.accessDate);
    if (!partId || !accessDate) return;

    const dayDelta = diffDaysFromToday(accessDate, today);
    if (!Number.isFinite(dayDelta) || dayDelta > ALERT_LOOKAHEAD_DAYS) return;

    const overdue = dayDelta < 0;
    notifications.push({
      id: `alert-part-of-site-${partId.toLowerCase()}`,
      type: TYPE_ALERT,
      severity: overdue ? SEVERITY_CRITICAL : SEVERITY_WARNING,
      title: overdue
        ? `Part of Site ${partId} access date expired`
        : `Part of Site ${partId} access date in ${dayDelta} day(s)`,
      message: `Access date: ${accessDate}`,
      entityType: "part-of-site",
      entityLabel: "Part of Site",
      entityId: partId,
      happenedOn: accessDate,
      dayDelta,
      primaryAction: {
        label: "View on Map",
        path: "/map",
        query: { partOfSiteId: partId },
      },
      secondaryAction: {
        label: "Open List",
        path: "/landbank/part-of-sites",
      },
    });
  });
  return notifications;
};

const buildSectionAlertNotifications = (attributeOverrides = {}, today = "") => {
  const notifications = [];
  Object.values(attributeOverrides || {}).forEach((record) => {
    const sectionId = normalizeText(record?.sectionId);
    const completionDate = normalizeDateText(record?.completionDate);
    if (!sectionId || !completionDate) return;

    const dayDelta = diffDaysFromToday(completionDate, today);
    if (!Number.isFinite(dayDelta) || dayDelta > ALERT_LOOKAHEAD_DAYS) return;

    const overdue = dayDelta < 0;
    notifications.push({
      id: `alert-section-${sectionId.toLowerCase()}`,
      type: TYPE_ALERT,
      severity: overdue ? SEVERITY_CRITICAL : SEVERITY_WARNING,
      title: overdue
        ? `Section ${sectionId} completion date expired`
        : `Section ${sectionId} completion date in ${dayDelta} day(s)`,
      message: `Completion date: ${completionDate}`,
      entityType: "section",
      entityLabel: "Section",
      entityId: sectionId,
      happenedOn: completionDate,
      dayDelta,
      primaryAction: {
        label: "View on Map",
        path: "/map",
        query: { sectionId },
      },
      secondaryAction: {
        label: "Open List",
        path: "/landbank/sections",
      },
    });
  });
  return notifications;
};

const buildTaskNotifications = () => [
  {
    id: "task-review-overdue-items",
    type: TYPE_TASK,
    severity: SEVERITY_WARNING,
    title: "Review overdue items",
    message: "Use Map View to inspect overdue lots and boundaries.",
    entityType: "task",
    entityLabel: "Task",
    entityId: "OVERDUE_REVIEW",
    happenedOn: todayHongKong(),
    dayDelta: 0,
    primaryAction: {
      label: "Open Map",
      path: "/map",
    },
  },
];

const buildSystemNotifications = () => [
  {
    id: "system-notification-center-enabled",
    type: TYPE_SYSTEM,
    severity: SEVERITY_INFO,
    title: "Notification Center enabled",
    message: "You can now track alerts from the topbar bell.",
    entityType: "system",
    entityLabel: "System",
    entityId: "NOTIFICATION_CENTER",
    happenedOn: todayHongKong(),
    dayDelta: 0,
    primaryAction: {
      label: "Open Dashboard",
      path: "/dashboard",
    },
  },
];

export const useNotificationStore = defineStore("notifications", {
  state: () => ({
    schemaVersion: NOTIFICATION_SCHEMA_VERSION,
    notifications: [],
    readIds: [],
  }),
  getters: {
    isRead: (state) => (id) => {
      const normalizedId = normalizeText(id);
      if (!normalizedId) return false;
      return state.readIds.includes(normalizedId);
    },
    unreadCount: (state) =>
      state.notifications.reduce(
        (count, item) => (state.readIds.includes(item.id) ? count : count + 1),
        0
      ),
    unreadCountByType: (state) => (type) =>
      state.notifications.reduce((count, item) => {
        if (normalizeText(type) && item.type !== type) return count;
        return state.readIds.includes(item.id) ? count : count + 1;
      }, 0),
    notificationsByTab: (state) => (tab = "all") => {
      const normalizedTab = normalizeText(tab).toLowerCase();
      if (!normalizedTab || normalizedTab === "all") return state.notifications;
      return state.notifications.filter((item) => item.type === normalizedTab);
    },
  },
  actions: {
    normalizeLegacyNotifications() {
      if (Number(this.schemaVersion) !== NOTIFICATION_SCHEMA_VERSION) {
        this.schemaVersion = NOTIFICATION_SCHEMA_VERSION;
        this.notifications = [];
        this.readIds = [];
        return;
      }
      this.readIds = normalizeIdList(this.readIds);
      this.notifications = (Array.isArray(this.notifications) ? this.notifications : [])
        .filter((item) => !!normalizeText(item?.id))
        .map((item) => ({
          ...item,
          id: normalizeText(item.id),
          type: normalizeText(item.type).toLowerCase(),
          severity: normalizeText(item.severity).toLowerCase() || SEVERITY_INFO,
        }));
    },
    async refreshNotifications() {
      const today = todayHongKong();
      const workLotStore = useWorkLotStore();
      const siteBoundaryStore = useSiteBoundaryStore();
      const partOfSitesStore = usePartOfSitesStore();
      const sectionsStore = useSectionsStore();

      if (!siteBoundaryStore.loaded && !siteBoundaryStore.loading) {
        await siteBoundaryStore.ensureLoaded();
      }

      const next = [
        ...buildWorkLotAlertNotifications(workLotStore.workLots, today),
        ...buildBoundaryAlertNotifications(siteBoundaryStore.siteBoundaries, today),
        ...buildPartAlertNotifications(partOfSitesStore.attributeOverrides, today),
        ...buildSectionAlertNotifications(sectionsStore.attributeOverrides, today),
        ...buildTaskNotifications(),
        ...buildSystemNotifications(),
      ].sort(sortNotifications);

      this.notifications = next;
      const validIds = new Set(next.map((item) => item.id));
      this.readIds = this.readIds.filter((id) => validIds.has(id));
      return next;
    },
    markRead(id) {
      const normalizedId = normalizeText(id);
      if (!normalizedId || this.readIds.includes(normalizedId)) return;
      this.readIds = [...this.readIds, normalizedId];
    },
    markUnread(id) {
      const normalizedId = normalizeText(id);
      if (!normalizedId) return;
      this.readIds = this.readIds.filter((item) => item !== normalizedId);
    },
    markAllRead() {
      this.readIds = this.notifications.map((item) => item.id);
    },
  },
  persist: {
    key: "ND_LLM_V1_notifications",
  },
});
