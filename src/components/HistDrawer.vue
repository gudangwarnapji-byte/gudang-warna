<template>
  <div>
    <!-- OVERLAY -->
    <div
      class="hist-overlay"
      @click="$emit('close')"
    ></div>

    <!-- DRAWER -->
    <div class="hist-drawer">
      <!-- DRAG HANDLE -->
      <div class="drag-handle">
        <div class="handle-bar"></div>
      </div>

      <!-- HEADER -->
      <div class="px-3 pb-2 border-bottom flex-shrink-0">
        <div class="d-flex justify-content-between align-items-start">
          <div style="min-width:0;flex:1;margin-right:10px">
            <h6 class="fw-bold mb-0 text-truncate" style="font-size:1rem">
              {{ activeItem?.nama || 'Riwayat' }}
            </h6>
            <div class="d-flex align-items-center gap-2 mt-1">
              <small class="text-muted" style="font-size:.75rem">
                {{ activeItem?.kodeErp }}
              </small>
              <span class="hist-stok-badge">
                Stok: {{ fmt(activeItem?.stok) }} Kg
              </span>
            </div>
          </div>
          <button class="btn-close" @click="$emit('close')"></button>
        </div>
      </div>

      <!-- MONTH CHIPS -->
      <div class="chips-wrap">
        <span
          v-for="m in months"
          :key="m"
          :class="['hist-chip', m === activeMonth ? 'active' : '']"
          @click="activeMonth = m"
        >
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

      <!-- LIST -->
      <div class="hist-list">
        <div v-if="loadingHist" class="text-center py-5">
          <div class="spinner-border text-primary"></div>
        </div>
        <template v-else-if="currentLogs.length">
          <div
            v-for="r in currentLogs"
            :key="r.trxId"
            :class="['history-item', r.tipe === 'MASUK' ? 'history-in' : r.tipe === 'KELUAR' ? 'history-out' : 'history-adj']"
          >
            <div class="d-flex justify-content-between align-items-center">
              <div class="d-flex align-items-center gap-3" style="width:60%">
                <div class="text-center" style="min-width:50px">
                  <div>{{ formatDate(r.tanggal) }}</div>
                  <div style="font-size:.7rem;color:#6c757d">{{ formatTime(r.tanggal) }}</div>
                </div>
                <div style="line-height:1.2">
                  <div class="fw-bold text-dark" style="font-size:.9rem">
                    <i :class="r.tipe === 'MASUK' ? 'fas fa-arrow-down text-success' : r.tipe === 'KELUAR' ? 'fas fa-arrow-up text-danger' : 'fas fa-check-circle text-warning'"></i>
                    {{ r.keterangan || '-' }}
                  </div>
                  <small class="text-muted" style="font-size:.7rem">{{ r.tipe }}</small>
                </div>
              </div>
              <div class="text-end" style="width:40%">
                <div :class="['history-qty', r.tipe === 'MASUK' ? 'text-success' : r.tipe === 'KELUAR' ? 'text-danger' : 'text-dark']">
                  {{ r.tipe === 'MASUK' ? '+' : r.tipe === 'KELUAR' ? '-' : '' }}{{ fmt(r.qty) }}
                  <span style="font-size:.7rem;color:#999">Kg</span>
                </div>
                <div class="history-bal">Sisa: {{ fmt(r.calculatedBal) }}</div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="text-center py-5 text-muted">
          <div class="fw-bold small">Belum ada transaksi</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { db } from '../firebase'
import { dbStok } from '../composables/useStok'
import { activeHistId } from '../composables/useHist'

const emit = defineEmits(['close'])
const BULAN = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

const allLogs = ref({})
const activeMonth = ref('')
const loadingHist = ref(false)

const activeItem = computed(() =>
  dbStok.value.find(x => x.idUnik === activeHistId.value)
)

const months = computed(() =>
  Object.keys(allLogs.value).sort((a, b) => b.localeCompare(a))
)

const currentLogs = computed(() =>
  (allLogs.value[activeMonth.value] || []).slice().reverse()
)

