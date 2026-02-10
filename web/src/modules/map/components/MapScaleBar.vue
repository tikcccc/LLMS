<template>
  <div class="map-scale-host" aria-hidden="true">
    <div class="map-scale-pill">{{ scaleLabel }}</div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from "vue";
import { unByKey } from "ol/Observable";

const props = defineProps({
  map: { type: Object, default: null },
});

const scaleLabel = ref("0 m");
const FIXED_PIXEL_WIDTH = 100;

let resolutionListener = null;
let moveEndListener = null;

const clearListeners = () => {
  if (resolutionListener) {
    unByKey(resolutionListener);
    resolutionListener = null;
  }
  if (moveEndListener) {
    unByKey(moveEndListener);
    moveEndListener = null;
  }
};

const toNiceDistance = (meters) => {
  if (!Number.isFinite(meters) || meters <= 0) return 0;
  const exponent = Math.floor(Math.log10(meters));
  const base = 10 ** exponent;
  const ratio = meters / base;
  if (ratio >= 5) return 5 * base;
  if (ratio >= 2) return 2 * base;
  return base;
};

const formatMeters = (meters) => {
  if (!Number.isFinite(meters) || meters <= 0) return "0 m";
  if (meters < 10) {
    const oneDecimal = Math.round(meters * 10) / 10;
    return `${oneDecimal} m`;
  }
  return `${Math.round(meters).toLocaleString()} m`;
};

const updateScale = () => {
  const map = props.map;
  const resolution = map?.getView?.()?.getResolution?.();
  if (!Number.isFinite(resolution) || resolution <= 0) {
    scaleLabel.value = "0 m";
    return;
  }
  const distance = toNiceDistance(resolution * FIXED_PIXEL_WIDTH);
  scaleLabel.value = formatMeters(distance);
};

const bindScale = () => {
  clearListeners();
  const map = props.map;
  const view = map?.getView?.();
  if (!map || !view) {
    scaleLabel.value = "0 m";
    return;
  }

  resolutionListener = view.on("change:resolution", updateScale);
  moveEndListener = map.on("moveend", updateScale);
  updateScale();
};

watch(() => props.map, bindScale, { immediate: true });

onBeforeUnmount(() => {
  clearListeners();
});
</script>

<style scoped>
.map-scale-host {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  z-index: 65;
  pointer-events: none;
}

.map-scale-pill {
  width: 124px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  border: 1px solid rgba(191, 219, 254, 0.98);
  background: rgba(59, 130, 246, 0.52);
  color: #ffffff;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.01em;
  line-height: 1;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.35);
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.28);
  transition: none;
  animation: none;
}

@media (max-width: 768px) {
  .map-scale-host {
    bottom: 8px;
  }

  .map-scale-pill {
    width: 106px;
    height: 24px;
    font-size: 16px;
  }
}
</style>
