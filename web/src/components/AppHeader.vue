<template>
  <header class="app-header">
    <div class="brand">
      <div class="title">Land Lot Management Demo</div>
      <div class="subtitle">HK80 | CSDI Topographic Map (PNG + Label)</div>
    </div>

    <nav class="nav">
      <el-button
        size="small"
        :type="isActive('/map') ? 'primary' : 'default'"
        @click="go('/map')"
      >
        Map
      </el-button>
      <el-button
        size="small"
        :type="isActive('/admin/land-lots') ? 'primary' : 'default'"
        :disabled="!isAdmin"
        @click="go('/admin/land-lots', true)"
      >
        Admin Land Lots
      </el-button>
      <el-button
        size="small"
        :type="isActive('/admin/work-lots') ? 'primary' : 'default'"
        :disabled="!isAdmin"
        @click="go('/admin/work-lots', true)"
      >
        Admin Work Lots
      </el-button>
    </nav>

    <div class="actions">
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
import { useAuthStore } from "../stores/useAuthStore";
import { ROLE_OPTIONS } from "../shared/utils/role";

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const roleOptions = ROLE_OPTIONS;

const selectedRole = computed({
  get: () => authStore.role,
  set: (value) => authStore.switchRole(value),
});

const isAdmin = computed(() => authStore.role === "SITE_ADMIN");

const isActive = (path) => route.path.startsWith(path);

const go = (path, requiresAdmin = false) => {
  if (requiresAdmin && !isAdmin.value) return;
  router.push(path);
};
</script>

<style scoped>
.app-header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 16px;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(120deg, #fefce8, #ecfdf3);
  border-bottom: 1px solid var(--border);
}

.brand .title {
  font-size: 20px;
  font-weight: 600;
}

.brand .subtitle {
  font-size: 12px;
  color: var(--muted);
}

.nav {
  display: flex;
  gap: 8px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-self: end;
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
  }
}
</style>
