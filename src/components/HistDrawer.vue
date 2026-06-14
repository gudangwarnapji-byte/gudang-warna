<template>
  <div>
    <!-- OVERLAY -->
    <div class="hist-overlay" @click="$emit('close')"></div>

    <!-- DRAWER -->
    <div class="hist-drawer shadow-2xl">
      <div class="drag-handle">
        <div class="handle-bar"></div>
      </div>

      <!-- HEADER -->
      <div class="px-3 pb-3 border-bottom border-color flex-shrink-0">
        <div class="d-flex justify-content-between align-items-start">
          <div style="min-width:0;flex:1;margin-right:10px">
            <h6 class="fw-bold mb-0 text-truncate" style="font-size:1rem; color:var(--text-main)">
              {{ activeItem?.nama || 'Riwayat' }}
            </h6>
            <div class="d-flex align-items-center gap-2 mt-1">
              <small style="font-size:.75rem; color:var(--text-muted)">{{ activeItem?.kodeErp }}</small>
              <span class="hist-stok-badge">Stok: {{ fmt(activeItem?.stok) }} Kg</span>
            </div>
          </div>
          <div class="d-flex gap-2 align-items-center flex-shrink-0">
            <button class="btn btn-sm btn-light-action rounded-pill px-3" @click="exportKartuStok">
              <i class="fas fa-file-excel text-success"></i>
            </button>
            <button class="btn-close opacity-50" @click="$emit('close')"></button>
          </div>
        </div>
      </div>

      <!-- CHIPS BULAN -->
      <div class="chips-wrap">
        <span v-for="m in months" :key="m"
              :class="['hist-chip', m === activeMonth ? 'active' : '']"
              @click="activeMonth = m">
          {{ formatMonth(m) }}
          <span class="chip-cnt">{{ allLogs[m]?.length }}</span>
        </span>
      </div>

      <!-- SUMMARY -->
      <div class="hist-summary" v-if="activeMonth">
        <div class="hist-sum-box">
          <div class="hist-sum-lbl">Masuk</div>
          <div class="hist-sum-val text-success">+{{ fmt(summary.masuk) }}</div>
        </div>
        <div class="hist-sum-box">
          <div class="hist-sum-lbl">Keluar</div>
          <div class="hist-sum-val text-danger">-{{ fmt(summary.keluar) }}</div>
        </div>
        <div class="hist-sum-box">
          <div class="hist-sum-lbl">Transaksi</div>
          <div class="hist-sum-val">{{ summary.count }}x</div>
        </div>
      </div>

      <!-- LIST RIWAYAT -->
      <div class="hist-list">
        <div v-if="loadingHist" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
        <template v-else-if="currentLogs.length">
          <div v-for="r in currentLogs" :key="r.trxId" :class="['history-item', `history-${r.tipe.toLowerCase()}`]">
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-3" style="width:60%">
                <div class="text-center" style="min-width:45px">
                  <div style="font-size:0.8rem; font-weight:700">{{ formatDate(r.tanggal) }}</div>
                  <div style="font-size:.7rem; color:var(--text-muted)">{{ formatTime(r.tanggal) }}</div>
                </div>
                <div style="line-height:1.2">
                  <div class="fw-bold" style="font-size:.9rem; color:var(--text-main)">
                    <i :class="r.tipe === 'MASUK' ? 'fas fa-arrow-down text-success' : r.tipe === 'KELUAR' ? 'fas fa-arrow-up text-danger' : 'fas fa-check-circle text-warning'" class="me-1"></i>
                    {{ r.keterangan || '-' }}
                  </div>
                  <div class="d-flex align-items-center gap-2 mt-1">
                    <span class="badge-soft" :class="r.tipe === 'MASUK' ? 'badge-soft-success' : r.tipe === 'KELUAR' ? 'badge-soft-danger' : 'badge-soft-warning'">{{ r.tipe }}</span>
                    <span v-if="r.blok" class="badge-soft badge-soft-secondary"><i class="fas fa-warehouse me-1"></i> {{ r.blok }}</span>
                  </div>
                </div>
              </div>
              <div class="text-end" style="width:40%">
                <div class="history-qty" :class="r.tipe === 'MASUK' ? 'text-success' : r.tipe === 'KELUAR' ? 'text-danger' : 'text-main'">
                  {{ r.tipe === 'MASUK' ? '+' : r.tipe === 'KELUAR' ? '-' : '' }}{{ fmt(r.qty) }} Kg
                </div>
                <div class="history-bal">Sisa: {{ fmt(r.calculatedBal) }}</div>
                <button v-if="currentRole === 'admin'" class="btn btn-sm btn-link text-muted p-0" @click="bukaEdit(r, activeHistId)">
                  <i class="fas fa-pencil-alt"></i>
                </button>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="text-center py-5 text-muted">Belum ada transaksi</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { db } from '../firebase'
