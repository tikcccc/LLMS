import { ref, shallowRef } from "vue";
import Draw, { createRegularPolygon } from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Point from "ol/geom/Point";
import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style";
import { getCenter } from "ol/extent";
import { ElMessage, ElMessageBox } from "element-plus";

import { EPSG_2326 } from "../ol/projection";
import { nowIso } from "../../../shared/utils/time";

const scopeSketchStyle = new Style({
  stroke: new Stroke({
    color: "rgba(13, 148, 136, 0.95)",
    width: 2.8,
    lineDash: [10, 6],
  }),
  fill: new Fill({
    color: "rgba(13, 148, 136, 0.18)",
  }),
});

const measureLineStyle = new Style({
  stroke: new Stroke({
    color: "rgba(37, 99, 235, 0.92)",
    width: 2.6,
    lineDash: [8, 6],
  }),
});

const measureSketchLineStyle = new Style({
  stroke: new Stroke({
    color: "rgba(29, 78, 216, 0.95)",
    width: 3,
    lineDash: [10, 5],
  }),
});

const formatMeasureDistance = (distance = 0) => {
  if (!Number.isFinite(distance) || distance <= 0) return "0 m";
  if (distance >= 1000) return `${(distance / 1000).toFixed(2)} km`;
  return `${Math.round(distance)} m`;
};

const createMeasureLabelStyle = (distanceLabel) =>
  new Style({
    geometry: (feature) => {
      const geometry = feature?.getGeometry();
      if (!geometry || geometry.getType() !== "LineString") return null;
      const coordinates = geometry.getCoordinates();
      if (!coordinates?.length) return null;
      return new Point(coordinates[coordinates.length - 1]);
    },
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({ color: "rgba(37, 99, 235, 0.96)" }),
      stroke: new Stroke({ color: "rgba(255, 255, 255, 0.95)", width: 1.8 }),
    }),
    text: new Text({
      text: distanceLabel,
      offsetY: -16,
      font: "600 12px 'IBM Plex Sans'",
      fill: new Fill({ color: "#1e3a8a" }),
      stroke: new Stroke({ color: "rgba(255, 255, 255, 0.98)", width: 4 }),
      backgroundFill: new Fill({ color: "rgba(239, 246, 255, 0.95)" }),
      padding: [3, 6, 3, 6],
    }),
  });

const measureStyle = (feature) => {
  const geometry = feature?.getGeometry();
  if (!geometry || geometry.getType() !== "LineString") {
    return [measureLineStyle];
  }
  const distanceLabel =
    feature.get("measureLabel") || formatMeasureDistance(geometry.getLength());
  return [measureLineStyle, createMeasureLabelStyle(distanceLabel)];
};

const measureSketchStyle = (feature) => {
  const geometry = feature?.getGeometry();
  if (!geometry || geometry.getType() !== "LineString") {
    return [measureSketchLineStyle];
  }
  const distanceLabel = formatMeasureDistance(geometry.getLength());
  return [measureSketchLineStyle, createMeasureLabelStyle(distanceLabel)];
};

