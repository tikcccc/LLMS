<template>
  <div class="attribution">
    <img class="logo" src="/landsd_logo.svg" alt="Lands Department logo" />
    <div class="text">© Lands Department, HKSAR. Tiles via CSDI Map API.</div>
  </div>
</template>

<style scoped>
.attribution {
  position: absolute;
  bottom: 22px;
  right: 24px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid var(--border);
  padding: 8px 12px;
  border-radius: 10px;
  font-size: 11px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.attribution .logo {
  height: 22px;
  width: auto;
}
</style>
