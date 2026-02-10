export const workStatusStyle = (status) => {
  if (status === "Waiting for Assessment") {
    return {
      backgroundColor: "rgba(148,163,184,0.2)",
      borderColor: "rgba(148,163,184,0.5)",
      color: "#334155",
    };
  }
  if (status === "EGA Approved") {
    return {
      backgroundColor: "rgba(59,130,246,0.18)",
      borderColor: "rgba(59,130,246,0.45)",
      color: "#1e3a8a",
    };
  }
  if (status === "Waiting for Clearance") {
    return {
      backgroundColor: "rgba(250,204,21,0.2)",
      borderColor: "rgba(250,204,21,0.5)",
      color: "#713f12",
    };
  }
  if (status === "Cleared / Completed") {
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
