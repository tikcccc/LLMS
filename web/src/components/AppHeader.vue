<template>
  <header class="app-header">
    <div class="brand">
      <div class="title">Digital Land Management Platform</div>
    </div>

    <nav class="top-nav" aria-label="Primary navigation">
      <button
        v-for="item in primaryTopNavItems"
        :key="item.path"
        type="button"
        class="top-nav-item"
        :class="{ active: isActive(item.path) }"
        @click="go(item.path)"
      >
        {{ item.label }}
      </button>

      <div
        ref="landListsGroupRef"
        class="top-nav-group"
        :class="{ open: landListsOpen, active: isLandListsActive }"
      >
        <button
          type="button"
          class="top-nav-item top-nav-group-trigger"
          :class="{ active: isLandListsActive || landListsOpen }"
          aria-haspopup="menu"
          :aria-expanded="String(landListsOpen)"
          @click="toggleLandLists"
          @keydown.esc.prevent="closeLandLists"
        >
          <span>Land Lists</span>
          <svg class="top-nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <div class="top-nav-submenu" role="menu" aria-label="Land Lists submenu">
          <button
            v-for="item in landListNavItems"
            :key="item.path"
            type="button"
            class="top-nav-submenu-item"
            :class="{ active: isActive(item.path) }"
            role="menuitem"
            @click="go(item.path)"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <button
        v-for="item in trailingTopNavItems"
        :key="item.path"
        type="button"
        class="top-nav-item"
        :class="{ active: isActive(item.path) }"
        @click="go(item.path)"
      >
        {{ item.label }}
      </button>
    </nav>

    <div class="actions">
      <el-button size="small" @click="resetDemoData">Reset Demo</el-button>
      <button
        class="notif"
        type="button"
        :aria-label="unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'"
        @click="openNotificationCenter"
      >
        <span v-if="unreadCount > 0" class="dot">{{ unreadBadgeText }}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M12 3a4 4 0 0 0-4 4v3.5l-1.4 2.8A1 1 0 0 0 7.5 15h9a1 1 0 0 0 .9-1.4L16 10.5V7a4 4 0 0 0-4-4z"/>
          <path d="M9.5 18a2.5 2.5 0 0 0 5 0"/>
        </svg>
      </button>
      <el-tag v-if="authStore.role === 'FIELD_STAFF'" type="info" effect="plain">Read-only</el-tag>
      <span class="role-label">Role</span>
      <el-select v-model="selectedRole" size="small" style="width: 160px">
        <el-option v-for="role in roleOptions" :key="role.value" :label="role.label" :value="role.value" />
      </el-select>
    </div>
  </header>

  <NotificationCenterDrawer v-model="showNotificationCenter" />
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { useAuthStore } from "../stores/useAuthStore";
import { useNotificationStore } from "../stores/useNotificationStore";
import { ROLE_OPTIONS } from "../shared/utils/role";
import { LAND_LIST_NAV_ITEMS, TOP_NAV_ITEMS } from "../shared/config/navigation";
import NotificationCenterDrawer from "./NotificationCenterDrawer.vue";

const authStore = useAuthStore();
const notificationStore = useNotificationStore();
const route = useRoute();
const router = useRouter();
const roleOptions = ROLE_OPTIONS;
const topNavItems = TOP_NAV_ITEMS;
const landListNavItems = LAND_LIST_NAV_ITEMS;
const landListsGroupRef = ref(null);
const landListsOpen = ref(false);
const showNotificationCenter = ref(false);
const primaryTopNavItems = computed(() => topNavItems.slice(0, 2));
const trailingTopNavItems = computed(() => topNavItems.slice(2));

const selectedRole = computed({
  get: () => authStore.role,
  set: (value) => authStore.switchRole(value),
});
const unreadCount = computed(() => notificationStore.unreadCount);
const unreadBadgeText = computed(() => (unreadCount.value > 99 ? "99+" : String(unreadCount.value)));
const isLandListsActive = computed(() =>
  landListNavItems.some((item) => isActive(item.path))
);

const isActive = (path) => route.path.startsWith(path);
const go = (path) => {
  closeLandLists();
  if (route.path === path) return;
  router.push(path);
};

const closeLandLists = () => {
  landListsOpen.value = false;
};

const toggleLandLists = () => {
  landListsOpen.value = !landListsOpen.value;
};

