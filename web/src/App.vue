<template>
  <div class="app-shell">
    <SideNav class="desktop-side-nav" />

    <el-drawer
      v-model="uiStore.mobileNavOpen"
      class="mobile-nav-drawer"
      direction="ltr"
      size="272px"
      :with-header="false"
    >
      <SideNav mobile />
    </el-drawer>

    <div class="main-area">
      <AppHeader />
      <div class="app-body">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted } from "vue";
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import SideNav from "./components/SideNav.vue";
import { useUiStore } from "./stores/useUiStore";

const uiStore = useUiStore();

const closeMobileNavOnDesktop = () => {
  if (typeof window === "undefined") return;
  if (window.innerWidth > 900) {
    uiStore.setMobileNavOpen(false);
  }
};

onMounted(() => {
  closeMobileNavOnDesktop();
  window.addEventListener("resize", closeMobileNavOnDesktop);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", closeMobileNavOnDesktop);
});
</script>

<style scoped>
.app-shell {
  display: flex;
  height: 100%;
}

.main-area {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.app-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--bg);
}

.app-shell :deep(.mobile-nav-drawer .el-drawer__body) {
  padding: 0;
}

@media (max-width: 900px) {
  .desktop-side-nav {
    display: none;
  }
}
</style>
