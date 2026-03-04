<template>
  <el-drawer
    :model-value="modelValue"
    :direction="drawerDirection"
    :size="drawerSize"
    :modal="false"
    :modal-penetrable="true"
    :show-close="false"
    :close-on-press-escape="true"
    @close="emit('update:modelValue', false)"
  >
    <template #header>
      <div class="notif-header">
        <div class="notif-header-copy">
          <div class="notif-title">Notifications</div>
          <div class="notif-subtitle">
            {{ unreadCount }} unread
          </div>
        </div>
        <div class="notif-header-actions">
          <el-button
            type="primary"
            text
            size="small"
            :loading="refreshing"
            @click="handleRefresh"
          >
            Refresh
          </el-button>
          <el-button
            type="primary"
            text
            size="small"
            :disabled="unreadCount === 0"
            @click="notificationStore.markAllRead()"
          >
            Mark all as read
          </el-button>
          <button
            type="button"
            class="notif-close"
            aria-label="Close notification center"
            @click="emit('update:modelValue', false)"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
    </template>

    <div class="notif-body">
      <el-tabs v-model="activeTab" class="notif-tabs">
        <el-tab-pane :label="tabLabel('all', 'All')" name="all" />
        <el-tab-pane :label="tabLabel('alert', 'Alert')" name="alert" />
        <el-tab-pane :label="tabLabel('task', 'Task')" name="task" />
        <el-tab-pane :label="tabLabel('system', 'System')" name="system" />
      </el-tabs>

      <div v-if="refreshing && !filteredNotifications.length" class="notif-loading">
        <el-skeleton :rows="5" animated />
      </div>

      <div v-else-if="!filteredNotifications.length" class="notif-empty">
        <el-empty description="No notifications in this category." />
      </div>

      <ul v-else class="notif-list">
        <li
          v-for="item in filteredNotifications"
          :key="item.id"
          :class="['notif-item', `severity-${item.severity}`, { unread: !notificationStore.isRead(item.id) }]"
        >
          <div class="notif-item-head">
            <span class="notif-type">{{ typeLabel(item.type) }}</span>
            <button
              type="button"
              class="notif-read-toggle"
              :aria-label="notificationStore.isRead(item.id) ? 'Mark notification as unread' : 'Mark notification as read'"
              @click="toggleRead(item)"
            >
              {{ notificationStore.isRead(item.id) ? "Mark unread" : "Mark read" }}
            </button>
          </div>

          <div class="notif-item-title">{{ item.title }}</div>
          <div class="notif-item-message">{{ item.message }}</div>

          <div class="notif-item-meta">
            <span>{{ item.entityLabel }}{{ item.entityId ? ` · ${item.entityId}` : "" }}</span>
            <span>{{ formatDate(item.happenedOn) }}</span>
          </div>

          <div class="notif-item-actions">
            <el-button
              v-if="item.primaryAction"
              type="primary"
              size="small"
              text
              @click="navigateByAction(item, item.primaryAction)"
            >
              {{ item.primaryAction.label || "Open" }}
            </el-button>
            <el-button
              v-if="item.secondaryAction"
              size="small"
              text
              @click="navigateByAction(item, item.secondaryAction)"
            >
              {{ item.secondaryAction.label || "Open" }}
            </el-button>
          </div>
        </li>
      </ul>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { formatHongKong } from "../shared/utils/time";
import { useNotificationStore } from "../stores/useNotificationStore";

const MOBILE_BREAKPOINT = 900;

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue"]);

const router = useRouter();
const notificationStore = useNotificationStore();

const activeTab = ref("all");
const refreshing = ref(false);
const viewportWidth = ref(typeof window === "undefined" ? 1280 : window.innerWidth);

const drawerDirection = computed(() =>
  viewportWidth.value <= MOBILE_BREAKPOINT ? "btt" : "rtl"
);
const drawerSize = computed(() =>
  viewportWidth.value <= MOBILE_BREAKPOINT ? "76%" : "420px"
);
const unreadCount = computed(() => notificationStore.unreadCount);
const filteredNotifications = computed(() =>
  notificationStore.notificationsByTab(activeTab.value)
);

const handleResize = () => {
  viewportWidth.value = window.innerWidth;
};

const handleRefresh = async () => {
  refreshing.value = true;
  try {
    await notificationStore.refreshNotifications();
  } finally {
    refreshing.value = false;
  }
};

const tabLabel = (tab, label) => {
  const unread = tab === "all"
    ? unreadCount.value
    : notificationStore.unreadCountByType(tab);
  return unread > 0 ? `${label} (${unread})` : label;
};

const typeLabel = (type) => {
  if (type === "alert") return "Alert";
  if (type === "task") return "Task";
  return "System";
};

const formatDate = (value) => {
  const normalized = String(value || "");
  if (!normalized) return "-";
  const mode = /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? "date" : "datetime";
  return formatHongKong(normalized, { mode }) || normalized;
};

const toggleRead = (item) => {
  if (notificationStore.isRead(item.id)) {
    notificationStore.markUnread(item.id);
    return;
  }
  notificationStore.markRead(item.id);
};

const navigateByAction = async (item, action) => {
  if (!action || !action.path) return;
  notificationStore.markRead(item.id);

  const query = action.query && typeof action.query === "object"
    ? Object.fromEntries(
        Object.entries(action.query).filter(([, value]) => {
          const normalized = String(value || "").trim();
          return !!normalized;
        })
      )
    : null;
  const target = query && Object.keys(query).length
    ? { path: action.path, query }
    : { path: action.path };

  await router.push(target);
};

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    handleRefresh();
  }
);

onMounted(() => {
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.notif-header-copy {
  min-width: 0;
}

.notif-title {
  font-size: 18px;
  font-weight: 700;
}

.notif-subtitle {
  margin-top: 2px;
  font-size: 12px;
  color: var(--muted);
}

.notif-header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.notif-close {
  border: 1px solid var(--border);
  border-radius: 10px;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: #475569;
  cursor: pointer;
}

.notif-close:hover {
  border-color: rgba(15, 118, 110, 0.35);
  color: #0f766e;
}

.notif-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.notif-tabs {
  margin-bottom: 8px;
}

.notif-tabs :deep(.el-tabs__content) {
  display: none;
}

.notif-loading {
  padding: 12px 2px;
}

.notif-empty {
  flex: 1;
  display: grid;
  place-items: center;
}

.notif-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
  overflow: auto;
}

.notif-item {
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px 12px;
  background: #ffffff;
}

.notif-item.unread {
  border-color: rgba(15, 118, 110, 0.45);
  box-shadow: inset 0 0 0 1px rgba(15, 118, 110, 0.14);
}

.notif-item.severity-critical {
  border-left: 4px solid #dc2626;
}

.notif-item.severity-warning {
  border-left: 4px solid #d97706;
}

.notif-item.severity-info {
  border-left: 4px solid #0f766e;
}

.notif-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.notif-type {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}

.notif-read-toggle {
  border: none;
  background: transparent;
  color: #0f766e;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.notif-item-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.notif-item-message {
  margin-top: 4px;
  font-size: 13px;
  color: #334155;
}

.notif-item-meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
}

.notif-item-actions {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 900px) {
  .notif-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .notif-header-actions {
    width: 100%;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .notif-list {
    padding-bottom: 18px;
  }
}
</style>