import { dbStok } from '../composables/useStok'
import { activeHistId } from '../composables/useHist'
import { useEditTrans } from '../composables/useEditTrans'
import { currentRole } from '../composables/useAuth'
const { bukaEdit } = useEditTrans()
const emit = defineEmits(['close'])

const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
const allLogs = ref({}); const activeMonth = ref(''); const loadingHist = ref(false); let unsubscribe = null

const activeItem = computed(() => dbStok.value.find(x => x.idUnik === activeHistId.value))
const months = computed(() => Object.keys(allLogs.value).sort((a, b) => b.localeCompare(a)))
const currentLogs = computed(() => (allLogs.value[activeMonth.value] || []).slice().reverse())
const summary = computed(() => {
  let masuk = 0, keluar = 0
  currentLogs.value.forEach(r => { if (r.tipe === 'MASUK') masuk += Number(r.qty); else if (r.tipe === 'KELUAR') keluar += Number(r.qty) })
  return { masuk, keluar, count: currentLogs.value.length }
})

const fmt = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatMonth = m => { const [y, mo] = m.split('-'); return BULAN[parseInt(mo) - 1] + ' ' + y }
const formatDate = iso => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
const formatTime = iso => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })

const exportKartuStok = () => {
  if (!activeHistId.value) return
  const item = dbStok.value.find(x => x.idUnik === activeHistId.value)
  const allRows = Object.values(allLogs.value).flat().sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
  const rows = [['KARTU STOK', item.nama], [], ['TANGGAL', 'TIPE', 'BLOK', 'QTY', 'SALDO'], ...allRows.map(r => [r.tanggal, r.tipe, r.blok, r.qty, r.calculatedBal])]
  const ws = window.XLSX.utils.aoa_to_sheet(rows); const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Kartu'); window.XLSX.writeFile(wb, `Kartu_${item.kodeErp}.xlsx`)
}

const loadHistoryData = (id) => {
  if (!id) return
  if (unsubscribe) { unsubscribe(); unsubscribe = null }
  loadingHist.value = true
  allLogs.value = {}; activeMonth.value = ''
  unsubscribe = onValue(dbRef(db, `riwayat_transaksi/${id}`), snap => {
    loadingHist.value = false
    const data = snap.val() || {}
    const grouped = {}
    Object.values(data).sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal)).forEach(r => {
      const key = (r.tanggal || '').slice(0, 7)
      if (!grouped[key]) grouped[key] = []
      grouped[key].push({ ...r, calculatedBal: r.stokAkhir || 0 })
    })
    allLogs.value = grouped
    activeMonth.value = Object.keys(grouped).sort((a,b) => b.localeCompare(a))[0] || ''
  })
}

watch(activeHistId, loadHistoryData)
onUnmounted(() => { if (unsubscribe) unsubscribe() })
</script>

<style scoped>
.hist-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 1050; }
.hist-drawer {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 600px; height: 85vh;
  background: var(--bg-card); border-radius: 20px 20px 0 0;
  z-index: 1055; display: flex; flex-direction: column;
}
.border-color { border-color: var(--border-color) !important; }
.hist-chip { padding: 6px 14px; border-radius: 20px; font-size: .8rem; font-weight: 600; cursor: pointer; background: var(--bg-main); color: var(--text-muted); margin-right: 6px; }
.hist-chip.active { background: #4f46e5; color: white; }
.hist-summary { display: flex; gap: 8px; padding: 10px 14px; }
.hist-sum-box { flex:1; background: var(--bg-main); padding: 8px; border-radius: 10px; text-align: center; }
.history-item { padding: 12px 16px; border-bottom: 1px solid var(--border-color); }
.history-in { border-left: 4px solid #10b981; }
.history-out { border-left: 4px solid #ef4444; }
.history-adj { border-left: 4px solid #f59e0b; }
.badge-soft { font-size: 0.65rem; padding: 3px 8px; border-radius: 6px; font-weight: 700; }
.badge-soft-success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.badge-soft-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.badge-soft-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.badge-soft-secondary { background: var(--bg-main); color: var(--text-muted); }
</style>
