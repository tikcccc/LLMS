import { computed, ref } from "vue";

const createDefaultWorkForm = ({ workLotCategory, workLotStatus, todayHongKong }) => ({
  operatorName: "",
  category: workLotCategory.BU,
  relatedSiteBoundaryIds: [],
  responsiblePerson: "",
  assessDate: todayHongKong(),
  dueDate: todayHongKong(),
  completionDate: "",
  floatMonths: null,
  forceEviction: false,
  status: workLotStatus.WAITING_ASSESSMENT,
  description: "",
  remark: "",
});

export const useMapDialogForms = ({
  contractPackage,
  workLotCategory,
  workLotStatus,
  todayHongKong,
  siteBoundaryStore,
  createSiteBoundaryEditForm,
  createPartOfSiteEditForm,
  createSectionEditForm,
}) => {
  const showWorkDialog = ref(false);
  const workDialogMode = ref("create");
  const editingWorkLotId = ref(null);

  const showSiteBoundaryDialog = ref(false);
  const siteBoundaryDialogMode = ref("create");
  const editingSiteBoundaryId = ref("");

  const showPartOfSiteDialog = ref(false);
  const partOfSiteDialogMode = ref("create");
  const editingPartOfSiteId = ref("");
  const editingPartOfSiteContractPackage = ref(contractPackage.C2);

  const showSectionDialog = ref(false);
  const sectionDialogMode = ref("create");
  const editingSectionId = ref("");
  const editingSectionContractPackage = ref(contractPackage.C2);

  const workForm = ref(
    createDefaultWorkForm({
      workLotCategory,
      workLotStatus,
      todayHongKong,
    })
  );

  const siteBoundaryForm = ref({
    name: "",
    contractNo: "",
    futureUse: "",
    plannedHandoverDate: "",
    completionDate: "",
    others: "",
  });

  const partOfSiteForm = ref({
    id: "",
    partId: "",
    accessDate: "",
    area: null,
  });

  const sectionForm = ref({
    id: "",
    sectionId: "",
    completionDate: "",
    area: null,
  });

  const workDialogTitle = computed(() =>
    workDialogMode.value === "edit" ? "Edit Work Lot" : "Create Work Lot"
  );
  const workDialogConfirmText = computed(() =>
    workDialogMode.value === "edit" ? "Save Changes" : "Save"
  );
  const workDialogWorkLotId = computed(() =>
    workDialogMode.value === "edit" ? String(editingWorkLotId.value ?? "") : ""
  );
  const workFormRelatedSiteBoundaryNames = computed(() =>
    (Array.isArray(workForm.value.relatedSiteBoundaryIds)
      ? workForm.value.relatedSiteBoundaryIds
      : []
    ).map((id) => {
      const normalized = String(id).trim().toLowerCase();
      if (!normalized) return String(id);
      const found = siteBoundaryStore.siteBoundaries.find(
        (boundary) => String(boundary.id).trim().toLowerCase() === normalized
      );
      return found?.name || String(id);
    })
  );
  const siteBoundaryDialogBoundaryId = computed(() =>
    String(editingSiteBoundaryId.value || "")
  );
  const siteBoundaryDialogTitle = computed(() =>
    siteBoundaryDialogMode.value === "edit" ? "Edit Site Boundary" : "Create Site Boundary"
  );
  const siteBoundaryDialogConfirmText = computed(() =>
    siteBoundaryDialogMode.value === "edit" ? "Save Changes" : "Save"
  );
  const partOfSiteDialogSystemId = computed(() => String(partOfSiteForm.value.id || ""));
  const partOfSiteDialogPartId = computed(() => String(partOfSiteForm.value.partId || ""));
  const partOfSiteDialogTitle = computed(() =>
    partOfSiteDialogMode.value === "edit" ? "Edit Part of Site" : "Create Part of Site"
  );
  const partOfSiteDialogConfirmText = computed(() =>
    partOfSiteDialogMode.value === "edit" ? "Save Changes" : "Save"
  );
  const sectionDialogSystemId = computed(() => String(sectionForm.value.id || ""));
  const sectionDialogSectionId = computed(() => String(sectionForm.value.sectionId || ""));
  const sectionDialogTitle = computed(() =>
    sectionDialogMode.value === "edit" ? "Edit Section" : "Create Section"
  );
  const sectionDialogConfirmText = computed(() =>
    sectionDialogMode.value === "edit" ? "Save Changes" : "Save"
  );

  const resetWorkForm = () => {
    workForm.value = createDefaultWorkForm({
      workLotCategory,
      workLotStatus,
      todayHongKong,
    });
  };

  const resetWorkDialogEditState = () => {
    workDialogMode.value = "create";
    editingWorkLotId.value = null;
  };

  const resetSiteBoundaryForm = () => {
    siteBoundaryForm.value = createSiteBoundaryEditForm();
  };

  const resetPartOfSiteForm = () => {
    partOfSiteForm.value = createPartOfSiteEditForm();
  };

  const resetSectionForm = () => {
    sectionForm.value = createSectionEditForm();
  };

  const resetSiteBoundaryDialogEditState = () => {
    siteBoundaryDialogMode.value = "create";
    editingSiteBoundaryId.value = "";
  };

  const resetPartOfSiteDialogEditState = () => {
    partOfSiteDialogMode.value = "create";
    editingPartOfSiteId.value = "";
    editingPartOfSiteContractPackage.value = contractPackage.C2;
  };

  const resetSectionDialogEditState = () => {
    sectionDialogMode.value = "create";
    editingSectionId.value = "";
    editingSectionContractPackage.value = contractPackage.C2;
  };

  return {
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
    workForm,
    siteBoundaryForm,
    partOfSiteForm,
    sectionForm,
    workDialogTitle,
    workDialogConfirmText,
    workDialogWorkLotId,
    workFormRelatedSiteBoundaryNames,
    siteBoundaryDialogBoundaryId,
    siteBoundaryDialogTitle,
    siteBoundaryDialogConfirmText,
    partOfSiteDialogSystemId,
    partOfSiteDialogPartId,
    partOfSiteDialogTitle,
    partOfSiteDialogConfirmText,
    sectionDialogSystemId,
    sectionDialogSectionId,
    sectionDialogTitle,
    sectionDialogConfirmText,
    resetWorkForm,
    resetWorkDialogEditState,
    resetSiteBoundaryForm,
    resetPartOfSiteForm,
    resetSectionForm,
    resetSiteBoundaryDialogEditState,
    resetPartOfSiteDialogEditState,
    resetSectionDialogEditState,
  };
};
