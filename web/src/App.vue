<template>
  <div class="app-shell">
    <AppHeader />
    <div class="app-body">
      <RouterView />
    </div>
  </div>
</template>

<script setup>
import { RouterView } from "vue-router";
import AppHeader from "./components/AppHeader.vue";
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-body {
  flex: 1;
  min-height: 0;
}
</style>
