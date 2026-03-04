<template>
  <header class="app-header">
    <div class="brand">
      <div class="title">Digital Land Management Platform</div>
    </div>

    <nav class="top-nav" aria-label="Primary navigation">
      <button
        v-for="item in topNavItems"
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
      <button class="notif" type="button" aria-label="Notifications">
        <span class="dot"></span>
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
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { useAuthStore } from "../stores/useAuthStore";
import { ROLE_OPTIONS } from "../shared/utils/role";
import { TOP_NAV_ITEMS } from "../shared/config/navigation";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const roleOptions = ROLE_OPTIONS;
const topNavItems = TOP_NAV_ITEMS;

const selectedRole = computed({
  get: () => authStore.role,
  set: (value) => authStore.switchRole(value),
});

const isActive = (path) => route.path.startsWith(path);
const go = (path) => {
  if (route.path === path) return;
  router.push(path);
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
      ].forEach((key) => localStorage.removeItem(key));
      ElMessage.success("Demo data reset. Reloading...");
      window.location.reload();
    })
    .catch(() => {});
};
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
  overflow-x: auto;
  padding-bottom: 2px;
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
  top: 6px;
  right: 6px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border: 2px solid white;
  border-radius: 50%;
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
  }

  .actions {
    justify-self: start;
    flex-wrap: wrap;
    order: 2;
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
