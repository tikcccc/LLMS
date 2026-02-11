import {
  normalizeWorkLotCategory,
  WORK_LOT_CATEGORY,
  WORK_LOT_STATUS,
} from "./worklot";
import { todayHongKong } from "./time";

const normalizeIdList = (value) =>
  Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];

export const createWorkLotEditForm = (lot = {}, overrides = {}) => {
  const fallbackDueDate = todayHongKong();
  return {
    id: String(lot.id || ""),
    operatorName: String(lot.operatorName || lot.name || ""),
    category: normalizeWorkLotCategory(lot.category ?? lot.type) || WORK_LOT_CATEGORY.BU,
    relatedSiteBoundaryIds:
      overrides.relatedSiteBoundaryIds !== undefined
        ? normalizeIdList(overrides.relatedSiteBoundaryIds)
        : normalizeIdList(lot.relatedSiteBoundaryIds),
    responsiblePerson: String(lot.responsiblePerson || ""),
    assessDate: String(lot.assessDate || ""),
    dueDate: String(lot.dueDate || fallbackDueDate),
    completionDate: String(lot.completionDate || ""),
    floatMonths: lot.floatMonths ?? null,
    forceEviction: !!lot.forceEviction,
    status: String(lot.status || WORK_LOT_STATUS.WAITING_ASSESSMENT),
    description: String(lot.description || ""),
    remark: String(lot.remark || ""),
  };
};

export const buildWorkLotUpdatePayload = (
  form = {},
  {
    workLotId = "",
    fallbackOperatorName = "",
    relatedSiteBoundaryIds,
    updatedBy = "",
    updatedAt = "",
    defaultDueDate = todayHongKong(),
  } = {}
) => {
  const resolvedWorkLotId = String(workLotId || form.id || "").trim();
  const fallbackName = String(fallbackOperatorName || "").trim();
  const resolvedName =
    String(form.operatorName || "").trim() ||
    fallbackName ||
    (resolvedWorkLotId ? `Work Lot ${resolvedWorkLotId}` : "Work Lot");
  const normalizedRelatedIds =
    relatedSiteBoundaryIds !== undefined
      ? normalizeIdList(relatedSiteBoundaryIds)
      : normalizeIdList(form.relatedSiteBoundaryIds);
  return {
    operatorName: resolvedName,
    category: normalizeWorkLotCategory(form.category ?? form.type),
    relatedSiteBoundaryIds: normalizedRelatedIds,
    responsiblePerson: String(form.responsiblePerson || ""),
    assessDate: String(form.assessDate || ""),
    dueDate: String(form.dueDate || defaultDueDate),
    completionDate: String(form.completionDate || ""),
    floatMonths: form.floatMonths ?? null,
    forceEviction: !!form.forceEviction,
    status: String(form.status || WORK_LOT_STATUS.WAITING_ASSESSMENT),
    description: String(form.description || ""),
    remark: String(form.remark || ""),
    updatedBy: String(updatedBy || ""),
    updatedAt: String(updatedAt || ""),
  };
};
