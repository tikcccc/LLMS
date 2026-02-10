<template>
  <header class="app-header">
    <div class="brand">
      <button class="menu-btn" type="button" aria-label="Open navigation menu" @click="uiStore.toggleMobileNav()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      <div class="title">Digital Land Management Platform</div>
    </div>

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
import { useRoute } from "vue-router";
import { ElMessageBox, ElMessage } from "element-plus";
import { useAuthStore } from "../stores/useAuthStore";
import { useUiStore } from "../stores/useUiStore";
import { ROLE_OPTIONS } from "../shared/utils/role";

const authStore = useAuthStore();
const uiStore = useUiStore();
const route = useRoute();
const roleOptions = ROLE_OPTIONS;

const selectedRole = computed({
  get: () => authStore.role,
  set: (value) => authStore.switchRole(value),
});

const isActive = (path) => route.path.startsWith(path);

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
  grid-template-columns: 1fr auto;
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
  gap: 10px;
}

.menu-btn {
  display: none;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: #ffffff;
  color: #334155;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.menu-btn svg {
  width: 18px;
  height: 18px;
}

.brand .subtitle {
  font-size: 12px;
  color: var(--muted);
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

  .actions {
    justify-self: start;
    flex-wrap: wrap;
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

  .menu-btn {
    display: inline-flex;
  }

  .role-label {
    display: none;
  }

  .actions {
    gap: 8px;
  }
}
</style>
