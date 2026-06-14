<template>
  <div class="modal fade show d-block backdrop-blur" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content modern-modal border-0 shadow-lg">
        
        <div class="modal-header border-0 pb-3">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2 m-0" style="color:var(--text-main)">
            <div class="icon-circle bg-primary-subtle text-primary"><i class="fas fa-list-ul"></i></div>
            Arus Barang per Keterangan
          </h5>
          <button type="button" class="btn-close btn-close-custom" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-0">
          <div class="table-responsive" style="max-height: 60vh;">
            <table class="table modern-table align-middle mb-0">
              <thead class="sticky-top">
                <tr>
                  <th>KETERANGAN</th>
                  <th class="text-end text-success">TOTAL MASUK</th>
                  <th class="text-end text-danger">TOTAL KELUAR</th>
                  <th class="text-end text-primary">NETTO</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(val, ket) in arusData" :key="ket">
                  <td class="fw-bold" style="color:var(--text-main)">{{ ket }}</td>
                  <td class="text-end text-success fw-bold">{{ fmt(val.MASUK) }}</td>
                  <td class="text-end text-danger fw-bold">{{ fmt(val.KELUAR) }}</td>
                  <td class="text-end fw-bold" :class="val.NETTO >= 0 ? 'text-primary' : 'text-danger'">
                    {{ fmt(val.NETTO) }}
                  </td>
                </tr>
                <tr v-if="!Object.keys(arusData).length">
                  <td colspan="4" class="text-center py-5 text-muted">Data kosong.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer border-0 p-3">
          <button class="btn btn-sm btn-success fw-bold w-100" @click="exportExcel">
            <i class="fas fa-file-excel me-1"></i> Export Excel
          </button>
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
const fmt = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

onMounted(async () => {
  const snap = await get(dbRef(db, 'riwayat_transaksi'))
  const all = snap.val() || {}
  const res = {}
  
  Object.values(all).forEach(p => Object.values(p).forEach(t => {
    const ket = (t.keterangan || 'LAIN-LAIN').toUpperCase()
    if (!res[ket]) res[ket] = { MASUK: 0, KELUAR: 0, NETTO: 0 }
    
    if (t.tipe === 'MASUK') {
      res[ket].MASUK += parseFloat(t.qty) || 0
      res[ket].NETTO += parseFloat(t.qty) || 0
    } else if (t.tipe === 'KELUAR') {
      res[ket].KELUAR += parseFloat(t.qty) || 0
      res[ket].NETTO -= parseFloat(t.qty) || 0
    }
  }))
  arusData.value = res
})

const exportExcel = () => {
  const rows = [['KETERANGAN', 'TOTAL MASUK', 'TOTAL KELUAR', 'NETTO'], ...Object.entries(arusData.value).map(([k,v]) => [k, v.MASUK, v.KELUAR, v.NETTO])]
  const ws = window.XLSX.utils.aoa_to_sheet(rows)
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'ArusBarang')
  window.XLSX.writeFile(wb, 'Arus_Barang_Per_Keterangan.xlsx')
}
</script>

<style scoped>
.modern-modal { border-radius: 24px; background: var(--bg-card); }
.backdrop-blur { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
.icon-circle { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.bg-primary-subtle { background: rgba(79, 70, 229, 0.1); }
.modern-table th { background: var(--bg-main); color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; padding: 12px; border-bottom: 2px solid var(--border-color); }
.modern-table td { color: var(--text-main); font-size: 0.85rem; padding: 12px; }
.btn-close-custom { opacity: 0.5; }
</style>
