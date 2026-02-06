<template>
  <aside :class="['side-nav', { collapsed: uiStore.sidebarCollapsed }]">
    <div class="profile">
      <div class="avatar">{{ userInitials }}</div>
      <div v-if="!uiStore.sidebarCollapsed" class="profile-text">
        <div class="name">{{ currentUser.name }}</div>
        <div class="email">{{ currentUser.email }}</div>
      </div>
    </div>

    <nav class="nav">
      <button
        v-for="item in primaryItems"
        :key="item.path"
        type="button"
        :class="['nav-item', { active: isActive(item.path) }]"
        @click="go(item.path)"
        :title="uiStore.sidebarCollapsed ? item.label : ''"
      >
        <span class="nav-icon" v-html="item.icon"></span>
        <span v-if="!uiStore.sidebarCollapsed" class="nav-label">{{ item.label }}</span>
      </button>

      <div class="nav-section" v-if="!uiStore.sidebarCollapsed">Settings</div>
      <button
        v-for="item in settingsItems"
        :key="item.path"
        type="button"
        :class="['nav-item', { active: isActive(item.path) }]"
        @click="go(item.path)"
        :title="uiStore.sidebarCollapsed ? item.label : ''"
      >
        <span class="nav-icon" v-html="item.icon"></span>
        <span v-if="!uiStore.sidebarCollapsed" class="nav-label">{{ item.label }}</span>
      </button>
    </nav>

    <div class="collapse">
      <button type="button" class="collapse-btn" @click="uiStore.toggleSidebar()" aria-label="Toggle sidebar">
        <svg v-if="uiStore.sidebarCollapsed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 6l6 6-6 6" />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 6l-6 6 6 6" />
        </svg>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUiStore } from "../stores/useUiStore";
import { useAuthStore } from "../stores/useAuthStore";
import { MOCK_USERS } from "../shared/mock/users";

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();
const authStore = useAuthStore();

const currentUser = computed(() => {
  const match = MOCK_USERS.find((user) => user.role === authStore.role);
  return match ?? MOCK_USERS[0];
});

const userInitials = computed(() => {
  const name = currentUser.value?.name ?? "";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

const primaryItems = [
  {
    label: "Analytics Dashboard",
    path: "/dashboard",
    icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8'><rect x='3' y='3' width='7' height='7' rx='1.5'/><rect x='14' y='3' width='7' height='7' rx='1.5'/><rect x='3' y='14' width='7' height='7' rx='1.5'/><rect x='14' y='14' width='7' height='7' rx='1.5'/></svg>",
  },
  {
    label: "Map View",
    path: "/map",
    icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8'><path d='M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z'/><path d='M9 4v14M15 6v14'/></svg>",
  },
  {
    label: "Work Lots",
    path: "/landbank/work-lots",
    icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8'><rect x='4' y='4' width='16' height='16' rx='2'/><path d='M4 9h16M9 4v16'/></svg>",
  },
  {
    label: "Site Boundaries",
    path: "/landbank/site-boundaries",
    icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8'><path d='M4 5l6-2 6 2 4 4-4 9-6 3-6-3-2-7 2-6z'/></svg>",
  },
  {
    label: "Tasks & Ops",
    path: "/tasks-ops",
    icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8'><path d='M4 7h16M4 12h16M4 17h10'/></svg>",
  },
];

const settingsItems = [
  {
    label: "Users",
    path: "/users",
    icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8'><circle cx='12' cy='8' r='3.5'/><path d='M5 20c1.8-3.5 11.2-3.5 14 0'/></svg>",
  },
];

const go = (path) => {
  router.push(path);
};

const isActive = (path) => route.path.startsWith(path);
</script>

<style scoped>
.side-nav {
  width: 240px;
  background: #ffffff;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  transition: width 0.2s ease;
  position: relative;
  overflow: visible;
}

.side-nav.collapsed {
  width: 80px;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: #e6f4f1;
  color: #0f766e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  letter-spacing: 0.04em;
}

.profile-text .name {
  font-size: 14px;
  font-weight: 600;
}

.profile-text .email {
  font-size: 11px;
  color: var(--muted);
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 13px;
  cursor: pointer;
  color: #1f2937;
}

.nav-item:hover {
  background: #f1f5f9;
}

.nav-item.active {
  background: #e6f4f1;
  color: #0f766e;
}

.nav-icon {
  width: 20px;
  text-align: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-icon :deep(svg) {
  width: 18px;
  height: 18px;
}

.nav-section {
  margin-top: 18px;
  padding: 6px 12px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--muted);
}

.collapse {
  position: absolute;
  right: -14px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
}

.collapse-btn {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: #ffffff;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
}

.collapse-btn svg {
  width: 16px;
  height: 16px;
}
</style>
