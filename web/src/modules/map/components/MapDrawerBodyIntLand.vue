<template>
  <div class="drawer-body">
    <el-collapse
      :model-value="activeCollapse"
      class="info-collapse"
      @update:model-value="emit('update:activeCollapse', $event)"
    >
      <el-collapse-item name="basic" title="Basic Information">
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">ID</span>
            <span class="info-value">{{ selectedIntLand.id }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Source Layer</span>
            <span class="info-value">{{ selectedIntLand.layer }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Entity</span>
            <span class="info-value">{{ selectedIntLand.entity }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Area</span>
            <span class="info-value">{{ intLandAreaText }}</span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
defineProps({
  selectedIntLand: { type: Object, required: true },
  intLandAreaText: { type: String, default: "—" },
  activeCollapse: { type: Array, default: () => [] },
});

const emit = defineEmits(["update:activeCollapse"]);
</script>
