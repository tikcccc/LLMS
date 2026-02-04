import { ref, shallowRef } from "vue";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import XYZ from "ol/source/XYZ";
import { defaults as defaultControls } from "ol/control";

import { BASEMAP_URL, LABEL_URL, MAP_MIN_ZOOM } from "../../../shared/config/mapApi";
import { registerHK80, EPSG_2326 } from "../ol/projection";
import {
  createHK80TileGrid,
  HK80_RESOLUTIONS,
  HK80_MAX_ZOOM,
} from "../ol/tilegridHK80";

export const useMapCore = () => {
  const mapEl = ref(null);
  const mapRef = shallowRef(null);
  const basemapLayer = shallowRef(null);
  const labelLayer = shallowRef(null);

  const initMap = (layers = []) => {
    registerHK80();

    const tileGrid = createHK80TileGrid();

    basemapLayer.value = new TileLayer({
      source: new XYZ({
        url: BASEMAP_URL,
        crossOrigin: "anonymous",
        tileGrid,
        projection: EPSG_2326,
      }),
    });

    labelLayer.value = new TileLayer({
      source: new XYZ({
        url: LABEL_URL,
        crossOrigin: "anonymous",
        tileGrid,
        projection: EPSG_2326,
      }),
    });

    mapRef.value = new Map({
      target: mapEl.value,
      layers: [basemapLayer.value, labelLayer.value, ...layers],
      view: new View({
        projection: EPSG_2326,
        center: [835100, 815800],
        zoom: 12,
        minZoom: MAP_MIN_ZOOM,
        maxZoom: HK80_MAX_ZOOM,
        resolutions: HK80_RESOLUTIONS,
        constrainResolution: true,
      }),
      controls: defaultControls({ attribution: false }),
    });
  };

  return {
    mapEl,
    mapRef,
    basemapLayer,
    labelLayer,
    initMap,
  };
};
