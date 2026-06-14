<template>
  <div>
    <div class="hist-overlay" @click="$emit('close')"></div>

    <div class="hist-drawer">
      <div class="drawer-header">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h5 class="fw-bold m-0" style="color:var(--text-main)">{{ activeItem?.nama || 'Riwayat' }}</h5>
          <button class="btn-close opacity-50" @click="$emit('close')"></button>
        </div>
        <div class="d-flex align-items-center justify-content-between">
          <span class="small font-monospace" style="color:var(--text-muted)">{{ activeItem?.kodeErp }}</span>
          <span class="badge-soft badge-soft-primary">Stok: {{ fmt(activeItem?.stok) }} Kg</span>
        </div>
      </div>

      <div class="chips-wrap">
        <span v-for="m in months" :key="m"
              :class="['hist-chip', m === activeMonth ? 'active' : '']"
              @click="activeMonth = m">
          {{ formatMonth(m) }}
        </span>
      </div>

      <div class="hist-list">
        <div v-for="r in currentLogs" :key="r.trxId" class="feed-item">
          <div class="feed-time">
            <div class="day">{{ formatDate(r.tanggal) }}</div>
            <div class="hour">{{ formatTime(r.tanggal) }}</div>
          </div>
          
          <div class="feed-card" :class="`border-${r.tipe.toLowerCase()}`">
            <div class="d-flex justify-content-between align-items-center mb-1">
              <span class="badge-soft" :class="`badge-soft-${r.tipe.toLowerCase()}`">{{ r.tipe }}</span>
              <span class="feed-qty fw-bold" :class="`text-${r.tipe.toLowerCase()}`">
                {{ r.tipe === 'MASUK' ? '+' : r.tipe === 'KELUAR' ? '-' : '' }}{{ fmt(r.qty) }} Kg
              </span>
            </div>
            
            <div class="fw-bold mb-1" style="color:var(--text-main)">{{ r.keterangan || '-' }}</div>
            
            <div class="d-flex justify-content-between align-items-center">
              <span class="badge-soft badge-soft-secondary">
                <i class="fas fa-warehouse me-1"></i> {{ r.blok || 'Tanpa Lokasi' }}
              </span>
              <span class="feed-sisa">Sisa: {{ fmt(r.calculatedBal) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Overlay & Drawer */
.hist-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1050; }
.hist-drawer {
  position: fixed; top:0; right:0; width: 100%; max-width: 400px; height: 100vh;
  background: var(--bg-card); z-index: 1060; display: flex; flex-direction: column;
  box-shadow: -10px 0 25px rgba(0,0,0,0.1);
}

/* Header */
.drawer-header { padding: 20px; border-bottom: 1px solid var(--border-color); }

/* Chips */
.chips-wrap { padding: 15px; display: flex; gap: 8px; overflow-x: auto; }
.hist-chip { padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 600; cursor: pointer; background: var(--bg-main); color: var(--text-muted); }
.hist-chip.active { background: #4f46e5; color: white; }

/* Feed Item */
.hist-list { flex: 1; overflow-y: auto; padding: 0 15px 20px; }
.feed-item { display: flex; gap: 12px; margin-bottom: 12px; }
.feed-time { text-align: right; min-width: 50px; font-size: 0.7rem; color: var(--text-muted); padding-top: 5px; }
.feed-card { flex: 1; padding: 12px; border-radius: 12px; background: var(--bg-main); border-left: 4px solid; }

/* Status Colors */
.border-masuk { border-left-color: #10b981; }
.border-keluar { border-left-color: #ef4444; }
.border-opname { border-left-color: #f59e0b; }
.text-masuk { color: #10b981; }
.text-keluar { color: #ef4444; }
.text-opname { color: #f59e0b; }

.feed-sisa { font-size: 0.75rem; font-family: monospace; font-weight: 600; color: var(--text-muted); }
.badge-soft { font-size: 0.65rem; padding: 3px 8px; border-radius: 6px; font-weight: 700; }
.badge-soft-masuk { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.badge-soft-keluar { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.badge-soft-opname { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.badge-soft-secondary { background: var(--border-color); color: var(--text-muted); }
</style>
