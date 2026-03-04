<template>
  <div class="app-shell">
    <div class="app-main">
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
</script>

<style scoped>
.app-shell {
  height: 100%;
}

.app-main {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 0;
}

.app-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: var(--bg);
}
</style>
