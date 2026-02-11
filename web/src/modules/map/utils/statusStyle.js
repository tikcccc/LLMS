import { todayHongKong } from "../../../shared/utils/time";

const isYyyyMmDd = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
let todayHongKongCache = "";
let todayHongKongCacheAt = 0;

const getTodayHongKongCached = () => {
  const now = Date.now();
  if (!todayHongKongCache || now - todayHongKongCacheAt > 60 * 1000) {
    todayHongKongCache = todayHongKong();
    todayHongKongCacheAt = now;
  }
  return todayHongKongCache;
};

const isCompletedStatus = (status) =>
  status === "Completed" || status === "Cleared / Completed";

const isWorkLotOverdue = (status, dueDate) => {
  if (isCompletedStatus(status)) return false;
  if (!isYyyyMmDd(dueDate)) return false;
  return String(dueDate) < getTodayHongKongCached();
};

export const workStatusStyle = (status, dueDate = "") => {
  if (isWorkLotOverdue(status, dueDate)) {
    return {
      backgroundColor: "rgba(248,113,113,0.2)",
      borderColor: "rgba(220,38,38,0.48)",
      color: "#7f1d1d",
    };
  }
  if (status === "Waiting for Assessment") {
    return {
      backgroundColor: "rgba(148,163,184,0.2)",
      borderColor: "rgba(148,163,184,0.5)",
      color: "#334155",
    };
  }
  if (status === "EGA Approved") {
    return {
      backgroundColor: "rgba(250,204,21,0.2)",
      borderColor: "rgba(202,138,4,0.45)",
      color: "#713f12",
    };
  }
  if (status === "Waiting for Clearance") {
    return {
      backgroundColor: "rgba(245,158,11,0.2)",
      borderColor: "rgba(180,83,9,0.45)",
      color: "#713f12",
    };
  }
  if (isCompletedStatus(status)) {
    return {
      backgroundColor: "rgba(34,197,94,0.2)",
      borderColor: "rgba(34,197,94,0.5)",
      color: "#14532d",
    };
  }
  return {
    backgroundColor: "rgba(148,163,184,0.2)",
    borderColor: "rgba(148,163,184,0.5)",
    color: "#334155",
  };
};
