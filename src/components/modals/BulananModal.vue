<template>
  <div class="modal fade show d-block backdrop-blur" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content modern-modal border-0 shadow-lg">
        <div class="modal-header border-0 pb-3">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2 m-0" style="color:var(--text-main)">
            <div class="icon-circle bg-primary-subtle text-primary"><i class="fas fa-calendar-alt"></i></div>
            Arus Bulanan
          </h5>
          <button type="button" class="btn-close btn-close-custom" @click="$emit('close')"></button>
        </div>
        <div class="modal-body p-4">
          <div class="row g-3">
            <div v-for="(data, bulan) in arusData" :key="bulan" class="col-md-6">
              <div class="rekap-box">
                <div class="rekap-label">{{ bulan }}</div>
                <div class="d-flex justify-content-between">
                  <div class="text-success"><small class="fw-bold d-block">MASUK</small><b>{{ fmt(data.MASUK) }}</b></div>
                  <div class="text-danger"><small class="fw-bold d-block">KELUAR</small><b>{{ fmt(data.KELUAR) }}</b></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../../firebase'

const emit = defineEmits(['close'])
const arusData = ref({})
const fmt = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })

onMounted(async () => {
  const snap = await get(dbRef(db, 'riwayat_transaksi'))
  const all = snap.val() || {}
  const res = {}
  Object.values(all).forEach(p => Object.values(p).forEach(t => {
    const b = t.tanggal?.substring(0, 7) || 'LAIN'
    if (!res[b]) res[b] = { MASUK: 0, KELUAR: 0 }
    if (t.tipe === 'MASUK') res[b].MASUK += parseFloat(t.qty) || 0
    if (t.tipe === 'KELUAR') res[b].KELUAR += parseFloat(t.qty) || 0
  }))
  arusData.value = res
})
</script>

<style scoped>
.modern-modal { border-radius: 24px; background: var(--bg-card); }
.backdrop-blur { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
.icon-circle { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.bg-primary-subtle { background: rgba(79, 70, 229, 0.1); color: #818cf8; }
.rekap-box { background: var(--bg-main); border: 1px solid var(--border-color); border-radius: 12px; padding: 15px; }
.rekap-label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
.btn-close-custom { opacity: 0.5; }
</style>
