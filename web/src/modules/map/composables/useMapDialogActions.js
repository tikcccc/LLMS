export const useMapDialogActions = ({
  canEditWork,
  selectedWorkLot,
  selectedSiteBoundary,
  selectedPartOfSite,
  selectedSection,
  workLotStore,
  siteBoundaryStore,
  partOfSitesStore,
  sectionsStore,
  uiStore,
  authStore,
  workForm,
  siteBoundaryForm,
  partOfSiteForm,
  sectionForm,
  showWorkDialog,
  workDialogMode,
  editingWorkLotId,
  showSiteBoundaryDialog,
  siteBoundaryDialogMode,
  editingSiteBoundaryId,
  showPartOfSiteDialog,
  partOfSiteDialogMode,
  editingPartOfSiteId,
  editingPartOfSiteContractPackage,
  showSectionDialog,
  sectionDialogMode,
  editingSectionId,
  editingSectionContractPackage,
  resetWorkForm,
  resetWorkDialogEditState,
  resetSiteBoundaryForm,
  resetSiteBoundaryDialogEditState,
  resetPartOfSiteDialogEditState,
  resetSectionDialogEditState,
  createWorkLotEditForm,
  createSiteBoundaryEditForm,
  createPartOfSiteEditForm,
  createSectionEditForm,
  buildWorkLotUpdatePayload,
  buildSiteBoundaryUpdatePayload,
  buildPartOfSiteUpdatePayload,
  buildSectionUpdatePayload,
  resolveRelatedSiteBoundaryIdsByGeometryObject,
  withRelatedIdFallback,
  pendingGeometry,
  clearDraft,
  cancelDraft,
  nowIso,
  todayHongKong,
  normalizeContractPackageValue,
  resolveContractPackageValue,
  normalizePartValue,
  normalizeSectionValue,
  normalizePositiveNumber,
  findPartOfSitesFeatureById,
  findSectionFeatureById,
  refreshHighlights,
  clearHighlightOverride,
  onPartOfSitesChanged,
  onSectionsChanged,
  notify,
}) => {
  const applyPartOfSiteAttributeUpdate = (
    partId,
    payload = {},
    { contractPackage = "" } = {}
  ) => {
    const normalizedPartId = normalizePartValue(partId);
    if (!normalizedPartId) return false;
    const feature =
      findPartOfSitesFeatureById(normalizedPartId, contractPackage) ||
      findPartOfSitesFeatureById(normalizedPartId);
    if (!feature) return false;
    const resolvedPackage = resolveContractPackageValue([
      contractPackage,
      feature?.get("contractPackage"),
      feature?.get("contract_package"),
      feature?.get("phase"),
      feature?.get("package"),
    ]);

    const accessDate = String(payload.accessDate || "").trim();
    const area = normalizePositiveNumber(payload.area);
    feature.set("accessDate", accessDate);
    if (area !== null) {
      feature.set("area", area);
    } else {
      feature.unset("area", true);
    }
    feature.set("updatedAt", String(payload.updatedAt || "").trim());
    feature.set("updatedBy", String(payload.updatedBy || "").trim());
    feature.set("contractPackage", resolvedPackage);

    if (typeof partOfSitesStore.setAttributeOverride === "function") {
      partOfSitesStore.setAttributeOverride(
        normalizedPartId,
        {
          partId: normalizedPartId,
          contractPackage: resolvedPackage,
          ...payload,
        },
        resolvedPackage
      );
    }
    return true;
  };

  const applySectionAttributeUpdate = (
    sectionId,
    payload = {},
    { contractPackage = "" } = {}
  ) => {
    const normalizedSectionId = normalizeSectionValue(sectionId);
    if (!normalizedSectionId) return false;
    const feature =
      findSectionFeatureById(normalizedSectionId, contractPackage) ||
      findSectionFeatureById(normalizedSectionId);
    if (!feature) return false;
    const resolvedPackage = resolveContractPackageValue([
      contractPackage,
      feature?.get("contractPackage"),
      feature?.get("contract_package"),
      feature?.get("phase"),
      feature?.get("package"),
    ]);

    const completionDate = String(payload.completionDate || "").trim();
    const area = normalizePositiveNumber(payload.area);
    feature.set("completionDate", completionDate);
    if (area !== null) {
      feature.set("area", area);
    } else {
      feature.unset("area", true);
    }
    feature.set("updatedAt", String(payload.updatedAt || "").trim());
    feature.set("updatedBy", String(payload.updatedBy || "").trim());
    feature.set("contractPackage", resolvedPackage);

    if (typeof sectionsStore.setAttributeOverride === "function") {
      sectionsStore.setAttributeOverride(
        normalizedSectionId,
        {
          sectionId: normalizedSectionId,
          contractPackage: resolvedPackage,
          ...payload,
        },
        resolvedPackage
      );
    }
    return true;
  };

  const deleteSelectedWorkLot = () => {
    if (!selectedWorkLot.value) return;
    const workLotId = selectedWorkLot.value.id;
    workLotStore.removeWorkLot(workLotId);
    uiStore.clearSelection();
    clearHighlightOverride();
    refreshHighlights();
  };

  const editSelectedWorkLot = () => {
    if (!canEditWork.value || !selectedWorkLot.value) return;
    const lot = selectedWorkLot.value;
    workDialogMode.value = "edit";
    editingWorkLotId.value = lot.id;
    workForm.value = createWorkLotEditForm(lot, {
      relatedSiteBoundaryIds: withRelatedIdFallback(
        resolveRelatedSiteBoundaryIdsByGeometryObject(lot.geometry),
        lot.relatedSiteBoundaryIds
      ),
    });
    showWorkDialog.value = true;
  };

  const editSelectedSiteBoundary = () => {
    if (!canEditWork.value || !selectedSiteBoundary.value) return;
    const boundary = selectedSiteBoundary.value;
    siteBoundaryDialogMode.value = "edit";
    editingSiteBoundaryId.value = String(boundary.id || "");
    siteBoundaryForm.value = createSiteBoundaryEditForm(boundary);
    showSiteBoundaryDialog.value = true;
  };

  const editSelectedPartOfSite = () => {
    if (!canEditWork.value || !selectedPartOfSite.value) return;
    const part = selectedPartOfSite.value;
    partOfSiteDialogMode.value = "edit";
    editingPartOfSiteId.value = String(part.partId || "");
    editingPartOfSiteContractPackage.value = normalizeContractPackageValue(part.contractPackage);
    partOfSiteForm.value = createPartOfSiteEditForm(part);
    showPartOfSiteDialog.value = true;
  };

  const editSelectedSection = () => {
    if (!canEditWork.value || !selectedSection.value) return;
    const section = selectedSection.value;
    sectionDialogMode.value = "edit";
    editingSectionId.value = String(section.sectionId || "");
    editingSectionContractPackage.value = normalizeContractPackageValue(section.contractPackage);
    sectionForm.value = createSectionEditForm(section);
    showSectionDialog.value = true;
  };

  const startSiteBoundaryDrawCreate = () => {
    siteBoundaryDialogMode.value = "create";
    editingSiteBoundaryId.value = "";
    resetSiteBoundaryForm();
    siteBoundaryForm.value.contractPackage = normalizeContractPackageValue(uiStore.activeContract);
  };

  const confirmWork = () => {
    if (workDialogMode.value === "edit") {
      const workLotId = editingWorkLotId.value;
      if (!workLotId) return;
      const existing = workLotStore.workLots.find((lot) => lot.id === workLotId);
      const autoRelatedIds = withRelatedIdFallback(
        resolveRelatedSiteBoundaryIdsByGeometryObject(existing?.geometry),
        existing?.relatedSiteBoundaryIds
      );
      workLotStore.updateWorkLot(
        workLotId,
        buildWorkLotUpdatePayload(workForm.value, {
          workLotId,
          fallbackOperatorName: existing?.operatorName || `Work Lot ${workLotId}`,
          relatedSiteBoundaryIds: autoRelatedIds,
          updatedBy: authStore.roleName,
          updatedAt: nowIso(),
        })
      );
      showWorkDialog.value = false;
      resetWorkDialogEditState();
      return;
    }

    if (!pendingGeometry.value) return;
    const workLotName = workForm.value.operatorName.trim() || "Work Lot";
    const relatedSiteBoundaryIds = resolveRelatedSiteBoundaryIdsByGeometryObject(
      pendingGeometry.value
    );
    workLotStore.addWorkLot({
      contractPackage: normalizeContractPackageValue(
        workForm.value.contractPackage || uiStore.activeContract
      ),
      operatorName: workLotName,
      category: workForm.value.category,
      relatedSiteBoundaryIds,
      responsiblePerson: workForm.value.responsiblePerson,
      assessDate: workForm.value.assessDate,
      dueDate: workForm.value.dueDate || todayHongKong(),
      completionDate: workForm.value.completionDate,
      floatMonths: workForm.value.floatMonths,
      forceEviction: workForm.value.forceEviction,
      status: workForm.value.status,
      description: workForm.value.description,
      remark: workForm.value.remark,
      geometry: pendingGeometry.value,
      updatedBy: authStore.roleName,
      updatedAt: nowIso(),
    });
    resetWorkForm();
    workForm.value.contractPackage = normalizeContractPackageValue(uiStore.activeContract);
    showWorkDialog.value = false;
    clearDraft();
    resetWorkDialogEditState();
  };

  const cancelWork = () => {
    if (workDialogMode.value === "edit") {
      showWorkDialog.value = false;
      resetWorkDialogEditState();
      return;
    }
    cancelDraft();
  };

  const confirmSiteBoundary = () => {
    if (siteBoundaryDialogMode.value === "edit") {
      if (!editingSiteBoundaryId.value) return;
      siteBoundaryStore.updateSiteBoundary(
        editingSiteBoundaryId.value,
        buildSiteBoundaryUpdatePayload(siteBoundaryForm.value)
      );
      showSiteBoundaryDialog.value = false;
      resetSiteBoundaryDialogEditState();
      return;
    }
    if (!pendingGeometry.value) return;
    const created = siteBoundaryStore.addSiteBoundary({
      ...buildSiteBoundaryUpdatePayload(siteBoundaryForm.value),
      contractPackage: normalizeContractPackageValue(
        siteBoundaryForm.value.contractPackage || uiStore.activeContract
      ),
      name: String(siteBoundaryForm.value.name || "").trim() || "Site Boundary",
      geometry: pendingGeometry.value,
      entity: pendingGeometry.value?.type || "Polygon",
    });
    uiStore.selectSiteBoundary(created.id);
    resetSiteBoundaryForm();
    siteBoundaryForm.value.contractPackage = normalizeContractPackageValue(uiStore.activeContract);
    clearDraft();
    resetSiteBoundaryDialogEditState();
  };

  const cancelSiteBoundary = () => {
    if (siteBoundaryDialogMode.value === "edit") {
      showSiteBoundaryDialog.value = false;
      resetSiteBoundaryDialogEditState();
      return;
    }
    cancelDraft();
  };

  const confirmPartOfSite = () => {
    if (partOfSiteDialogMode.value !== "edit") return;
    if (!editingPartOfSiteId.value) return;
    const payload = buildPartOfSiteUpdatePayload(partOfSiteForm.value, {
      updatedBy: authStore.roleName,
      updatedAt: nowIso(),
    });
    const updated = applyPartOfSiteAttributeUpdate(editingPartOfSiteId.value, payload, {
      contractPackage: editingPartOfSiteContractPackage.value,
    });
    if (!updated) {
      notify?.error?.("Failed to update Part of Site.");
      return;
    }
    showPartOfSiteDialog.value = false;
    resetPartOfSiteDialogEditState();
    onPartOfSitesChanged?.();
    notify?.success?.("Part of Site updated.");
  };

  const cancelPartOfSite = () => {
    showPartOfSiteDialog.value = false;
    resetPartOfSiteDialogEditState();
  };

  const confirmSection = () => {
    if (sectionDialogMode.value !== "edit") return;
    if (!editingSectionId.value) return;
    const payload = buildSectionUpdatePayload(sectionForm.value, {
      updatedBy: authStore.roleName,
      updatedAt: nowIso(),
    });
    const updated = applySectionAttributeUpdate(editingSectionId.value, payload, {
      contractPackage: editingSectionContractPackage.value,
    });
    if (!updated) {
      notify?.error?.("Failed to update Section.");
      return;
    }
    showSectionDialog.value = false;
    resetSectionDialogEditState();
    onSectionsChanged?.();
    notify?.success?.("Section updated.");
  };

  const cancelSection = () => {
    showSectionDialog.value = false;
    resetSectionDialogEditState();
  };

  return {
    deleteSelectedWorkLot,
    editSelectedWorkLot,
    editSelectedSiteBoundary,
    editSelectedPartOfSite,
    editSelectedSection,
    startSiteBoundaryDrawCreate,
    confirmWork,
    cancelWork,
    confirmSiteBoundary,
    cancelSiteBoundary,
    confirmPartOfSite,
    cancelPartOfSite,
    confirmSection,
    cancelSection,
  };
};
