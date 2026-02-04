import { ref } from "vue";
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
  landLotStore,
  workLotStore,
  format,
  pendingGeometry,
  showLandDialog,
  showWorkDialog,
  hasDraft,
  clearTaskSelection,
}) => {
  const drawInteraction = ref(null);
  const modifyInteraction = ref(null);
  const selectInteraction = ref(null);
  const snapInteraction = ref(null);

  let draftFeature = null;
  let draftSource = null;
  const modifyBackup = new Map();

  const abortDrawing = () => {
    if (drawInteraction.value) {
      drawInteraction.value.abortDrawing();
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
    refreshHighlights();
    uiStore.clearSelection();
  };

  const cancelTool = () => {
    if (uiStore.tool === "DRAW") {
      cancelDraft();
      return;
    }
    if (uiStore.tool === "MODIFY") {
      restoreModifyBackup();
    }
    if (uiStore.tool === "DELETE" && selectInteraction.value) {
      selectInteraction.value.getFeatures().clear();
    }
    uiStore.setTool("PAN");
  };

  const setTool = (tool) => {
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
      refreshHighlights();
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
    const updatedAt = nowIso();
    event.features.forEach((feature) => {
      const geometry = format.writeGeometryObject(feature.getGeometry(), {
        dataProjection: EPSG_2326,
        featureProjection: EPSG_2326,
      });
      const id = feature.getId();
      if (activeLayerType.value === "land") {
        landLotStore.updateLandLot(id, {
          geometry,
          updatedAt,
          updatedBy: authStore.roleName,
        });
      } else if (activeLayerType.value === "work") {
        workLotStore.updateWorkLot(id, {
          geometry,
          updatedAt,
          updatedBy: authStore.roleName,
        });
      }
    });
    modifyBackup.clear();
  };

  const handleSelect = (event) => {
    if (uiStore.tool !== "PAN") return;
    const selected = event.selected[0];
    if (!selected) {
      uiStore.clearSelection();
      refreshHighlights();
      return;
    }
    const layerType = selected.get("layerType");
    const refId = selected.get("refId") || selected.getId();
    if (layerType === "land") {
      uiStore.selectLandLot(refId);
      if (clearTaskSelection) clearTaskSelection();
    } else {
      uiStore.selectWorkLot(refId);
    }
  };

  const handleDeleteSelect = (event) => {
    const selected = event.selected[0];
    if (!selected) return;
    const id = selected.getId();
    const layerType = activeLayerType.value;
    if (!layerType) return;
    ElMessageBox.confirm(`Delete ${id}?`, "Confirm", { type: "warning" })
      .then(() => {
        if (layerType === "land") {
          landLotStore.removeLandLot(id);
        } else {
          workLotStore.removeWorkLot(id);
        }
        uiStore.clearSelection();
        refreshHighlights();
      })
      .catch(() => {
        // user canceled
      })
      .finally(() => {
        event.target.getFeatures().clear();
      });
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
    drawInteraction.value = null;
    modifyInteraction.value = null;
    selectInteraction.value = null;
    snapInteraction.value = null;
  };

  const rebuildInteractions = () => {
    if (!mapRef.value) return;
    clearInteractions();

    if (uiStore.tool === "PAN") {
      const selectLayers = [workLayer, landLayer].filter(Boolean);
      selectInteraction.value = new Select({ layers: selectLayers });
      selectInteraction.value.set("managed", true);
      selectInteraction.value.on("select", handleSelect);
      mapRef.value.addInteraction(selectInteraction.value);
      return;
    }

    const layerType = activeLayerType.value;
    if (!layerType) return;

    const targetSource = layerType === "land" ? landSource : workSource;
    const targetLayer = layerType === "land" ? landLayer : workLayer;

    if (uiStore.tool === "DRAW") {
      drawInteraction.value = new Draw({ source: targetSource, type: "Polygon" });
      drawInteraction.value.set("managed", true);
      drawInteraction.value.on("drawstart", (event) => {
        draftFeature = event.feature;
        draftSource = targetSource;
        hasDraft.value = true;
      });
      drawInteraction.value.on("drawend", handleDrawEnd);
      mapRef.value.addInteraction(drawInteraction.value);
    }

    if (uiStore.tool === "MODIFY") {
      modifyInteraction.value = new Modify({ source: targetSource });
      modifyInteraction.value.set("managed", true);
      modifyInteraction.value.on("modifystart", (event) => {
        modifyBackup.clear();
        event.features.forEach((feature) => {
          const geometry = feature.getGeometry();
          if (geometry) {
            modifyBackup.set(feature.getId(), geometry.clone());
          }
        });
      });
      modifyInteraction.value.on("modifyend", handleModifyEnd);
      mapRef.value.addInteraction(modifyInteraction.value);
    }

    if (uiStore.tool === "DELETE") {
      selectInteraction.value = new Select({ layers: [targetLayer] });
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
        snapInteraction.value = new Snap({ source: landSource });
        snapInteraction.value.set("managed", true);
        mapRef.value.addInteraction(snapInteraction.value);
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
  };
};