const handleDocumentPointerDown = (event) => {
  const groupEl = landListsGroupRef.value;
  if (!groupEl || groupEl.contains(event.target)) return;
  closeLandLists();
};

const openNotificationCenter = () => {
  showNotificationCenter.value = true;
};

const resetDemoData = () => {
  ElMessageBox.confirm("Reset all demo data? This will clear local data and reload.", "Reset Demo", {
    type: "warning",
    confirmButtonText: "Reset",
    cancelButtonText: "Cancel",
  })
    .then(() => {
      [
        "ND_LLM_V1_auth",
        "ND_LLM_V1_landlots",
        "ND_LLM_V1_worklots",
        "ND_LLM_V1_site_boundaries",
        "ND_LLM_V1_tasks",
        "ND_LLM_V1_ui",
        "ND_LLM_V1_notifications",
      ].forEach((key) => localStorage.removeItem(key));
      ElMessage.success("Demo data reset. Reloading...");
      window.location.reload();
    })
    .catch(() => {});
};

onMounted(() => {
  notificationStore.refreshNotifications();
  document.addEventListener("pointerdown", handleDocumentPointerDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
});

watch(
  () => route.path,
  () => {
    closeLandLists();
  }
);
</script>

<style scoped>
.app-header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 16px 24px;
  background: #ffffff;
  border-bottom: 1px solid var(--border);
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.03);
}

.brand .title {
  font-size: 20px;
  font-weight: 600;
}

.brand {
  display: flex;
  align-items: center;
  min-width: 0;
}

.brand .subtitle {
  font-size: 12px;
  color: var(--muted);
}

.top-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: visible;
  padding-bottom: 2px;
  min-width: 0;
  flex-wrap: nowrap;
}

.top-nav::-webkit-scrollbar {
  height: 6px;
}

.top-nav::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.34);
  border-radius: 999px;
}

.top-nav-item {
  border: 1px solid var(--border);
  background: #ffffff;
  color: #334155;
  border-radius: 999px;
  min-height: 32px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
}

.top-nav-item:hover {
  border-color: rgba(15, 118, 110, 0.35);
  color: #0f766e;
}

.top-nav-item.active {
  border-color: rgba(15, 118, 110, 0.45);
  background: rgba(15, 118, 110, 0.12);
  color: #0f766e;
}

.top-nav-group {
  position: relative;
  flex: 0 0 auto;
}

.top-nav-group-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.top-nav-chevron {
  width: 14px;
  height: 14px;
  transition: transform 0.2s ease;
}

.top-nav-group.open .top-nav-chevron {
  transform: rotate(180deg);
}

.top-nav-submenu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  min-width: 220px;
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #ffffff;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.14);
  z-index: 30;
}

.top-nav-group.open .top-nav-submenu {
  display: flex;
}

@media (hover: hover) and (pointer: fine) {
  .top-nav-group:hover .top-nav-submenu {
    display: flex;
  }
}

.top-nav-submenu-item {
  width: 100%;
  border: 0;
  background: transparent;
  border-radius: 10px;
  padding: 8px 10px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #334155;
  cursor: pointer;
}

.top-nav-submenu-item:hover {
  background: #f1f5f9;
  color: #0f766e;
}

.top-nav-submenu-item.active {
  background: #e6f4f1;
  color: #0f766e;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-self: end;
}

.notif {
  position: relative;
  border: 1px solid var(--border);
  background: white;
  border-radius: 12px;
  padding: 6px 8px;
  min-width: 34px;
  min-height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.notif svg {
  width: 18px;
  height: 18px;
}

.notif .dot {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #ef4444;
  border: 2px solid white;
  border-radius: 999px;
  color: #ffffff;
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
}

.role-label {
  font-size: 12px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

@media (max-width: 1100px) {
  .app-header {
    grid-template-columns: 1fr;
  }

  .top-nav {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }

  .actions {
    justify-self: start;
    flex-wrap: wrap;
    order: 2;
  }

  .top-nav-submenu {
    position: static;
    margin-top: 6px;
    box-shadow: none;
    border: 1px solid var(--border);
  }
}

@media (max-width: 900px) {
  .app-header {
    padding: 12px 12px;
    gap: 10px;
  }

  .brand .title {
    font-size: 17px;
  }

  .role-label {
    display: none;
  }

  .actions {
    gap: 8px;
  }

  .top-nav-item {
    min-height: 30px;
    padding: 0 12px;
  }
}
</style>
