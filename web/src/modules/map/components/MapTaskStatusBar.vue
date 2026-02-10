<template>
  <div class="task-status-bar" aria-label="Work lot task status legend">
    <div class="status-item">
      <span class="swatch task-overdue"></span>
      <span>Overdue</span>
    </div>
    <div class="status-item">
      <span class="swatch task-open"></span>
      <span>Open</span>
    </div>
    <div class="status-item">
      <span class="swatch task-done"></span>
      <span>Completed</span>
    </div>
    <div class="status-item">
      <span class="swatch task-none"></span>
      <span>No Tasks</span>
    </div>
  </div>
</template>

<style scoped>
.task-status-bar {
  position: absolute;
  left: 20px;
  bottom: 16px;
  z-index: 64;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.14);
  font-size: 11px;
  color: #1e293b;
}

.status-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.swatch {
  width: 11px;
  height: 11px;
  border-radius: 3px;
  border: 1px solid rgba(15, 23, 42, 0.22);
  flex: 0 0 auto;
}

.swatch.task-overdue {
  background: #ef4444;
}

.swatch.task-open {
  background: #facc15;
}

.swatch.task-done {
  background: #22c55e;
}

.swatch.task-none {
  background: #94a3b8;
}

@media (max-width: 900px) {
  .task-status-bar {
    left: 12px;
    right: 12px;
    bottom: 44px;
    justify-content: space-between;
    gap: 6px;
    overflow-x: auto;
  }
}
</style>
