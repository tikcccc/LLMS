<template>
  <aside :class="['side-nav', { collapsed: uiStore.sidebarCollapsed }]">
    <div class="brand">
      <div class="logo">Geo</div>
      <div v-if="!uiStore.sidebarCollapsed" class="brand-text">
        <div class="title">Geo Map</div>
        <div class="subtitle">LLMS Demo</div>
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
      <button type="button" class="collapse-btn" @click="uiStore.toggleSidebar()">
        {{ uiStore.sidebarCollapsed ? '→' : '←' }}
      </button>
    </div>
  </aside>
</template>

<script setup>
import { useRoute, useRouter } from "vue-router";
import { useUiStore } from "../stores/useUiStore";

const router = useRouter();
const route = useRoute();
const uiStore = useUiStore();

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
    label: "Land Lots",
    path: "/landbank/land-lots",
    icon: "<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8'><rect x='4' y='4' width='16' height='16' rx='2'/><path d='M4 9h16M9 4v16'/></svg>",
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
  background: #fdfdfb;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 20px 16px;
  transition: width 0.2s ease;
}

.side-nav.collapsed {
  width: 80px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: #fee2e2;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.brand-text .title {
  font-size: 16px;
  font-weight: 600;
}

.brand-text .subtitle {
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
  background: #f3f4f6;
}

.nav-item.active {
  background: #ffe4e6;
  color: #e11d48;
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
  display: flex;
  justify-content: flex-end;
}

.collapse-btn {
  border: none;
  background: #f3f4f6;
  border-radius: 10px;
  padding: 6px 10px;
  cursor: pointer;
}
</style>
