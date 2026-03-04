<template>
  <transition name="hint-fade">
    <div v-if="showHint" class="tool-hint" :class="hintClass">
      <div class="hint-icon">{{ hintIcon }}</div>
      <div class="hint-content">
        <div class="hint-title">{{ hintTitle }}</div>
        <div class="hint-description">{{ hintDescription }}</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  tool: { type: String, required: true },
  hasDraft: { type: Boolean, default: false },
});

const showHint = computed(() => props.tool !== "PAN" || props.hasDraft);

const hintIcon = computed(() => {
  switch (props.tool) {
    case "DRAW": return "🖌️";
    case "DRAW_CIRCLE": return "🧭";
    case "POLYGON": return "✏️";
    case "POLYGON_CIRCLE": return "⚪";
    case "MODIFY": return "✂️";
    case "DELETE": return "🗑️";
    default: return "ℹ️";
  }
});

const hintTitle = computed(() => {
  switch (props.tool) {
    case "DRAW": return "Scope Draw Mode";
    case "DRAW_CIRCLE": return "Scope Circle Mode";
    case "POLYGON": return "Polygon Create Mode";
    case "POLYGON_CIRCLE": return "Circle Lot Create Mode";
    case "MODIFY": return "Modify Mode";
    case "DELETE": return "Delete Mode";
    default: return "Info";
  }
});

const hintDescription = computed(() => {
  switch (props.tool) {
    case "DRAW":
      return "Draw a range to list matching parcels (section/part/site/work) • ESC to clear";
    case "DRAW_CIRCLE":
      return "Draw a circular range to list matching parcels (section/part/site/work) • ESC to clear";
    case "POLYGON":
      return `Click to add points • Double-click to finish • ESC to cancel`;
    case "POLYGON_CIRCLE":
      return "Click and drag to draw circle • ESC to cancel";
    case "MODIFY": 
      return `Drag vertices to edit • ESC to revert changes`;
    case "DELETE": 
      return "Click a work lot to delete • ESC to cancel";
    default: 
      return "";
  }
});

const hintClass = computed(() => {
  switch (props.tool) {
    case "DELETE": return "hint-danger";
    case "MODIFY": return "hint-warning";
    case "DRAW": return "hint-primary";
    case "POLYGON": return "hint-primary";
    case "DRAW_CIRCLE": return "hint-info";
    case "POLYGON_CIRCLE": return "hint-info";
    default: return "";
  }
});
</script>

<style scoped>
.tool-hint {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  padding: 12px 20px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(15, 118, 110, 0.3);
  max-width: 500px;
  z-index: 50;
}

.hint-primary {
  border-color: rgba(15, 118, 110, 0.5);
  background: rgba(240, 253, 250, 0.95);
}

.hint-info {
  border-color: rgba(14, 165, 233, 0.5);
  background: rgba(240, 249, 255, 0.95);
}

.hint-warning {
  border-color: rgba(250, 204, 21, 0.5);
  background: rgba(254, 252, 232, 0.95);
}

.hint-danger {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(254, 242, 242, 0.95);
}

.hint-icon {
  font-size: 24px;
  line-height: 1;
}

.hint-content {
  flex: 1;
}

.hint-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin-bottom: 2px;
}

.hint-description {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.hint-fade-enter-active,
.hint-fade-leave-active {
  transition: all 0.3s ease;
}

.hint-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

.hint-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}

@media (max-width: 768px) {
  .tool-hint {
    bottom: 60px;
    left: 24px;
    right: 24px;
    transform: none;
    max-width: none;
  }
  
  .hint-fade-enter-from,
  .hint-fade-leave-to {
    transform: translateY(10px);
  }
}
</style>
