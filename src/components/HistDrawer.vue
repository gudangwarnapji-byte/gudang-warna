<template>
  <div class="hist-wrapper">
    <div class="hist-overlay" @click="$emit('close')"></div>

    <div class="hist-drawer shadow-lg">
      
      <div class="drawer-header">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div style="min-width:0; flex:1;">
            <h5 class="fw-bold m-0 text-main text-truncate">{{ activeItem?.nama || 'Riwayat' }}</h5>
            <div class="d-flex align-items-center gap-2 mt-1">
              <span class="small text-muted font-monospace">{{ activeItem?.kodeErp }}</span>
              <span class="stok-tag">Stok: {{ fmt(activeItem?.stok) }} Kg</span>
            </div>
          </div>
          <button type="button" class="btn-close-custom" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="chips-container">
        <div class="chips-scroll">
          <span v-for="m in months" :key="m"
                :class="['hist-chip', m === activeMonth ? 'active' : '']"
                @click.stop="activeMonth = m">
            {{ formatMonth(m) }}
          </span>
        </div>
      </div>

      <div class="hist-list">
        <div v-if="loadingHist" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
        
        <template v-else-if="currentLogs.length">
          <div v-for="r in currentLogs" :key="r.trxId" class="feed-item">
            <div class="feed-time">
              <div class="day">{{ formatDate(r.tanggal) }}</div>
              <div class="hour">{{ formatTime(r.tanggal) }}</div>
            </div>
            
            <div class="feed-card" :class="`border-${r.tipe.toLowerCase()}`">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="badge-soft" :class="`badge-soft-${r.tipe.toLowerCase()}`">{{ r.tipe }}</span>
                <span class="fw-bold fs-6" :class="`text-${r.tipe.toLowerCase()}`">
                  {{ r.tipe === 'MASUK' ? '+' : r.tipe === 'KELUAR' ? '-' : '' }}{{ fmt(r.qty) }}
                </span>
              </div>
              
              <div class="fw-bold small text-main mb-1">{{ r.keterangan || '-' }}</div>
              
              <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top-dashed">
                <span class="small text-muted">
                  <i class="fas fa-warehouse me-1 opacity-50"></i> {{ r.blok || 'Tanpa Lokasi' }}
                </span>
                <span class="sisa-text">Sisa: {{ fmt(r.calculatedBal) }}</span>
              </div>
            </div>
          </div>
        </template>
        
        <div v-else class="text-center py-5 text-muted small">
          Belum ada transaksi di bulan ini.
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* WRAPPER UTAMA */
.hist-wrapper {
  position: fixed;
  inset: 0;
  z-index: 1060; /* Harus di atas segalanya */
  display: flex;
  justify-content: flex-end;
  pointer-events: none; /* Agar klik bisa tembus ke overlay */
}

/* OVERLAY (Background Hitam) */
.hist-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(2px);
  pointer-events: auto; /* Biar bisa diklik untuk close */
  z-index: 1;
}

/* DRAWER PANEL */
.hist-drawer {
  position: relative;
  width: 100%;
  max-width: 420px;
  height: 100%;
  background: var(--bg-card);
  z-index: 2;
  pointer-events: auto; /* WAJIB: Biar isi drawer bisa dipencet */
  display: flex;
  flex-direction: column;
  box-shadow: -10px 0 30px rgba(0,0,0,0.2);
}

/* HEADER */
.drawer-header { padding: 24px 20px; border-bottom: 1px solid var(--border-color); }
.text-main { color: var(--text-main); }
.stok-tag { font-size: 0.7rem; font-weight: 800; background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 2px 8px; border-radius: 6px; }

.btn-close-custom {
  background: var(--bg-main);
  border: 1px solid var(--border-color);
  width: 32px; height: 32px;
  border-radius: 8px;
  color: var(--text-muted);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.btn-close-custom:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }

/* CHIPS */
.chips-container { padding: 12px 15px; background: var(--bg-main); }
.chips-scroll { display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.chips-scroll::-webkit-scrollbar { display: none; }
.hist-chip {
  padding: 6px 14px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;
  white-space: nowrap; cursor: pointer;
  background: var(--bg-card); color: var(--text-muted);
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}
.hist-chip.active { background: #4f46e5; color: white; border-color: #4f46e5; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.3); }

/* FEED LIST */
.hist-list { flex: 1; overflow-y: auto; padding: 20px 15px; }
.feed-item { display: flex; gap: 15px; margin-bottom: 20px; }
.feed-time { text-align: right; min-width: 55px; padding-top: 4px; }
.day { font-size: 0.75rem; font-weight: 800; color: var(--text-main); }
.hour { font-size: 0.65rem; color: var(--text-muted); }

.feed-card {
  flex: 1; background: var(--bg-main); border-radius: 14px;
  padding: 12px 15px; border: 1px solid var(--border-color);
  border-left-width: 5px; transition: transform 0.2s;
}
.feed-card:hover { transform: scale(1.02); }

/* STATUS COLORS */
.border-masuk { border-left-color: #10b981; }
.border-keluar { border-left-color: #ef4444; }
.border-opname { border-left-color: #f59e0b; }
.text-masuk { color: #10b981; }
.text-keluar { color: #ef4444; }
.text-opname { color: #f59e0b; }

.badge-soft { font-size: 0.6rem; font-weight: 800; padding: 3px 8px; border-radius: 5px; text-transform: uppercase; }
.badge-soft-masuk { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.badge-soft-keluar { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.badge-soft-opname { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.sisa-text { font-family: 'JetBrains Mono', monospace; font-size: 0.7rem; font-weight: 700; color: var(--text-muted); }
.border-top-dashed { border-top: 1px dashed var(--border-color); }
</style>
