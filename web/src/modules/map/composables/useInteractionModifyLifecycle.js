import { ref } from "vue";
import { ElMessageBox } from "element-plus";

export const useInteractionModifyLifecycle = ({
  uiStore,
  canEditLayer,
  activeLayerType,
  authStore,
  format,
  projectionCode = "EPSG:2326",
  nowIso = () => new Date().toISOString(),
  siteBoundarySource,
  getWorkFeatureById,
  getSiteBoundaryFeatureById,
  getPartOfSitesFeatureBySystemId,
  getSectionFeatureBySystemId,
  workLotStore,
  siteBoundaryStore,
  resolveSiteBoundaryIdsForGeometry,
  notifyPartOfSitesSourceChange,
  notifySectionsSourceChange,
  clearHighlightOverride,
  resetModifyLayerType,
  fallbackTool,
}) => {
  const modifySelectedId = ref(null);
  const hasPendingModify = ref(false);
  const selectedModifyFeature = ref(null);

  const pendingModifiedIds = new Set();
  const modifyBackup = new Map();

  const restoreModifyBackup = () => {
    if (!modifyBackup.size) return;
    const findFeatureById = (id) =>
      getWorkFeatureById?.(id) ||
      getSiteBoundaryFeatureById?.(id) ||
      getSectionFeatureBySystemId?.(id) ||
      getPartOfSitesFeatureBySystemId?.(id);

    modifyBackup.forEach((geometry, id) => {
      const feature = findFeatureById(id);
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
    selectedModifyFeature.value = null;
    pendingModifiedIds.clear();
    modifyBackup.clear();
    if (typeof resetModifyLayerType === "function") {
      resetModifyLayerType();
    }
  };

  const markModifiedFeatures = (features = []) => {
    if (!features || typeof features.forEach !== "function") return;
    features.forEach((feature) => {
      const id = feature?.getId?.();
      if (id === null || id === undefined) return;
      pendingModifiedIds.add(id);
    });
    hasPendingModify.value = pendingModifiedIds.size > 0;
  };

  const saveModify = () => {
    if (!modifySelectedId.value) return;
    const layerType = activeLayerType.value;
    if (!layerType) return;

    ElMessageBox.confirm("Save changes?", "Confirm", { type: "warning" })
      .then(() => {
        if (pendingModifiedIds.size > 0) {
          const updatedAt = nowIso();
          pendingModifiedIds.forEach((id) => {
            const feature =
              layerType === "siteBoundary"
                ? getSiteBoundaryFeatureById?.(id)
                : layerType === "partOfSites"
                  ? getPartOfSitesFeatureBySystemId?.(id)
                  : layerType === "section"
                    ? getSectionFeatureBySystemId?.(id)
                    : getWorkFeatureById?.(id);
            if (!feature) return;
            const featureGeometry = feature.getGeometry();
            if (!featureGeometry) return;
            const geometry = format.writeGeometryObject(featureGeometry, {
              dataProjection: projectionCode,
              featureProjection: projectionCode,
            });
            if (layerType === "siteBoundary") {
              const area =
                typeof featureGeometry.getArea === "function"
                  ? featureGeometry.getArea()
                  : 0;
              siteBoundaryStore.updateSiteBoundary(id, {
                geometry,
                area,
              });
              return;
            }
            if (layerType === "partOfSites") {
              feature.setGeometry(featureGeometry);
              const currentArea = Number(feature.get("area"));
              if (!Number.isFinite(currentArea) || currentArea <= 0) {
                const area =
                  typeof featureGeometry.getArea === "function"
                    ? Math.abs(featureGeometry.getArea())
                    : 0;
                if (area > 0) {
                  feature.set("area", area);
                }
              }
              return;
            }
            if (layerType === "section") {
              feature.setGeometry(featureGeometry);
              const currentArea = Number(feature.get("area"));
              if (!Number.isFinite(currentArea) || currentArea <= 0) {
                const area =
                  typeof featureGeometry.getArea === "function"
                    ? Math.abs(featureGeometry.getArea())
                    : 0;
                if (area > 0) {
                  feature.set("area", area);
                }
              }
              return;
            }
            const relatedSiteBoundaryIds = resolveSiteBoundaryIdsForGeometry(
              featureGeometry,
              siteBoundarySource
            );
            workLotStore.updateWorkLot(id, {
              geometry,
              relatedSiteBoundaryIds,
              updatedAt,
              updatedBy: authStore.roleName,
            });
          });
        }

        if (layerType === "partOfSites") {
          notifyPartOfSitesSourceChange();
        }
        if (layerType === "section") {
          notifySectionsSourceChange();
        }
        clearModifyState();
        uiStore.clearSelection();
        clearHighlightOverride();
        uiStore.setTool(canEditLayer.value ? "MODIFY" : fallbackTool());
      })
      .catch(() => {
        cancelModify();
      });
  };

  const cancelModify = () => {
    restoreModifyBackup();
    clearModifyState();
    clearHighlightOverride();
    uiStore.setTool(canEditLayer.value ? "MODIFY" : fallbackTool());
  };

  return {
    modifySelectedId,
    hasPendingModify,
    selectedModifyFeature,
    modifyBackup,
    restoreModifyBackup,
    clearModifyState,
    markModifiedFeatures,
    saveModify,
    cancelModify,
  };
};
