import { shallowRef } from "vue";

import { EPSG_2326 } from "../ol/projection";
import {
  formatMeasureDistance,
  measureSketchStyle,
  measureStyle,
  scopeSketchStyle,
} from "./interactionStyles";
import { useInteractionDrawHandlers } from "./useInteractionDrawHandlers";
import { useInteractionFeatureMeta } from "./useInteractionFeatureMeta";
import { useInteractionOverlayState } from "./useInteractionOverlayState";
import { useInteractionToolState } from "./useInteractionToolState";
import { useInteractionModifyLifecycle } from "./useInteractionModifyLifecycle";
import { useInteractionSelectionHandlers } from "./useInteractionSelectionHandlers";
import { nowIso } from "../../../shared/utils/time";
import { findSiteBoundaryIdsForGeometry } from "../utils/siteBoundaryMatch";
import {
  defaultEditTool,
  defaultScopeTool,
  getFeatureBySystemId,
  getPartOfSitesIdFromFeature,
  getSectionIdFromFeature,
  isPolygonTool,
  normalizePartId,
  normalizeSectionId,
  normalizeValue,
} from "../utils/interactionHelpers";

export const useMapInteractions = ({
  mapRef,
  uiStore,
  authStore,
  canEditLayer,
  activeLayerType,
  workSources,
  workLayers,
  getWorkFeatureById,
  getSiteBoundaryFeatureById,
  siteBoundarySource,
  partOfSitesLayer,
  partOfSitesSource,
  sectionsLayer,
  sectionsSource,
  siteBoundaryLayer,
  refreshHighlights,
  setHighlightFeature,
  clearHighlightOverride,
  workLotStore,
  siteBoundaryStore,
  format,
  pendingGeometry,
  showWorkDialog,
  showSiteBoundaryDialog,
  hasDraft,
  onScopeQueryResult,
  onSiteBoundaryDrawStart,
  onPartOfSitesSourceChange,
  onSectionsSourceChange,
  resolvePartOfSitesIdAtCoordinate = null,
  resolveSectionIdAtCoordinate = null,
}) => {
  const interactionState = {
    drawInteraction: null,
    modifyInteraction: null,
    modifyLayerType: null,
  };
  const selectInteraction = shallowRef(null);

  let draftFeature = null;
  let draftSource = null;
  const {
    scopeQuerySource,
    measureSource,
    ensureScopeLayer,
    ensureMeasureLayer,
    clearScopeQuery,
    clearMeasure,
  } = useInteractionOverlayState({
    mapRef,
    scopeSketchStyle,
    measureStyle,
    onScopeQueryResult,
  });

  const getPartOfSitesFeatureBySystemId = (systemId) =>
    getFeatureBySystemId(partOfSitesSource, systemId);
  const getSectionFeatureBySystemId = (systemId) =>
    getFeatureBySystemId(sectionsSource, systemId);
  const { ensurePartOfSitesFeatureMeta, ensureSectionFeatureMeta } =
    useInteractionFeatureMeta({
      partOfSitesSource,
      sectionsSource,
    });
  const notifyPartOfSitesSourceChange = () => {
    onPartOfSitesSourceChange?.();
  };
  const notifySectionsSourceChange = () => {
    onSectionsSourceChange?.();
  };

  const {
    modifySelectedId,
    hasPendingModify,
    selectedModifyFeature,
    modifyBackup,
    restoreModifyBackup,
    clearModifyState,
    markModifiedFeatures,
    saveModify,
    cancelModify,
  } = useInteractionModifyLifecycle({
    uiStore,
    canEditLayer,
    activeLayerType,
    authStore,
    format,
    projectionCode: EPSG_2326,
    nowIso,
    siteBoundarySource,
    getWorkFeatureById,
    getSiteBoundaryFeatureById,
    getPartOfSitesFeatureBySystemId,
    getSectionFeatureBySystemId,
    workLotStore,
    siteBoundaryStore,
    resolveSiteBoundaryIdsForGeometry: findSiteBoundaryIdsForGeometry,
    notifyPartOfSitesSourceChange,
    notifySectionsSourceChange,
    clearHighlightOverride,
    resetModifyLayerType: () => {
      interactionState.modifyLayerType = null;
    },
    fallbackTool: defaultScopeTool,
  });

  const abortDrawing = () => {
    if (interactionState.drawInteraction) {
      interactionState.drawInteraction.abortDrawing();
    }
  };

  const setDraftFeature = (feature, source) => {
    draftFeature = feature || null;
    draftSource = source || null;
  };

  const clearDraft = () => {
    if (draftFeature && draftSource) {
      draftSource.removeFeature(draftFeature);
    }
    draftFeature = null;
    draftSource = null;
    pendingGeometry.value = null;
    showWorkDialog.value = false;
    if (showSiteBoundaryDialog) {
      showSiteBoundaryDialog.value = false;
    }
    hasDraft.value = false;
  };

  const cancelDraft = () => {
    abortDrawing();
    clearDraft();
    if (!canEditLayer.value) {
      uiStore.setTool(defaultScopeTool());
      return;
    }
    const nextTool = isPolygonTool(uiStore.tool) ? uiStore.tool : defaultEditTool();
    uiStore.setTool(nextTool);
  };

  const { handleScopeDrawEnd, handlePolygonDrawEnd } = useInteractionDrawHandlers({
    workSources,
    siteBoundarySource,
    partOfSitesSource,
    sectionsSource,
    onScopeQueryResult,
    activeLayerType,
    uiStore,
    pendingGeometry,
    hasDraft,
    showWorkDialog,
    showSiteBoundaryDialog,
    onSiteBoundaryDrawStart,
    clearHighlightOverride,
    notifyPartOfSitesSourceChange,
    notifySectionsSourceChange,
    ensurePartOfSitesFeatureMeta,
    ensureSectionFeatureMeta,
    format,
    projectionCode: EPSG_2326,
    setDraftFeature,
  });

  const handleModifyEnd = (event) => {
    markModifiedFeatures(event.features);
    refreshHighlights();
  };

  const { handleSelect, handleDeleteSelect, handleModifySelect } =
    useInteractionSelectionHandlers({
      uiStore,
      activeLayerType,
      modifySelectedId,
      selectedModifyFeature,
      setHighlightFeature,
      clearHighlightOverride,
      workLotStore,
      siteBoundaryStore,
      partOfSitesSource,
      sectionsSource,
      notifyPartOfSitesSourceChange,
      notifySectionsSourceChange,
      resolvePartOfSitesIdAtCoordinate,
      resolveSectionIdAtCoordinate,
      normalizePartId,
      normalizeSectionId,
      getPartOfSitesIdFromFeature,
      getSectionIdFromFeature,
    });

  const { setTool, cancelTool, clearInteractions, rebuildInteractions } = useInteractionToolState({
    mapRef,
    uiStore,
    canEditLayer,
    activeLayerType,
    workLayers,
    workSources,
    siteBoundaryLayer,
    siteBoundarySource,
    partOfSitesLayer,
    partOfSitesSource,
    sectionsLayer,
    sectionsSource,
    scopeQuerySource,
    measureSource,
    measureSketchStyle,
    formatMeasureDistance,
    hasDraft,
    selectInteraction,
    interactionState,
    modifyBackup,
    abortDrawing,
    clearDraft,
    clearScopeQuery,
    clearMeasure,
    clearHighlightOverride,
    restoreModifyBackup,
    clearModifyState,
    interactionCallbacks: {
      cancelModify,
      cancelDraft,
      setDraftFeature,
    },
    ensureScopeLayer,
    ensureMeasureLayer,
    handleSelect,
    handleScopeDrawEnd,
    handlePolygonDrawEnd,
    handleDeleteSelect,
    handleModifySelect,
    handleModifyEnd,
  });

  return {
    setTool,
    cancelTool,
    clearDraft,
    clearScopeQuery,
    cancelDraft,
    rebuildInteractions,
    clearInteractions,
    selectInteraction,
    saveModify,
    modifySelectedId,
    hasPendingModify,
  };
};
