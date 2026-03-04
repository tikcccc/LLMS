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
import { findSiteBoundaryIdsForGeometry } from "../utils/siteBoundaryMatch";

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
  let drawInteraction = null;
  let modifyInteraction = null;
  const selectInteraction = shallowRef(null);

  const modifySelectedId = ref(null);
  const hasPendingModify = ref(false);
  const pendingModifiedIds = new Set();
  let selectedModifyFeature = null;
  let modifyLayerType = null;

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
  const normalizeValue = (value) => String(value || "").trim();
  const normalizePartId = (value) => {
    const normalized = normalizeValue(value);
    if (!normalized) return "";
    if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
    return normalized;
  };
  const normalizeSectionId = (value) => {
    const normalized = normalizeValue(value);
    if (!normalized) return "";
    if (/^\d+[a-z]$/i.test(normalized)) return normalized.toUpperCase();
    return normalized;
  };
  const getPartOfSitesIdFromFeature = (feature) =>
    normalizePartId(feature?.get("partOfSitesLotId")) ||
    normalizePartId(feature?.get("partId")) ||
    normalizePartId(feature?.get("part_id")) ||
    normalizePartId(feature?.get("refId")) ||
    normalizePartId(feature?.getId?.()) ||
    "";
  const getPartOfSitesFeatureBySystemId = (systemId) => {
    const normalized = normalizeValue(systemId).toLowerCase();
    if (!normalized || !partOfSitesSource) return null;
    return (
      partOfSitesSource
        .getFeatures()
        .find(
          (feature) =>
            normalizeValue(feature.getId?.()).toLowerCase() === normalized
        ) || null
    );
  };
  const getSectionIdFromFeature = (feature) =>
    normalizeSectionId(feature?.get("sectionLotId")) ||
    normalizeSectionId(feature?.get("sectionId")) ||
    normalizeSectionId(feature?.get("section_id")) ||
    normalizeSectionId(feature?.get("refId")) ||
    normalizeSectionId(feature?.getId?.()) ||
    "";
  const getSectionFeatureBySystemId = (systemId) => {
    const normalized = normalizeValue(systemId).toLowerCase();
    if (!normalized || !sectionsSource) return null;
    return (
      sectionsSource
        .getFeatures()
        .find(
          (feature) =>
            normalizeValue(feature.getId?.()).toLowerCase() === normalized
        ) || null
    );
  };
  const buildManualPartOfSitesId = () => {
    const usedIds = new Set(
      (partOfSitesSource?.getFeatures() || [])
        .map((feature) => getPartOfSitesIdFromFeature(feature).toLowerCase())
        .filter(Boolean)
    );
    let sequence = 1;
    let candidate = "";
    do {
      candidate = `DRAW-${String(sequence).padStart(3, "0")}`;
      sequence += 1;
    } while (usedIds.has(candidate.toLowerCase()));
    return candidate;
  };
  const buildManualPartOfSitesSystemId = (partId) => {
    const token =
      normalizePartId(partId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "UNK";
    const usedSystemIds = new Set(
      (partOfSitesSource?.getFeatures() || [])
        .map((feature) =>
          normalizeValue(feature.get("partOfSitesSystemId") || feature.getId()).toUpperCase()
        )
        .filter(Boolean)
    );
    let sequence = 1;
    let candidate = "";
    do {
      candidate = `POS-MANUAL-${token}-${String(sequence).padStart(3, "0")}`;
      sequence += 1;
    } while (usedSystemIds.has(candidate));
    return candidate;
  };
  const buildManualSectionId = () => {
    const usedIds = new Set(
      (sectionsSource?.getFeatures() || [])
        .map((feature) => getSectionIdFromFeature(feature).toLowerCase())
        .filter(Boolean)
    );
    let sequence = 1;
    let candidate = "";
    do {
      candidate = `SEC-${String(sequence).padStart(3, "0")}`;
      sequence += 1;
    } while (usedIds.has(candidate.toLowerCase()));
    return candidate;
  };
  const buildManualSectionSystemId = (sectionId) => {
    const token =
      normalizeSectionId(sectionId).replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || "UNK";
    const usedSystemIds = new Set(
      (sectionsSource?.getFeatures() || [])
        .map((feature) =>
          normalizeValue(feature.get("sectionSystemId") || feature.getId()).toUpperCase()
        )
        .filter(Boolean)
    );
    let sequence = 1;
    let candidate = "";
    do {
      candidate = `SOW-MANUAL-${token}-${String(sequence).padStart(3, "0")}`;
      sequence += 1;
    } while (usedSystemIds.has(candidate));
    return candidate;
  };
  const ensurePartOfSitesFeatureMeta = (feature) => {
    if (!feature) return null;
    const partId = getPartOfSitesIdFromFeature(feature) || buildManualPartOfSitesId();
    const systemId =
      normalizeValue(feature.get("partOfSitesSystemId")) ||
      buildManualPartOfSitesSystemId(partId);
    feature.setId(systemId);
    feature.set("partId", partId);
    feature.set("partGroup", normalizeValue(feature.get("partGroup")) || "Manual Draw");
    feature.set("partOfSitesLotId", partId);
    feature.set(
      "partOfSitesLotLabel",
      normalizeValue(feature.get("partOfSitesLotLabel")) || partId
    );
    feature.set("partOfSitesSystemId", systemId);
    feature.set(
      "partOfSitesGroup",
      normalizeValue(feature.get("partOfSitesGroup")) ||
        normalizeValue(feature.get("partGroup")) ||
        "Manual Draw"
    );
    feature.set(
      "accessDate",
      normalizeValue(feature.get("accessDate") || feature.get("access_date"))
    );
    const areaValue = Number(feature.get("area"));
    if (!Number.isFinite(areaValue) || areaValue <= 0) {
      const geometry = feature.getGeometry();
      const geometryArea =
        geometry && typeof geometry.getArea === "function"
          ? Math.abs(geometry.getArea())
          : 0;
      if (geometryArea > 0) {
        feature.set("area", geometryArea);
      }
    }
    feature.set("layerType", "partOfSites");
    feature.set("refId", partId);
    return { partId, systemId };
  };
  const ensureSectionFeatureMeta = (feature) => {
    if (!feature) return null;
    const sectionId = getSectionIdFromFeature(feature) || buildManualSectionId();
    const systemId =
      normalizeValue(feature.get("sectionSystemId")) ||
      buildManualSectionSystemId(sectionId);
    feature.setId(systemId);
    feature.set("sectionId", sectionId);
    feature.set("sectionLotId", sectionId);
    feature.set(
      "sectionLotLabel",
      normalizeValue(feature.get("sectionLotLabel") || feature.get("sectionLabel")) || sectionId
    );
    feature.set(
      "sectionGroup",
      normalizeValue(feature.get("sectionGroup") || feature.get("section_group")) || "Manual Draw"
    );
    feature.set("sectionSystemId", systemId);
    feature.set(
      "completionDate",
      normalizeValue(feature.get("completionDate") || feature.get("completion_date"))
    );
    const relatedPartIdsRaw =
      feature.get("relatedPartIds") || feature.get("relatedPartLotIds") || feature.get("partIds");
    const relatedPartIds = Array.isArray(relatedPartIdsRaw)
      ? Array.from(
          new Set(
            relatedPartIdsRaw
              .map((item) => normalizePartId(item))
              .filter(Boolean)
          )
        )
      : [];
    feature.set("relatedPartIds", relatedPartIds);
    feature.set("partCount", relatedPartIds.length);
    const areaValue = Number(feature.get("area"));
    if (!Number.isFinite(areaValue) || areaValue <= 0) {
      const geometry = feature.getGeometry();
      const geometryArea =
        geometry && typeof geometry.getArea === "function"
          ? Math.abs(geometry.getArea())
          : 0;
      if (geometryArea > 0) {
        feature.set("area", geometryArea);
      }
    }
    feature.set("layerType", "section");
    feature.set("refId", sectionId);
    return { sectionId, systemId };
  };
  const notifyPartOfSitesSourceChange = () => {
    onPartOfSitesSourceChange?.();
  };
  const notifySectionsSourceChange = () => {
    onSectionsSourceChange?.();
  };

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
    if (showSiteBoundaryDialog) {
      showSiteBoundaryDialog.value = false;
    }
    hasDraft.value = false;
  };

  const clearScopeQuery = () => {
    scopeQuerySource.clear(true);
    onScopeQueryResult?.({
      workLotIds: [],
      siteBoundaryIds: [],
      partOfSitesIds: [],
      sectionIds: [],
    });
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
    const findFeatureById = (id) =>
      getWorkFeatureById?.(id) ||
      getSiteBoundaryFeatureById?.(id) ||
      getSectionFeatureBySystemId(id) ||
      getPartOfSitesFeatureBySystemId(id);
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
    pendingModifiedIds.clear();
    selectedModifyFeature = null;
    modifyLayerType = null;
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
    (workSources || []).forEach((source) => {
      source?.getFeatures().forEach((feature) => {
        if (!featureIntersectsScope(feature, scopeGeometry)) return;
        const id = feature.get("refId") || feature.getId();
        if (id !== null && id !== undefined) {
          workLotIds.push(String(id));
        }
      });
    });

    const siteBoundaryIds = [];
    siteBoundarySource?.getFeatures().forEach((feature) => {
      if (!featureIntersectsScope(feature, scopeGeometry)) return;
      const id = feature.get("refId") || feature.getId();
      if (id !== null && id !== undefined) {
        siteBoundaryIds.push(String(id));
      }
    });

    const partOfSitesIds = [];
    partOfSitesSource?.getFeatures().forEach((feature) => {
      if (!featureIntersectsScope(feature, scopeGeometry)) return;
      const id =
        feature.get("partOfSitesLotId") ||
        feature.get("partId") ||
        feature.get("part_id") ||
        feature.get("refId") ||
        feature.getId();
      if (id !== null && id !== undefined) {
        partOfSitesIds.push(String(id));
      }
    });
    const sectionIds = [];
    sectionsSource?.getFeatures().forEach((feature) => {
      if (!featureIntersectsScope(feature, scopeGeometry)) return;
      const id =
        feature.get("sectionLotId") ||
        feature.get("sectionId") ||
        feature.get("section_id") ||
        feature.get("refId") ||
        feature.getId();
      if (id !== null && id !== undefined) {
        sectionIds.push(String(id));
      }
    });

    return {
      workLotIds: Array.from(new Set(workLotIds)),
      siteBoundaryIds: Array.from(new Set(siteBoundaryIds)),
      partOfSitesIds: Array.from(new Set(partOfSitesIds)),
      sectionIds: Array.from(new Set(sectionIds)),
    };
  };

  const handleScopeDrawEnd = (event) => {
    draftFeature = null;
    draftSource = null;
    hasDraft.value = false;

    const geometry = event.feature?.getGeometry();
    if (!geometry) {
      onScopeQueryResult?.({
        workLotIds: [],
        siteBoundaryIds: [],
        partOfSitesIds: [],
        sectionIds: [],
      });
      return;
    }

    onScopeQueryResult?.(collectScopeMatches(geometry));
  };

  const handlePolygonDrawEnd = (event) => {
    draftFeature = event.feature;
    hasDraft.value = true;
    if (activeLayerType.value === "partOfSites") {
      const meta = ensurePartOfSitesFeatureMeta(event.feature);
      if (uiStore.partOfSitesFilterMode === "custom" && meta?.partId) {
        uiStore.ensureMapSelectedId("partOfSites", meta.partId);
      }
      pendingGeometry.value = null;
      draftFeature = null;
      draftSource = null;
      hasDraft.value = false;
      uiStore.selectPartOfSite(meta?.partId || null);
      clearHighlightOverride();
      notifyPartOfSitesSourceChange();
      return;
    }
    if (activeLayerType.value === "section") {
      const meta = ensureSectionFeatureMeta(event.feature);
      if (uiStore.sectionFilterMode === "custom" && meta?.sectionId) {
        uiStore.ensureMapSelectedId("section", meta.sectionId);
      }
      pendingGeometry.value = null;
      draftFeature = null;
      draftSource = null;
      hasDraft.value = false;
      uiStore.selectSection(meta?.sectionId || null);
      clearHighlightOverride();
      notifySectionsSourceChange();
      return;
    }
    const geometry = format.writeGeometryObject(event.feature.getGeometry(), {
      dataProjection: EPSG_2326,
      featureProjection: EPSG_2326,
    });
    pendingGeometry.value = geometry;
    if (activeLayerType.value === "work") {
      showWorkDialog.value = true;
    } else if (activeLayerType.value === "siteBoundary") {
      onSiteBoundaryDrawStart?.();
      if (showSiteBoundaryDialog) {
        showSiteBoundaryDialog.value = true;
      }
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
    } else if (layerType === "partOfSites") {
      const clickedCoordinate = event.mapBrowserEvent?.coordinate;
      const resolvedPartId =
        typeof resolvePartOfSitesIdAtCoordinate === "function"
          ? normalizePartId(resolvePartOfSitesIdAtCoordinate(clickedCoordinate))
          : "";
      uiStore.selectPartOfSite(resolvedPartId || getPartOfSitesIdFromFeature(selected) || refId);
    } else if (layerType === "section") {
      const clickedCoordinate = event.mapBrowserEvent?.coordinate;
      const resolvedSectionId =
        typeof resolveSectionIdAtCoordinate === "function"
          ? normalizeSectionId(resolveSectionIdAtCoordinate(clickedCoordinate))
          : "";
      uiStore.selectSection(resolvedSectionId || getSectionIdFromFeature(selected) || refId);
    } else {
      return;
    }
    clearHighlightOverride();
  };

  const handleDeleteSelect = (event) => {
    const selected = event.selected[0];
    if (!selected) return;
    const id = selected.getId();
    const layerType = selected.get("layerType") || activeLayerType.value;
    if (!layerType) return;
    setHighlightFeature(layerType, selected);
    const partId = getPartOfSitesIdFromFeature(selected);
    const sectionId = getSectionIdFromFeature(selected);
    const displayId =
      layerType === "partOfSites"
        ? partId || id
        : layerType === "section"
          ? sectionId || id
          : id;
    const label =
      layerType === "siteBoundary"
        ? "site boundary"
        : layerType === "partOfSites"
          ? "part of site"
          : layerType === "section"
            ? "section"
          : "work lot";
    ElMessageBox.confirm(`Delete ${label} ${displayId}?`, "Confirm", { type: "warning" })
      .then(() => {
        if (layerType === "siteBoundary") {
          siteBoundaryStore.removeSiteBoundary(id);
        } else if (layerType === "partOfSites") {
          partOfSitesSource?.removeFeature(selected);
          notifyPartOfSitesSourceChange();
        } else if (layerType === "section") {
          sectionsSource?.removeFeature(selected);
          notifySectionsSourceChange();
        } else {
          workLotStore.removeWorkLot(id);
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

    if (!selected) {
      if (!selectedModifyFeature) {
        return;
      }
      features.clear();
      features.push(selectedModifyFeature);
      return;
    }

    const layerType = selected.get("layerType");
    if (
      layerType !== "work" &&
      layerType !== "siteBoundary" &&
      layerType !== "partOfSites" &&
      layerType !== "section"
    ) {
      return;
    }

    selectedModifyFeature = selected;
    const refId =
      layerType === "partOfSites"
        ? getPartOfSitesIdFromFeature(selected) || selected.get("refId") || selected.getId()
        : layerType === "section"
          ? getSectionIdFromFeature(selected) || selected.get("refId") || selected.getId()
        : selected.get("refId") || selected.getId();
    modifySelectedId.value = refId;
    if (layerType === "work") {
      uiStore.selectWorkLot(refId);
    } else if (layerType === "siteBoundary") {
      uiStore.selectSiteBoundary(refId);
    } else if (layerType === "section") {
      uiStore.selectSection(refId);
    } else {
      uiStore.selectPartOfSite(refId);
    }
    setHighlightFeature(layerType, selected);
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
              dataProjection: EPSG_2326,
              featureProjection: EPSG_2326,
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
            const relatedSiteBoundaryIds = findSiteBoundaryIdsForGeometry(
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
    if (uiStore.tool !== "MODIFY") {
      modifyLayerType = null;
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
    if (uiStore.tool === "MODIFY" && modifyLayerType && modifyLayerType !== layerType) {
      // Switching edit target layer during modify should not keep stale selected feature.
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
      modifyLayerType = layerType;
      selectInteraction.value = new Select({ layers: targetLayers, style: null });
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
      selectInteraction.value = new Select({ layers: targetLayers, style: null });
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
