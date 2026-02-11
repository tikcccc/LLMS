export const siteBoundaryStatusStyle = (statusKey, overdue = false) => {
  if (overdue && statusKey !== "HANDED_OVER" && statusKey !== "HANDOVER_READY") {
    return {
      backgroundColor: "rgba(248,113,113,0.2)",
      borderColor: "rgba(220,38,38,0.48)",
      color: "#7f1d1d",
    };
  }
  switch (statusKey) {
    case "HANDED_OVER":
    case "HANDOVER_READY":
      return {
        backgroundColor: "rgba(34,197,94,0.2)",
        borderColor: "rgba(22,163,74,0.46)",
        color: "#14532d",
      };
    case "CRITICAL_RISK":
      return {
        backgroundColor: "rgba(248,113,113,0.2)",
        borderColor: "rgba(220,38,38,0.48)",
        color: "#7f1d1d",
      };
    case "IN_PROGRESS":
      return {
        backgroundColor: "rgba(250,204,21,0.2)",
        borderColor: "rgba(202,138,4,0.45)",
        color: "#713f12",
      };
    default:
      return {
        backgroundColor: "rgba(148,163,184,0.2)",
        borderColor: "rgba(148,163,184,0.5)",
        color: "#334155",
      };
  }
};
