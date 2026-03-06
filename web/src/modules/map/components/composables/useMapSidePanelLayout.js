import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

const MOBILE_BREAKPOINT = 900;
const PANEL_WIDTH_STORAGE_KEY = "ND_LLM_V1_map_side_panel_width";
const PANEL_COLLAPSE_STORAGE_KEY = "ND_LLM_V1_map_side_panel_collapsed";

const PANEL_MIN_WIDTH = 280;
const PANEL_DEFAULT_WIDTH = 360;
const PANEL_MAX_WIDTH = 560;
const PANEL_COLLAPSED_WIDTH = 52;

const TAB_TITLES = {
  layers: "Layers",
  scope: "Scope Results",
  partofsites: "Part of Sites",
  sections: "Sections",
  worklots: "Work Lots",
  siteboundaries: "Site Boundaries",
};

const readStoredSize = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
};

const readStoredBoolean = (key, fallback = false) => {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === "1") return true;
  if (raw === "0") return false;
  return fallback;
};

const clampPanelWidth = (width) => {
  if (!Number.isFinite(width)) return PANEL_DEFAULT_WIDTH;
  if (typeof window === "undefined") {
    return Math.min(Math.max(width, PANEL_MIN_WIDTH), PANEL_MAX_WIDTH);
  }
  const viewportMax = Math.max(PANEL_MIN_WIDTH, window.innerWidth - 56);
  const hardMax = Math.min(PANEL_MAX_WIDTH, viewportMax);
  return Math.min(Math.max(width, PANEL_MIN_WIDTH), hardMax);
};

export const useMapSidePanelLayout = ({ props, emit }) => {
  const mobilePanelOpen = ref(true);
  const isMobile = ref(false);
  const isDesktopCollapsed = ref(false);

  const partOfSitesExpanded = ref(true);
  const sectionsExpanded = ref(true);
  const siteBoundariesExpanded = ref(true);
  const workLotsExpanded = ref(true);

  const mobilePanelTitle = computed(() => TAB_TITLES[props.leftTab] || "Panel");

  const panelWidth = ref(
    clampPanelWidth(readStoredSize(PANEL_WIDTH_STORAGE_KEY, PANEL_DEFAULT_WIDTH))
  );
  const isResizing = ref(false);

  const panelStyle = computed(() => ({
    "--panel-width": `${
      !isMobile.value && isDesktopCollapsed.value
        ? PANEL_COLLAPSED_WIDTH
        : panelWidth.value
    }px`,
  }));

  let dragStartX = 0;
  let dragStartWidth = panelWidth.value;
  let mobileQueryList = null;

  const persistPanelSize = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(PANEL_WIDTH_STORAGE_KEY, String(panelWidth.value));
  };

  const persistPanelCollapsed = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      PANEL_COLLAPSE_STORAGE_KEY,
      isDesktopCollapsed.value ? "1" : "0"
    );
  };

  const handleResizeMove = (event) => {
    if (!isResizing.value) return;
    const deltaX = event.clientX - dragStartX;
    panelWidth.value = clampPanelWidth(dragStartWidth + deltaX);
  };

  const stopResize = () => {
    if (!isResizing.value) return;
    isResizing.value = false;
    window.removeEventListener("pointermove", handleResizeMove);
    window.removeEventListener("pointerup", stopResize);
    window.removeEventListener("pointercancel", stopResize);
    persistPanelSize();
  };

  const startResize = (event) => {
    if (typeof window === "undefined" || window.innerWidth <= MOBILE_BREAKPOINT) return;
    if (isDesktopCollapsed.value) return;
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    isResizing.value = true;
    dragStartX = event.clientX;
    dragStartWidth = panelWidth.value;
    window.addEventListener("pointermove", handleResizeMove);
    window.addEventListener("pointerup", stopResize);
    window.addEventListener("pointercancel", stopResize);
  };

  const resetPanelSize = () => {
    panelWidth.value = clampPanelWidth(PANEL_DEFAULT_WIDTH);
    persistPanelSize();
  };

  const applyMobileMode = (mobile) => {
    isMobile.value = mobile;
    if (mobile) {
      mobilePanelOpen.value = false;
      stopResize();
      return;
    }
    mobilePanelOpen.value = true;
  };

  const toggleMobilePanel = () => {
    if (!isMobile.value) return;
    mobilePanelOpen.value = !mobilePanelOpen.value;
    if (!mobilePanelOpen.value) {
      emit("panel-close");
    }
  };

  const toggleDesktopCollapsed = () => {
    if (isMobile.value) return;
    isDesktopCollapsed.value = !isDesktopCollapsed.value;
    if (isDesktopCollapsed.value) {
      emit("panel-close");
    }
    stopResize();
    persistPanelCollapsed();
  };

  const togglePartOfSitesExpanded = () => {
    partOfSitesExpanded.value = !partOfSitesExpanded.value;
  };
  const toggleSectionsExpanded = () => {
    sectionsExpanded.value = !sectionsExpanded.value;
  };
  const toggleSiteBoundariesExpanded = () => {
    siteBoundariesExpanded.value = !siteBoundariesExpanded.value;
  };
  const toggleWorkLotsExpanded = () => {
    workLotsExpanded.value = !workLotsExpanded.value;
  };

  const closeMobilePanel = () => {
    if (!isMobile.value) return;
    if (!mobilePanelOpen.value) return;
    mobilePanelOpen.value = false;
    emit("panel-close");
  };

  const handleMobileMediaChange = (event) => {
    applyMobileMode(event.matches);
  };

  const handleWindowResize = () => {
    panelWidth.value = clampPanelWidth(panelWidth.value);
    persistPanelSize();
  };

  watch(
    () => props.leftTab,
    () => {
      if (isMobile.value) {
        mobilePanelOpen.value = true;
      }
    }
  );

  watch(
    () => props.hasScopeQuery,
    (value) => {
      if (!value && props.leftTab === "scope") {
        emit("update:leftTab", "layers");
      }
    }
  );

  onMounted(() => {
    if (typeof window === "undefined") return;
    isDesktopCollapsed.value = readStoredBoolean(PANEL_COLLAPSE_STORAGE_KEY, false);
    mobileQueryList = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    applyMobileMode(mobileQueryList.matches);
    if (typeof mobileQueryList.addEventListener === "function") {
      mobileQueryList.addEventListener("change", handleMobileMediaChange);
    } else if (typeof mobileQueryList.addListener === "function") {
      mobileQueryList.addListener(handleMobileMediaChange);
    }
    window.addEventListener("resize", handleWindowResize);
  });

  onBeforeUnmount(() => {
    stopResize();
    if (typeof window === "undefined") return;
    if (!mobileQueryList) return;
    if (typeof mobileQueryList.removeEventListener === "function") {
      mobileQueryList.removeEventListener("change", handleMobileMediaChange);
    } else if (typeof mobileQueryList.removeListener === "function") {
      mobileQueryList.removeListener(handleMobileMediaChange);
    }
    window.removeEventListener("resize", handleWindowResize);
  });

  return {
    mobilePanelOpen,
    isMobile,
    isResizing,
    isDesktopCollapsed,
    partOfSitesExpanded,
    sectionsExpanded,
    siteBoundariesExpanded,
    workLotsExpanded,
    mobilePanelTitle,
    panelStyle,
    startResize,
    resetPanelSize,
    toggleMobilePanel,
    toggleDesktopCollapsed,
    togglePartOfSitesExpanded,
    toggleSectionsExpanded,
    toggleSiteBoundariesExpanded,
    toggleWorkLotsExpanded,
    closeMobilePanel,
  };
};
