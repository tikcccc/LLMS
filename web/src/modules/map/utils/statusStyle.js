export const workStatusStyle = (status) => {
  if (status === "EGA approved") {
    return {
      backgroundColor: "rgba(34,197,94,0.2)",
      borderColor: "rgba(34,197,94,0.5)",
      color: "#14532d",
    };
  }
  if (status === "waiting for clearance") {
    return {
      backgroundColor: "rgba(250,204,21,0.2)",
      borderColor: "rgba(250,204,21,0.5)",
      color: "#713f12",
    };
  }
  return {
    backgroundColor: "rgba(148,163,184,0.2)",
    borderColor: "rgba(148,163,184,0.5)",
    color: "#334155",
  };
};
