import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/useAuthStore";
import MapPage from "../modules/map/MapPage.vue";
import AdminWorkLots from "../modules/admin/AdminWorkLots.vue";
import DashboardPage from "../modules/dashboard/DashboardPage.vue";
import LandBankWorkLotsPage from "../modules/landbank/LandBankWorkLotsPage.vue";
import LandBankSiteBoundariesPage from "../modules/landbank/LandBankSiteBoundariesPage.vue";
import UsersPage from "../modules/users/UsersPage.vue";

const routes = [
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", component: DashboardPage },
  { path: "/map", component: MapPage },
  { path: "/landbank", redirect: "/landbank/work-lots" },
  { path: "/landbank/work-lots", component: LandBankWorkLotsPage },
  { path: "/landbank/site-boundaries", component: LandBankSiteBoundariesPage },
  { path: "/users", component: UsersPage },
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
