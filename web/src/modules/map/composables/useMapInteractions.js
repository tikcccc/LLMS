import { ref, shallowRef } from "vue";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Select from "ol/interaction/Select";
import Snap from "ol/interaction/Snap";
import { ElMessageBox } from "element-plus";

import { EPSG_2326 } from "../ol/projection";
import { nowIso } from "../../../shared/utils/time";

export const useMapInteractions = ({
  mapRef,
  uiStore,
  authStore,
  canEditLayer,
  activeLayerType,
  landSource,
  workSource,
  landLayer,
  workLayer,
  refreshHighlights,
  setHighlightFeature,
  clearHighlightOverride,
  landLotStore,
  workLotStore,
  taskStore,
  format,
  pendingGeometry,
  showLandDialog,
  showWorkDialog,
  hasDraft,
  clearTaskSelection,
}) => {
  let drawInteraction = null;
  let modifyInteraction = null;
  const selectInteraction = shallowRef(null);
  let snapInteraction = null;

  const modifySelectedId = ref(null);
  const hasPendingModify = ref(false);
  const pendingModifiedIds = new Set();
  let selectedModifyFeature = null;

  let draftFeature = null;
  let draftSource = null;
  const modifyBackup = new Map();

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
    showLandDialog.value = false;
    showWorkDialog.value = false;
    hasDraft.value = false;
  };

  const cancelDraft = () => {
    abortDrawing();
    clearDraft();
    uiStore.setTool("PAN");
  };

  const restoreModifyBackup = () => {
    if (!modifyBackup.size) return;
    modifyBackup.forEach((geometry, id) => {
      const feature = landSource?.getFeatureById(id) || workSource?.getFeatureById(id);
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
    if (uiStore.tool === "DRAW") {
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
    }
    uiStore.setTool("PAN");
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
    if (tool !== "PAN" && !canEditLayer.value) return;
    if (uiStore.tool === "DRAW" && tool !== "DRAW") {
      abortDrawing();
      clearDraft();
    }
    if (tool !== "PAN") {
      if (activeLayerType.value === "land" && !uiStore.showLandLots) {
        uiStore.setLayerVisibility("showLandLots", true);
      }
      if (activeLayerType.value === "work" && !uiStore.showWorkLots) {
        uiStore.setLayerVisibility("showWorkLots", true);
      }
      uiStore.clearSelection();
      clearHighlightOverride();
    }
    uiStore.setTool(tool);
  };

  const handleDrawEnd = (event) => {
    draftFeature = event.feature;
    hasDraft.value = true;
    const geometry = format.writeGeometryObject(event.feature.getGeometry(), {
      dataProjection: EPSG_2326,
      featureProjection: EPSG_2326,
    });
    pendingGeometry.value = geometry;
    if (activeLayerType.value === "land") {
      showLandDialog.value = true;
    } else if (activeLayerType.value === "work") {
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
    if (layerType === "land") {
      uiStore.selectLandLot(refId);
      if (clearTaskSelection) clearTaskSelection();
    } else if (layerType === "work") {
      uiStore.selectWorkLot(refId);
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
    if (layerType === "work") {
      const relatedTasks = taskStore?.tasks?.filter((task) => task.workLotId === id) ?? [];
      const openTasks = relatedTasks.filter((task) => task.status !== "Done").length;
      if (openTasks > 0) {
        message = `Delete ${id}? This work lot has ${openTasks} open task(s). Deleting will also remove its tasks.`;
      } else if (relatedTasks.length > 0) {
        message = `Delete ${id}? This work lot has ${relatedTasks.length} task(s). Deleting will also remove its tasks.`;
      }
    }
    ElMessageBox.confirm(message, "Confirm", { type: "warning" })
      .then(() => {
        if (layerType === "land") {
          landLotStore.removeLandLot(id);
        } else {
          workLotStore.removeWorkLot(id);
          if (taskStore?.removeTasksByWorkLot) {
            taskStore.removeTasksByWorkLot(id);
          }
        }
        uiStore.clearSelection();
        clearHighlightOverride();
      })
      .catch(() => {
        // user canceled
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
      if (layerType === "land") {
        uiStore.selectLandLot(refId);
        if (clearTaskSelection) clearTaskSelection();
      } else {
        uiStore.selectWorkLot(refId);
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
          const targetSource = layerType === "land" ? landSource : workSource;
          const updatedAt = nowIso();
          pendingModifiedIds.forEach((id) => {
            const feature = targetSource.getFeatureById(id);
            if (!feature) return;
            const geometry = format.writeGeometryObject(feature.getGeometry(), {
              dataProjection: EPSG_2326,
              featureProjection: EPSG_2326,
            });
            if (layerType === "land") {
              landLotStore.updateLandLot(id, {
                geometry,
                updatedAt,
                updatedBy: authStore.roleName,
              });
            } else if (layerType === "work") {
              workLotStore.updateWorkLot(id, {
                geometry,
                updatedAt,
                updatedBy: authStore.roleName,
              });
            }
          });
        }
        clearModifyState();
        uiStore.clearSelection();
        clearHighlightOverride();
        uiStore.setTool("PAN");
      })
      .catch(() => {
        cancelModify();
      });
  };

  const cancelModify = () => {
    restoreModifyBackup();
    clearModifyState();
    clearHighlightOverride();
    uiStore.setTool("PAN");
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
    snapInteraction = null;
  };

  const rebuildInteractions = () => {
    if (!mapRef.value) return;
    clearInteractions();

    if (uiStore.tool === "PAN") {
      const selectLayers = [workLayer, landLayer].filter(Boolean);
      selectInteraction.value = new Select({ layers: selectLayers, style: null });
      selectInteraction.value.set("managed", true);
      selectInteraction.value.on("select", handleSelect);
      mapRef.value.addInteraction(selectInteraction.value);
      return;
    }

    const layerType = activeLayerType.value;
    if (!layerType) return;

    const targetSource = layerType === "land" ? landSource : workSource;
    const targetLayer = layerType === "land" ? landLayer : workLayer;

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

    if (uiStore.tool === "DRAW") {
      drawInteraction = new Draw({ source: targetSource, type: "Polygon" });
      drawInteraction.set("managed", true);
      drawInteraction.on("drawstart", (event) => {
        draftFeature = event.feature;
        draftSource = targetSource;
        hasDraft.value = true;
      });
      drawInteraction.on("drawend", handleDrawEnd);
      mapRef.value.addInteraction(drawInteraction);
    }

    if (uiStore.tool === "DELETE") {
      selectInteraction.value = new Select({ layers: [targetLayer], style: null });
      selectInteraction.value.set("managed", true);
      selectInteraction.value.on("select", handleDeleteSelect);
      mapRef.value.addInteraction(selectInteraction.value);
    }

    if (
      authStore.role === "SITE_OFFICER" &&
      layerType === "work" &&
      ["DRAW", "MODIFY"].includes(uiStore.tool)
    ) {
      if (uiStore.showLandLots) {
        snapInteraction = new Snap({ source: landSource });
        snapInteraction.set("managed", true);
        mapRef.value.addInteraction(snapInteraction);
      }
    }
  };

  return {
    setTool,
    cancelTool,
    clearDraft,
    cancelDraft,
    rebuildInteractions,
    clearInteractions,
    selectInteraction,
    saveModify,
    modifySelectedId,
    hasPendingModify,
  };
};
