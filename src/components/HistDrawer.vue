<template>
  <div class="hist-wrapper">
    <div class="hist-overlay" @click="$emit('close')"></div>

    <div class="hist-drawer">
      <div class="drawer-header">
        <h6 class="fw-bold m-0 text-truncate">{{ activeItem?.nama || 'Riwayat' }}</h6>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>

      <div class="chips-wrap">
        <span v-for="m in months" :key="m"
              :class="['hist-chip', m === activeMonth ? 'active' : '']"
              @click="activeMonth = m">
          {{ formatMonth(m) }}
        </span>
      </div>

      <div class="hist-list">
        <div v-for="r in currentLogs" :key="r.trxId" class="history-item">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <div class="small fw-bold">{{ formatDate(r.tanggal) }}</div>
              <div class="small text-muted">{{ r.keterangan }}</div>
            </div>
            <div class="text-end">
              <div class="fw-bold" :class="r.tipe === 'MASUK' ? 'text-success' : 'text-danger'">
                {{ r.tipe === 'MASUK' ? '+' : '-' }}{{ fmt(r.qty) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 1. Overlay Fullscreen */
.hist-wrapper {
  position: fixed;
  inset: 0;
  z-index: 1055;
}

.hist-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
}

/* 2. Drawer Panel Normal (Muncul dari kanan) */
.hist-drawer {
  position: absolute;
  right: 0;
  top: 0;
  width: 350px;
  height: 100vh;
  background: var(--bg-card);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  box-shadow: -5px 0 15px rgba(0,0,0,0.1);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  padding: 15px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chips-wrap { padding: 10px; display: flex; gap: 5px; overflow-x: auto; background: var(--bg-main); }
.hist-chip { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; background: var(--bg-card); border: 1px solid var(--border-color); }
.hist-chip.active { background: #4f46e5; color: white; }

.hist-list { flex: 1; overflow-y: auto; padding: 10px; }
.history-item { padding: 10px; border-bottom: 1px solid var(--border-color); }

/* Responsive untuk HP */
@media (max-width: 576px) {
  .hist-drawer { width: 90%; }
}
</style>
