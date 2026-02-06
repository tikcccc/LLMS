<template>
  <transition name="fade">
    <div v-if="tool !== 'PAN'" class="mode-indicator">
      <div class="mode-badge" :class="`mode-${tool.toLowerCase()}`">
        <span class="mode-icon">{{ modeIcon }}</span>
        <div class="mode-content">
          <div class="mode-title">{{ modeTitle }}</div>
          <div class="mode-hint">{{ modeHint }}</div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tool: { type: String, required: true },
});

const modeIcon = computed(() => {
  switch (props.tool) {
    case 'DRAW': return '✏️';
    case 'MODIFY': return '✂️';
    case 'DELETE': return '🗑️';
    default: return '🖐️';
  }
});

const modeTitle = computed(() => {
  switch (props.tool) {
    case 'DRAW': return "Drawing Work Lot";
    case 'MODIFY': return "Modifying Work Lot";
    case 'DELETE': return "Deleting Work Lot";
    default: return 'Pan Mode';
  }
});

const modeHint = computed(() => {
  switch (props.tool) {
    case 'DRAW': return 'Click to draw polygon • ESC to cancel';
    case 'MODIFY': return 'Drag vertices to modify • ESC to cancel';
    case 'DELETE': return 'Click feature to delete • ESC to cancel';
    default: return '';
  }
});
</script>

<style scoped>
.mode-indicator {
  position: absolute;
  top: 80px;
  left: 24px;
  z-index: 100;
  pointer-events: none;
}

.mode-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 2px solid;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.mode-draw {
  border-color: #3b82f6;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(255, 255, 255, 0.95));
}

.mode-modify {
  border-color: #f59e0b;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(255, 255, 255, 0.95));
}

.mode-delete {
  border-color: #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(255, 255, 255, 0.95));
}

.mode-icon {
  font-size: 24px;
  line-height: 1;
}

.mode-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink);
  line-height: 1.2;
}

.mode-hint {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.3;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .mode-indicator {
    top: 70px;
    left: 12px;
    right: 12px;
  }

  .mode-badge {
    padding: 10px 12px;
  }

  .mode-icon {
    font-size: 20px;
  }

  .mode-title {
    font-size: 13px;
  }

  .mode-hint {
    font-size: 10px;
  }
}
</style>