export const useMapInteractions = ({
  mapRef,
  uiStore,
  authStore,
  canEditLayer,
  activeLayerType,
  workSource,
  workLayer,
  siteBoundarySource,
  siteBoundaryLayer,
  refreshHighlights,
  setHighlightFeature,
  clearHighlightOverride,
  workLotStore,
  taskStore,
  format,
  pendingGeometry,
  showWorkDialog,
  hasDraft,
  onScopeQueryResult,
}) => {
  let drawInteraction = null;
  let modifyInteraction = null;
  const selectInteraction = shallowRef(null);

  const modifySelectedId = ref(null);
  const hasPendingModify = ref(false);
  const pendingModifiedIds = new Set();
  let selectedModifyFeature = null;

  let draftFeature = null;
  let draftSource = null;
  const modifyBackup = new Map();

  const scopeQuerySource = new VectorSource();
  const scopeQueryLayer = new VectorLayer({
    source: scopeQuerySource,
    style: scopeSketchStyle,
  });
  scopeQueryLayer.setZIndex(30);
  let scopeLayerAdded = false;

  const measureSource = new VectorSource();
  const measureLayer = new VectorLayer({
    source: measureSource,
    style: measureStyle,
  });
  measureLayer.setZIndex(35);
  let measureLayerAdded = false;

  const isScopeTool = (tool) => tool === "DRAW" || tool === "DRAW_CIRCLE";
  const isMeasureTool = (tool) => tool === "MEASURE";
  const isPolygonTool = (tool) =>
    tool === "POLYGON" || tool === "POLYGON_CIRCLE";
  const isEditOnlyTool = (tool) =>
    tool === "POLYGON" ||
    tool === "POLYGON_CIRCLE" ||
    tool === "MODIFY" ||
    tool === "DELETE";
  const defaultScopeTool = () => "DRAW_CIRCLE";
  const defaultEditTool = () => "POLYGON";

  const ensureScopeLayer = () => {
    if (!mapRef.value || scopeLayerAdded) return;
    mapRef.value.addLayer(scopeQueryLayer);
    scopeLayerAdded = true;
  };

  const ensureMeasureLayer = () => {
    if (!mapRef.value || measureLayerAdded) return;
    mapRef.value.addLayer(measureLayer);
    measureLayerAdded = true;
  };

  const abortDrawing = () => {
    if (drawInteraction) {
      drawInteraction.abortDrawing();
    }
  };

  const clearDraft = () => {
    if (draftFeature && draftSource) {
      draftSource.removeFeature(draftFeature);
    }
    draftFeature = null;
    draftSource = null;
    pendingGeometry.value = null;
    showWorkDialog.value = false;
    hasDraft.value = false;
  };

  const clearScopeQuery = () => {
    scopeQuerySource.clear(true);
    onScopeQueryResult?.({ workLotIds: [], siteBoundaryIds: [] });
  };

  const clearMeasure = () => {
    measureSource.clear(true);
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

  const restoreModifyBackup = () => {
    if (!modifyBackup.size) return;
    modifyBackup.forEach((geometry, id) => {
      const feature = workSource?.getFeatureById(id);
      if (feature) {
        feature.setGeometry(geometry);
      }
    });
    modifyBackup.clear();
    clearHighlightOverride();
    uiStore.clearSelection();
  };

  const clearModifyState = () => {
    modifySelectedId.value = null;
    hasPendingModify.value = false;
    pendingModifiedIds.clear();
    selectedModifyFeature = null;
    modifyBackup.clear();
  };

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
      cancelDraft();
      return;
    }
    if (uiStore.tool === "MODIFY") {
      cancelModify();
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
      }
      uiStore.clearSelection();
      clearHighlightOverride();
    }

    uiStore.setTool(tool);
  };

  const featureIntersectsScope = (feature, scopeGeometry) => {
    const geometry = feature?.getGeometry();
    if (!geometry || !scopeGeometry) return false;

    const scopeExtent = scopeGeometry.getExtent();
    const featureExtent = geometry.getExtent();

    if (!geometry.intersectsExtent(scopeExtent)) return false;
    if (!scopeGeometry.intersectsExtent(featureExtent)) return false;

    const featureCenter = getCenter(featureExtent);
    if (scopeGeometry.intersectsCoordinate(featureCenter)) return true;

    const scopeCenter = getCenter(scopeExtent);
    if (geometry.intersectsCoordinate(scopeCenter)) return true;

    return true;
  };

  const collectScopeMatches = (scopeGeometry) => {
    const workLotIds = [];
    workSource?.getFeatures().forEach((feature) => {
      if (!featureIntersectsScope(feature, scopeGeometry)) return;
      const id = feature.get("refId") || feature.getId();
      if (id !== null && id !== undefined) {
        workLotIds.push(String(id));
      }
    });

    const siteBoundaryIds = [];
    siteBoundarySource?.getFeatures().forEach((feature) => {
      if (!featureIntersectsScope(feature, scopeGeometry)) return;
      const id = feature.get("refId") || feature.getId();
      if (id !== null && id !== undefined) {
        siteBoundaryIds.push(String(id));
      }
    });

    return {
      workLotIds: Array.from(new Set(workLotIds)),
      siteBoundaryIds: Array.from(new Set(siteBoundaryIds)),
    };
  };

  const handleScopeDrawEnd = (event) => {
    draftFeature = null;
    draftSource = null;
    hasDraft.value = false;

    const geometry = event.feature?.getGeometry();
    if (!geometry) {
      onScopeQueryResult?.({ workLotIds: [], siteBoundaryIds: [] });
      return;
    }

    onScopeQueryResult?.(collectScopeMatches(geometry));
  };

  const handlePolygonDrawEnd = (event) => {
    draftFeature = event.feature;
    hasDraft.value = true;
    const geometry = format.writeGeometryObject(event.feature.getGeometry(), {
      dataProjection: EPSG_2326,
      featureProjection: EPSG_2326,
    });
    pendingGeometry.value = geometry;
    if (activeLayerType.value === "work") {
      showWorkDialog.value = true;
    }
  };

  const handleModifyEnd = (event) => {
    event.features.forEach((feature) => {
      const id = feature.getId();
      pendingModifiedIds.add(id);
    });
    hasPendingModify.value = pendingModifiedIds.size > 0;
    refreshHighlights();
  };

  const handleSelect = (event) => {
    if (uiStore.tool !== "PAN") return;
    const selected = event.selected[0];
    if (!selected) {
      uiStore.clearSelection();
      clearHighlightOverride();
      return;
    }
    const layerType = selected.get("layerType");
    const refId = selected.get("refId") || selected.getId();
    if (layerType === "work") {
      uiStore.selectWorkLot(refId);
    } else if (layerType === "siteBoundary") {
      uiStore.selectSiteBoundary(refId);
    } else {
      return;
    }
    clearHighlightOverride();
  };

  const handleDeleteSelect = (event) => {
    const selected = event.selected[0];
    if (!selected) return;
    const id = selected.getId();
    const layerType = activeLayerType.value;
    if (!layerType) return;
    setHighlightFeature(layerType, selected);
    let message = `Delete ${id}?`;
    const relatedTasks = taskStore?.tasks?.filter((task) => task.workLotId === id) ?? [];
    const openTasks = relatedTasks.filter((task) => task.status !== "Done").length;
    if (openTasks > 0) {
      message = `Delete ${id}? This work lot has ${openTasks} open task(s). Deleting will also remove its tasks.`;
    } else if (relatedTasks.length > 0) {
      message = `Delete ${id}? This work lot has ${relatedTasks.length} task(s). Deleting will also remove its tasks.`;
    }
    ElMessageBox.confirm(message, "Confirm", { type: "warning" })
      .then(() => {
        workLotStore.removeWorkLot(id);
        if (taskStore?.removeTasksByWorkLot) {
          taskStore.removeTasksByWorkLot(id);
        }
        uiStore.clearSelection();
        clearHighlightOverride();
      })
      .catch(() => {
        clearHighlightOverride();
      })
      .finally(() => {
        event.target.getFeatures().clear();
      });
  };

  const handleModifySelect = (event) => {
    const features = event.target.getFeatures();
    const selected = event.selected[0];

    if (!selectedModifyFeature && !selected) {
      return;
    }

    if (!selectedModifyFeature && selected) {
      selectedModifyFeature = selected;
      const refId = selected.get("refId") || selected.getId();
      modifySelectedId.value = refId;
      const layerType = selected.get("layerType");
      if (layerType === "work") {
        uiStore.selectWorkLot(refId);
      } else {
        return;
      }
      setHighlightFeature(layerType, selected);
      return;
    }

    if (selectedModifyFeature) {
      features.clear();
      features.push(selectedModifyFeature);
    }
  };

  const saveModify = () => {
    if (!modifySelectedId.value) return;
    const layerType = activeLayerType.value;
    if (!layerType) return;

    ElMessageBox.confirm("Save changes?", "Confirm", { type: "warning" })
      .then(() => {
        if (pendingModifiedIds.size > 0) {
          const targetSource = workSource;
          const updatedAt = nowIso();
          pendingModifiedIds.forEach((id) => {
            const feature = targetSource.getFeatureById(id);
            if (!feature) return;
            const geometry = format.writeGeometryObject(feature.getGeometry(), {
              dataProjection: EPSG_2326,
              featureProjection: EPSG_2326,
            });
            workLotStore.updateWorkLot(id, {
              geometry,
              updatedAt,
              updatedBy: authStore.roleName,
            });
          });
        }
        clearModifyState();
        uiStore.clearSelection();
        clearHighlightOverride();
        uiStore.setTool(canEditLayer.value ? "MODIFY" : defaultScopeTool());
      })
      .catch(() => {
        cancelModify();
      });
  };

  const cancelModify = () => {
    restoreModifyBackup();
    clearModifyState();
    clearHighlightOverride();
    uiStore.setTool(canEditLayer.value ? "MODIFY" : defaultScopeTool());
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
    drawInteraction = null;
    modifyInteraction = null;
    selectInteraction.value = null;
  };

  const rebuildInteractions = () => {
    if (!mapRef.value) return;
    ensureScopeLayer();
    ensureMeasureLayer();
    clearInteractions();

    if (uiStore.tool === "PAN") {
      const selectableLayers = [workLayer].filter(Boolean);
      if (siteBoundaryLayer) selectableLayers.unshift(siteBoundaryLayer);
      selectInteraction.value = new Select({ layers: selectableLayers, style: null });
      selectInteraction.value.set("managed", true);
      selectInteraction.value.on("select", handleSelect);
      mapRef.value.addInteraction(selectInteraction.value);
      return;
    }

    if (isScopeTool(uiStore.tool)) {
      const isCircleTool = uiStore.tool === "DRAW_CIRCLE";
      drawInteraction = new Draw({
        source: scopeQuerySource,
        type: isCircleTool ? "Circle" : "Polygon",
        geometryFunction: isCircleTool ? createRegularPolygon(64) : undefined,
      });
      drawInteraction.set("managed", true);
      drawInteraction.on("drawstart", (event) => {
        scopeQuerySource.clear(true);
        draftFeature = event.feature;
        draftSource = scopeQuerySource;
        hasDraft.value = true;
      });
      drawInteraction.on("drawend", handleScopeDrawEnd);
      mapRef.value.addInteraction(drawInteraction);
      return;
    }

    if (isMeasureTool(uiStore.tool)) {
      drawInteraction = new Draw({
        source: measureSource,
        type: "LineString",
        style: measureSketchStyle,
      });
      drawInteraction.set("managed", true);
      drawInteraction.on("drawstart", () => {
        measureSource.clear(true);
        hasDraft.value = true;
      });
      drawInteraction.on("drawend", (event) => {
        hasDraft.value = false;
        const geometry = event.feature?.getGeometry();
        if (!geometry || geometry.getType() !== "LineString") return;
        const distanceLabel = formatMeasureDistance(geometry.getLength());
        event.feature.set("measureLabel", distanceLabel);
        ElMessage.success(`Distance: ${distanceLabel}`);
      });
      mapRef.value.addInteraction(drawInteraction);
      return;
    }

    const layerType = activeLayerType.value;
    if (!layerType) return;

    const targetSource = workSource;
    const targetLayer = workLayer;

    if (uiStore.tool === "MODIFY") {
      selectInteraction.value = new Select({ layers: [targetLayer], style: null });
      selectInteraction.value.set("managed", true);
      selectInteraction.value.on("select", handleModifySelect);
      mapRef.value.addInteraction(selectInteraction.value);

      modifyInteraction = new Modify({ features: selectInteraction.value.getFeatures() });
      modifyInteraction.set("managed", true);
      modifyInteraction.on("modifystart", (event) => {
        if (modifyBackup.size > 0) return;
        event.features.forEach((feature) => {
          const geometry = feature.getGeometry();
          if (geometry) {
            modifyBackup.set(feature.getId(), geometry.clone());
          }
        });
      });
      modifyInteraction.on("modifyend", handleModifyEnd);
      mapRef.value.addInteraction(modifyInteraction);
      return;
    }

    if (isPolygonTool(uiStore.tool)) {
      const isCircleTool = uiStore.tool === "POLYGON_CIRCLE";
      drawInteraction = new Draw({
        source: targetSource,
        type: isCircleTool ? "Circle" : "Polygon",
        geometryFunction: isCircleTool ? createRegularPolygon(64) : undefined,
      });
      drawInteraction.set("managed", true);
      drawInteraction.on("drawstart", (event) => {
        draftFeature = event.feature;
        draftSource = targetSource;
        hasDraft.value = true;
      });
      drawInteraction.on("drawend", handlePolygonDrawEnd);
      mapRef.value.addInteraction(drawInteraction);
      return;
    }

    if (uiStore.tool === "DELETE") {
      selectInteraction.value = new Select({ layers: [targetLayer], style: null });
      selectInteraction.value.set("managed", true);
      selectInteraction.value.on("select", handleDeleteSelect);
      mapRef.value.addInteraction(selectInteraction.value);
    }
  };

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
