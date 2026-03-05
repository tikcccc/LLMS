import { nowIso, todayHongKong } from "../../../shared/utils/time";
import {
  createWorkLotEditForm,
  buildWorkLotUpdatePayload,
} from "../../../shared/utils/workLotEdit";
import {
  createSiteBoundaryEditForm,
  buildSiteBoundaryUpdatePayload,
} from "../../../shared/utils/siteBoundaryEdit";
import {
  createPartOfSiteEditForm,
  buildPartOfSiteUpdatePayload,
} from "../../../shared/utils/partOfSiteEdit";
import {
  createSectionEditForm,
  buildSectionUpdatePayload,
} from "../../../shared/utils/sectionEdit";
import { useMapDialogActions } from "./useMapDialogActions";

export const useMapPageDialogActionsSetup = ({
  selection,
  stores,
  forms,
  dialogs,
  editing,
  resets,
  relations,
  geometry,
  contract,
  featureLookup,
  callbacks,
}) =>
  useMapDialogActions({
    ...selection,
    ...stores,
    ...forms,
    ...dialogs,
    ...editing,
    ...resets,
    ...relations,
    ...geometry,
    ...contract,
    ...featureLookup,
    ...callbacks,
    createWorkLotEditForm,
    createSiteBoundaryEditForm,
    createPartOfSiteEditForm,
    createSectionEditForm,
    buildWorkLotUpdatePayload,
    buildSiteBoundaryUpdatePayload,
    buildPartOfSiteUpdatePayload,
    buildSectionUpdatePayload,
    nowIso,
    todayHongKong,
  });
