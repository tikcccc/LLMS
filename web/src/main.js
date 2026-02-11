import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPersist from "pinia-plugin-persistedstate";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { useWorkLotStore } from "./stores/useWorkLotStore";
import { useUiStore } from "./stores/useUiStore";
import { useSiteBoundaryStore } from "./stores/useSiteBoundaryStore";
import { parseWorkLotGeojson } from "./shared/utils/worklotGeojson";
import { parseSiteBoundaryJson } from "./shared/utils/siteBoundaryJson";

const LEGACY_MOCK_DATA_KEYS = ["ND_LLM_V1_worklots", "ND_LLM_V1_tasks"];
const MOCK_DATA_CLEANUP_FLAG = "ND_LLM_V1_mock_data_cleanup_done";
const AUTO_LOAD_WORKLOTS_URL = "/data/work-lots.geojson";
const AUTO_LOAD_SITE_BOUNDARIES_URL = "/data/site-boundaries.json";

if (!localStorage.getItem(MOCK_DATA_CLEANUP_FLAG)) {
  LEGACY_MOCK_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(MOCK_DATA_CLEANUP_FLAG, "1");
}

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPersist);

const fetchJsonOptional = async (url) => {
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`[bootstrap] failed to load ${url}`, error);
    return null;
  }
};

const mountApp = async () => {
  const workLotStore = useWorkLotStore(pinia);
  const uiStore = useUiStore(pinia);
  const siteBoundaryStore = useSiteBoundaryStore(pinia);

  workLotStore.normalizeLegacyWorkLots();
  uiStore.normalizeLegacyState();
  siteBoundaryStore.normalizeLegacySiteBoundaries();

  const [workLotJson, siteBoundaryJson] = await Promise.all([
    fetchJsonOptional(AUTO_LOAD_WORKLOTS_URL),
    fetchJsonOptional(AUTO_LOAD_SITE_BOUNDARIES_URL),
  ]);

  if (workLotJson) {
    try {
      const parsedWorkLots = parseWorkLotGeojson(workLotJson);
      workLotStore.replaceWorkLots(parsedWorkLots);
      console.info(
        `[bootstrap] loaded ${parsedWorkLots.length} work lots from ${AUTO_LOAD_WORKLOTS_URL}`
      );
    } catch (error) {
      console.warn(`[bootstrap] invalid work lot file: ${AUTO_LOAD_WORKLOTS_URL}`, error);
    }
  }

  if (siteBoundaryJson) {
    try {
      const parsedSiteBoundaries = parseSiteBoundaryJson(siteBoundaryJson);
      siteBoundaryStore.mergeBoundaries(parsedSiteBoundaries);
      console.info(
        `[bootstrap] loaded ${parsedSiteBoundaries.length} site boundaries from ${AUTO_LOAD_SITE_BOUNDARIES_URL}`
      );
    } catch (error) {
      console.warn(
        `[bootstrap] invalid site boundary file: ${AUTO_LOAD_SITE_BOUNDARIES_URL}`,
        error
      );
    }
  }

  app.use(pinia);
  app.use(router);
  app.use(ElementPlus);
  app.mount("#app");
};

mountApp();
