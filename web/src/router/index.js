import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/useAuthStore";
import MapPage from "../modules/map/MapPage.vue";
import AdminLandLots from "../modules/admin/AdminLandLots.vue";
import AdminWorkLots from "../modules/admin/AdminWorkLots.vue";

const routes = [
  { path: "/", redirect: "/map" },
  { path: "/map", component: MapPage },
  {
    path: "/admin/land-lots",
    component: AdminLandLots,
    meta: { requiresAdmin: true },
  },
  {
    path: "/admin/work-lots",
    component: AdminWorkLots,
    meta: { requiresAdmin: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  if (to.meta?.requiresAdmin) {
    const authStore = useAuthStore();
    if (authStore.role !== "SITE_ADMIN") {
      return "/map";
    }
  }
  return true;
});

export default router;
