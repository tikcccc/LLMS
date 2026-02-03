<template>
  <div class="app-shell">
    <SideNav />
    <div class="main-area">
      <AppHeader />
      <div class="app-body">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
import SideNav from "./components/SideNav.vue";
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
</style>
