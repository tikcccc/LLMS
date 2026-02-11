export const createSiteBoundaryEditForm = (boundary = {}) => ({
  id: String(boundary.id || ""),
  name: String(boundary.name || ""),
  contractNo: String(boundary.contractNo || ""),
  futureUse: String(boundary.futureUse || ""),
  plannedHandoverDate: String(boundary.plannedHandoverDate || ""),
  completionDate: String(boundary.completionDate || ""),
  others: String(boundary.others || ""),
});

export const buildSiteBoundaryUpdatePayload = (form = {}) => ({
  name: String(form.name || ""),
  contractNo: String(form.contractNo || ""),
  futureUse: String(form.futureUse || ""),
  plannedHandoverDate: String(form.plannedHandoverDate || ""),
  completionDate: String(form.completionDate || ""),
  others: String(form.others || ""),
});