const summary = computed(() => {
  let masuk = 0, keluar = 0
  currentLogs.value.forEach(r => {
    if (r.tipe === 'MASUK') masuk += Number(r.qty)
    else if (r.tipe === 'KELUAR') keluar += Number(r.qty)
  })
  return { masuk, keluar, count: currentLogs.value.length }
})

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const formatMonth = m => {
  const [y, mo] = m.split('-')
  return BULAN[parseInt(mo) - 1] + ' ' + y
}

const formatDate = iso => new Date(iso).toLocaleDateString('id-ID', {
  day: 'numeric', month: 'short'
})

const formatTime = iso => new Date(iso).toLocaleTimeString('id-ID', {
  hour: '2-digit', minute: '2-digit'
})

watch(activeHistId, id => {
  if (!id) return
  loadingHist.value = true
  allLogs.value = {}
  activeMonth.value = ''
  const item = dbStok.value.find(x => x.idUnik === id)
  onValue(dbRef(db, `riwayat_transaksi/${id}`), snap => {
    loadingHist.value = false
    const data = snap.val()
    if (!data) return
    let runBal = Number(item?.stokAwal) || 0
    const grouped = {}
    Object.values(data)
      .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
      .forEach(r => {
        const q = Number(r.qty)
        if (r.tipe === 'MASUK') runBal += q
        else if (r.tipe === 'KELUAR') runBal -= q
        else if (r.tipe === 'OPNAME') runBal = q
        runBal = parseFloat(runBal.toFixed(2))
        const key = (r.tanggal || '').slice(0, 7)
        if (!grouped[key]) grouped[key] = []
        grouped[key].push({ ...r, calculatedBal: runBal })
      })
    allLogs.value = grouped
    activeMonth.value = Object.keys(grouped).sort((a, b) => b.localeCompare(a))[0] || ''
  }, { onlyOnce: true })
})
</script>

<style scoped>
.hist-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.5); z-index: 1050;
}
.hist-drawer {
  position: fixed; bottom: 0; left: 0; right: 0;
  background: #fff; border-radius: 16px 16px 0 0;
  border-top: 1px solid #dee2e6; z-index: 1055;
  max-height: 88vh; display: flex; flex-direction: column;
}
.drag-handle {
  padding: 10px 0 4px; display: flex;
  justify-content: center;
}
.handle-bar {
  width: 36px; height: 4px;
  background: #dee2e6; border-radius: 4px;
}
.chips-wrap {
  padding: 10px 14px 6px; overflow-x: auto;
  white-space: nowrap; flex-shrink: 0;
  -webkit-overflow-scrolling: touch;
}
.hist-chip {
  display: inline-block; padding: 5px 13px;
  border-radius: 20px; font-size: .78rem; font-weight: 600;
  cursor: pointer; border: 1px solid #dee2e6;
  background: #f8f9fa; color: #6c757d; margin-right: 6px;
}
.hist-chip.active { background: #1e3c72; color: #fff; border-color: #1e3c72; }
.chip-cnt { font-size: .65rem; opacity: .75; margin-left: 2px; }
.hist-summary {
  display: flex; gap: 6px;
  padding: 4px 14px 8px; flex-shrink: 0;
}
.hist-sum-box {
  flex: 1; background: #f8f9fa; border-radius: 8px;
  padding: 6px 8px; text-align: center; border: 1px solid #e9ecef;
}
.hist-sum-lbl { font-size: .6rem; color: #6c757d; text-transform: uppercase; font-weight: 600; }
.hist-sum-val { font-size: .82rem; font-weight: 700; margin-top: 1px; }
.hist-list { overflow-y: auto; flex: 1; }
.history-item {
  border-left: 4px solid transparent;
  padding: 12px 15px; border-bottom: 1px solid #f0f0f0;
}
.history-in  { border-left-color: #198754; background: #f8fff9; }
.history-out { border-left-color: #dc3545; background: #fff8f8; }
.history-adj { border-left-color: #ffc107; }
.history-qty { font-size: 1.1rem; font-weight: 800; }
.history-bal { font-size: .75rem; color: #6c757d; font-family: monospace; font-weight: 600; }
.hist-stok-badge {
  display: inline-block; background: #e8f5e9; color: #1b5e20;
  font-size: .7rem; font-weight: 700; padding: 2px 8px;
  border-radius: 20px; border: 1px solid #a5d6a7;
}
</style>
