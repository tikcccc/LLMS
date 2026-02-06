export const workStatusStyle = (status) => {
  if (status === "Handover") {
    return {
      backgroundColor: "rgba(34,197,94,0.2)",
      borderColor: "rgba(34,197,94,0.5)",
      color: "#14532d",
    };
  }
  if (status === "In-Progress") {
    return {
      backgroundColor: "rgba(250,204,21,0.2)",
      borderColor: "rgba(250,204,21,0.5)",
      color: "#713f12",
    };
  }
  if (status === "Difficult") {
    return {
      backgroundColor: "rgba(239,68,68,0.2)",
      borderColor: "rgba(239,68,68,0.5)",
      color: "#7f1d1d",
    };
  }
  return {
    backgroundColor: "rgba(148,163,184,0.2)",
    borderColor: "rgba(148,163,184,0.5)",
    color: "#334155",
  };
};
