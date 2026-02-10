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

const LEGACY_MOCK_DATA_KEYS = ["ND_LLM_V1_worklots", "ND_LLM_V1_tasks"];
const MOCK_DATA_CLEANUP_FLAG = "ND_LLM_V1_mock_data_cleanup_done";

if (!localStorage.getItem(MOCK_DATA_CLEANUP_FLAG)) {
  LEGACY_MOCK_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  localStorage.setItem(MOCK_DATA_CLEANUP_FLAG, "1");
}

const app = createApp(App);
const pinia = createPinia();

pinia.use(piniaPersist);

useWorkLotStore(pinia).normalizeLegacyWorkLots();
useUiStore(pinia).normalizeLegacyState();
useSiteBoundaryStore(pinia).normalizeLegacySiteBoundaries();

app.use(pinia);
app.use(router);
app.use(ElementPlus);
app.mount("#app");
