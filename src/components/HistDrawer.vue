<template>
  <div class="modal fade show d-block backdrop-blur" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content modern-modal border-0 shadow-lg">
        
        <div class="modal-header border-0 pb-3">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2 m-0" style="color:var(--text-main)">
            <div class="icon-circle bg-primary-subtle text-primary"><i class="fas fa-history"></i></div>
            Arus Barang (Tampilan Klasik)
          </h5>
          <button type="button" class="btn-close btn-close-custom" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-0">
          <div class="table-responsive" style="max-height: 60vh;">
            <table class="table modern-table align-middle mb-0">
              <thead class="sticky-top">
                <tr>
                  <th style="width: 25%;">TANGGAL</th>
                  <th>KETERANGAN</th>
                  <th class="text-end">MASUK</th>
                  <th class="text-end">KELUAR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in arusDetail" :key="index">
                  <td class="font-monospace fw-bold" style="color:var(--text-muted)">{{ formatDate(row.tanggal) }}</td>
                  <td class="fw-medium" style="color:var(--text-main)">{{ row.keterangan }}</td>
                  <td class="text-end text-success fw-bold">{{ row.tipe === 'MASUK' ? fmt(row.qty) : '-' }}</td>
                  <td class="text-end text-danger fw-bold">{{ row.tipe === 'KELUAR' ? fmt(row.qty) : '-' }}</td>
                </tr>
                <tr v-if="!arusDetail.length">
                  <td colspan="4" class="text-center py-5 text-muted">Belum ada transaksi.</td>
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
const arusDetail = ref([])

const fmt = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatDate = (iso) => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

onMounted(async () => {
  const snap = await get(dbRef(db, 'riwayat_transaksi'))
  const all = snap.val() || {}
  const temp = []
  
  // Ambil semua data tanpa di-grouping (format klasik)
  Object.values(all).forEach(p => Object.values(p).forEach(t => {
    temp.push({
      tanggal: t.tanggal,
      keterangan: (t.keterangan || '-').toUpperCase(),
      tipe: t.tipe,
      qty: parseFloat(t.qty) || 0
    })
  }))
  
  // Sortir dari yang terbaru ke terlama
  arusDetail.value = temp.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
})

const exportExcel = () => {
  const rows = [['TANGGAL', 'KETERANGAN', 'TIPE', 'QTY'], ...arusDetail.value.map(r => [r.tanggal, r.keterangan, r.tipe, r.qty])]
  const ws = window.XLSX.utils.aoa_to_sheet(rows)
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'ArusBarang')
  window.XLSX.writeFile(wb, 'Arus_Barang.xlsx')
}
</script>

<style scoped>
/* Styling Klasik tapi Modern */
.modern-modal { border-radius: 24px; background: var(--bg-card); }
.backdrop-blur { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
.icon-circle { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.bg-primary-subtle { background: rgba(79, 70, 229, 0.1); }
.modern-table th { background: var(--bg-main); color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; padding: 12px; }
.modern-table td { color: var(--text-main); font-size: 0.85rem; padding: 12px; border-bottom: 1px solid var(--border-color); }
.btn-close-custom { opacity: 0.5; }
</style>
