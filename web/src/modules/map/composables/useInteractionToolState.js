import Draw, { createRegularPolygon } from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";
import { ElMessage } from "element-plus";

import {
  defaultEditTool,
  defaultScopeTool,
  isEditOnlyTool,
  isMeasureTool,
  isPolygonTool,
  isScopeTool,
} from "../utils/interactionHelpers";

export const useInteractionToolState = ({
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
  interactionCallbacks,
  ensureScopeLayer,
  ensureMeasureLayer,
  handleSelect,
  handleScopeDrawEnd,
  handlePolygonDrawEnd,
  handleDeleteSelect,
  handleModifySelect,
  handleModifyEnd,
}) => {
  const cancelTool = () => {
    if (isScopeTool(uiStore.tool)) {
      abortDrawing();
      hasDraft.value = false;
      clearScopeQuery();
      uiStore.setTool(defaultScopeTool());
      return;
    }
    if (isMeasureTool(uiStore.tool)) {
      abortDrawing();
      hasDraft.value = false;
      clearMeasure();
      uiStore.setTool("MEASURE");
      return;
    }
    if (isPolygonTool(uiStore.tool)) {
      interactionCallbacks.cancelDraft();
      return;
    }
    if (uiStore.tool === "MODIFY") {
      interactionCallbacks.cancelModify();
      return;
    }
    if (uiStore.tool === "DELETE" && selectInteraction.value) {
      selectInteraction.value.getFeatures().clear();
      clearHighlightOverride();
      uiStore.setTool(canEditLayer.value ? defaultEditTool() : defaultScopeTool());
      return;
    }
    uiStore.setTool(defaultScopeTool());
  };

  const setTool = (tool) => {
    if (uiStore.tool === "MODIFY" && tool !== "MODIFY") {
      restoreModifyBackup();
      clearModifyState();
      uiStore.clearSelection();
      clearHighlightOverride();
    }
    if (uiStore.tool === "DELETE" && tool !== "DELETE") {
      clearHighlightOverride();
    }
    if (isMeasureTool(uiStore.tool) && tool !== "MEASURE") {
      abortDrawing();
      hasDraft.value = false;
      clearMeasure();
    }

    if (isEditOnlyTool(tool) && !canEditLayer.value) return;

    if (isPolygonTool(uiStore.tool) && tool !== uiStore.tool) {
      abortDrawing();
      clearDraft();
    }

    if (isScopeTool(uiStore.tool) && tool !== uiStore.tool) {
      abortDrawing();
      hasDraft.value = false;
    }

    if (tool !== "PAN") {
      if (activeLayerType.value === "work" && !uiStore.showWorkLots) {
        uiStore.setLayerVisibility("showWorkLots", true);
        uiStore.setLayerVisibility("showWorkLotsBusiness", true);
        uiStore.setLayerVisibility("showWorkLotsDomestic", true);
        uiStore.setLayerVisibility("showWorkLotsGovernment", true);
      }
      if (activeLayerType.value === "siteBoundary" && !uiStore.showSiteBoundary) {
        uiStore.setLayerVisibility("showSiteBoundary", true);
      }
      if (activeLayerType.value === "partOfSites" && !uiStore.showPartOfSites) {
        uiStore.setLayerVisibility("showPartOfSites", true);
      }
      if (activeLayerType.value === "section" && !uiStore.showSections) {
        uiStore.setLayerVisibility("showSections", true);
      }
      uiStore.clearSelection();
      clearHighlightOverride();
    }

    uiStore.setTool(tool);
  };

  const clearInteractions = () => {
    if (!mapRef.value) return;
    const interactions = mapRef.value.getInteractions().getArray();
    interactions
      .filter((interaction) => interaction.get && interaction.get("managed"))
      .forEach((interaction) => {
        if (typeof interaction.abortDrawing === "function") {
          interaction.abortDrawing();
        }
        if (interaction.getFeatures) {
          interaction.getFeatures().clear();
        }
        mapRef.value.removeInteraction(interaction);
      });
    interactionState.drawInteraction = null;
    interactionState.modifyInteraction = null;
    selectInteraction.value = null;
  };

  const rebuildInteractions = () => {
    if (!mapRef.value) return;
    ensureScopeLayer();
    ensureMeasureLayer();
    clearInteractions();
    if (uiStore.tool !== "MODIFY") {
      interactionState.modifyLayerType = null;
    }

    if (uiStore.tool === "PAN") {
      const selectableLayers = [...(workLayers || [])].filter(Boolean);
      if (siteBoundaryLayer) selectableLayers.unshift(siteBoundaryLayer);
      if (sectionsLayer) selectableLayers.unshift(sectionsLayer);
      if (partOfSitesLayer) selectableLayers.unshift(partOfSitesLayer);
      selectInteraction.value = new Select({ layers: selectableLayers, style: null });
      selectInteraction.value.set("managed", true);
      selectInteraction.value.on("select", handleSelect);
      mapRef.value.addInteraction(selectInteraction.value);
      return;
    }

    if (isScopeTool(uiStore.tool)) {
      const isCircleTool = uiStore.tool === "DRAW_CIRCLE";
      interactionState.drawInteraction = new Draw({
        source: scopeQuerySource,
        type: isCircleTool ? "Circle" : "Polygon",
        geometryFunction: isCircleTool ? createRegularPolygon(64) : undefined,
      });
      interactionState.drawInteraction.set("managed", true);
      interactionState.drawInteraction.on("drawstart", (event) => {
        scopeQuerySource.clear(true);
        interactionCallbacks.setDraftFeature(event.feature, scopeQuerySource);
        hasDraft.value = true;
      });
      interactionState.drawInteraction.on("drawend", handleScopeDrawEnd);
      mapRef.value.addInteraction(interactionState.drawInteraction);
      return;
    }

    if (isMeasureTool(uiStore.tool)) {
      interactionState.drawInteraction = new Draw({
        source: measureSource,
        type: "LineString",
        style: measureSketchStyle,
      });
      interactionState.drawInteraction.set("managed", true);
      interactionState.drawInteraction.on("drawstart", () => {
        measureSource.clear(true);
        hasDraft.value = true;
      });
      interactionState.drawInteraction.on("drawend", (event) => {
        hasDraft.value = false;
        const geometry = event.feature?.getGeometry();
        if (!geometry || geometry.getType() !== "LineString") return;
        const distanceLabel = formatMeasureDistance(geometry.getLength());
        event.feature.set("measureLabel", distanceLabel);
        ElMessage.success(`Distance: ${distanceLabel}`);
      });
      mapRef.value.addInteraction(interactionState.drawInteraction);
      return;
    }

    if (uiStore.tool === "DELETE") {
      const deletableLayers = [
        siteBoundaryLayer,
        sectionsLayer,
        partOfSitesLayer,
        ...(workLayers || []),
      ].filter(Boolean);
      if (deletableLayers.length === 0) return;
      selectInteraction.value = new Select({ layers: deletableLayers, style: null });
      selectInteraction.value.set("managed", true);
      selectInteraction.value.on("select", handleDeleteSelect);
      mapRef.value.addInteraction(selectInteraction.value);
      return;
    }

    const layerType = activeLayerType.value;
    if (!layerType) return;
    if (
      uiStore.tool === "MODIFY" &&
      interactionState.modifyLayerType &&
      interactionState.modifyLayerType !== layerType
    ) {
      restoreModifyBackup();
      clearModifyState();
      uiStore.clearSelection();
      clearHighlightOverride();
    }

    const targetSource =
      layerType === "siteBoundary"
        ? siteBoundarySource
        : layerType === "section"
          ? sectionsSource
          : layerType === "partOfSites"
            ? partOfSitesSource
            : workSources?.[0];
    const targetLayers =
      layerType === "siteBoundary"
        ? [siteBoundaryLayer].filter(Boolean)
        : layerType === "section"
          ? [sectionsLayer].filter(Boolean)
          : layerType === "partOfSites"
            ? [partOfSitesLayer].filter(Boolean)
            : [...(workLayers || [])].filter(Boolean);
    if (!targetSource || targetLayers.length === 0) return;

    if (uiStore.tool === "MODIFY") {
      interactionState.modifyLayerType = layerType;
      selectInteraction.value = new Select({ layers: targetLayers, style: null });
      selectInteraction.value.set("managed", true);
      selectInteraction.value.on("select", handleModifySelect);
      mapRef.value.addInteraction(selectInteraction.value);

      interactionState.modifyInteraction = new Modify({
        features: selectInteraction.value.getFeatures(),
      });
      interactionState.modifyInteraction.set("managed", true);
      interactionState.modifyInteraction.on("modifystart", (event) => {
        if (modifyBackup.size > 0) return;
        event.features.forEach((feature) => {
          const geometry = feature.getGeometry();
          if (geometry) {
            modifyBackup.set(feature.getId(), geometry.clone());
          }
        });
      });
      interactionState.modifyInteraction.on("modifyend", handleModifyEnd);
      mapRef.value.addInteraction(interactionState.modifyInteraction);
      return;
    }

    if (isPolygonTool(uiStore.tool)) {
      const isCircleTool = uiStore.tool === "POLYGON_CIRCLE";
      interactionState.drawInteraction = new Draw({
        source: targetSource,
        type: isCircleTool ? "Circle" : "Polygon",
        geometryFunction: isCircleTool ? createRegularPolygon(64) : undefined,
      });
      interactionState.drawInteraction.set("managed", true);
      interactionState.drawInteraction.on("drawstart", (event) => {
        interactionCallbacks.setDraftFeature(event.feature, targetSource);
        hasDraft.value = true;
      });
      interactionState.drawInteraction.on("drawend", handlePolygonDrawEnd);
      mapRef.value.addInteraction(interactionState.drawInteraction);
      return;
    }

  };

  return {
    setTool,
    cancelTool,
    clearInteractions,
    rebuildInteractions,
  };
};
