<template>
  <div class="modal fade show d-block backdrop-blur" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content modern-modal border-0 shadow-lg">
        <div class="modal-header border-0 pb-3">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2 m-0" style="color:var(--text-main)">
            <div class="icon-circle bg-success-subtle text-success"><i class="fas fa-exchange-alt"></i></div>
            Laporan Mutasi Stok
          </h5>
          <button type="button" class="btn-close btn-close-custom" @click="$emit('close')"></button>
        </div>

        <div class="px-4 pb-3">
          <div class="d-flex gap-2 align-items-center">
            <input type="month" class="form-control custom-input fw-bold" style="width: auto;" v-model="blnPicker" @change="loadData">
            <button class="btn btn-sm btn-light-action fw-bold px-3" @click="loadData"><i class="fas fa-sync-alt me-1"></i> Refresh</button>
            <button class="btn btn-sm btn-success fw-bold px-3" @click="exportExcel"><i class="fas fa-file-excel me-1"></i> Excel</button>
          </div>
        </div>

        <div class="modal-body p-0">
          <div class="table-responsive" style="max-height: 50vh;">
            <table class="table modern-table table-hover align-middle mb-0">
              <thead class="sticky-top">
                <tr>
                  <th>KODE ERP</th>
                  <th class="text-start">LOT / BARANG</th>
                  <th>SALDO AWAL</th>
                  <th class="text-success">MASUK</th>
                  <th class="text-danger">KELUAR</th>
                  <th class="text-primary">SALDO AKHIR</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading"><td colspan="6" class="text-center py-5"><div class="spinner-border text-primary"></div></td></tr>
                <tr v-else-if="logs.length" v-for="r in logs" :key="r.kode">
                  <td class="fw-bold font-monospace">{{ r.kode }}</td>
                  <td class="text-start">
                    <div class="fw-bold" style="color:var(--text-main)">{{ r.nama }}</div>
                    <div class="small" style="color:var(--text-muted)">{{ r.warna }} • {{ r.jenis }} • {{ r.grade }}</div>
                  </td>
                  <td class="fw-bold">{{ fmt(r.awal) }}</td>
                  <td class="text-success fw-bold">{{ r.masuk > 0 ? '+'+fmt(r.masuk) : '-' }}</td>
                  <td class="text-danger fw-bold">{{ r.keluar > 0 ? '-'+fmt(r.keluar) : '-' }}</td>
                  <td class="fw-bold text-primary">{{ fmt(r.akhir) }}</td>
                </tr>
                <tr v-else><td colspan="6" class="text-center py-5 text-muted">Tidak ada data periode ini.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer bg-main py-3 border-0 d-flex justify-content-between">
          <div class="text-uppercase small fw-bold" style="color:var(--text-muted)">Total Mutasi Periode Ini</div>
          <div class="d-flex gap-4">
            <div class="text-success">MASUK: <span class="fs-6 fw-bold">{{ fmt(totalMasuk) }}</span></div>
            <div class="text-danger">KELUAR: <span class="fs-6 fw-bold">{{ fmt(totalKeluar) }}</span></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../../firebase'
import { dbStok } from '../../composables/useStok'

const emit = defineEmits(['close'])
const blnPicker = ref(new Date().toISOString().slice(0, 7))
const loading = ref(false)
const logs = ref([])
const fmt = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })

const totalMasuk = computed(() => logs.value.reduce((s, r) => s + r.masuk, 0))
const totalKeluar = computed(() => logs.value.reduce((s, r) => s + r.keluar, 0))

const loadData = async () => {
  loading.value = true
  const snap = await get(dbRef(db, 'riwayat_transaksi'))
  const histories = snap.val() || {}
  const start = new Date(blnPicker.value + '-01')
  const end = new Date(new Date(start).setMonth(start.getMonth() + 1))
  const result = []

  dbStok.value.forEach(item => {
    let saldoAwal = Number(item.stokAwal) || 0
    let masuk = 0, keluar = 0
    Object.values(histories[item.idUnik] || {}).sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal)).forEach(log => {
      const d = new Date(log.tanggal)
      const q = Number(log.qty)
      if (d < start) {
        if (log.tipe === 'MASUK') saldoAwal += q
        else if (log.tipe === 'KELUAR') saldoAwal -= q
        else if (log.tipe === 'OPNAME') saldoAwal = q
      } else if (d < end) {
        if (log.tipe === 'MASUK') masuk += q
        else if (log.tipe === 'KELUAR') keluar += q
      }
    })
    if (masuk || keluar || saldoAwal) {
      result.push({ kode: item.kodeErp, nama: item.nama, warna: item.warna, jenis: item.jenis, grade: item.grade, awal: saldoAwal, masuk, keluar, akhir: saldoAwal + masuk - keluar })
    }
  })
  logs.value = result.sort((a, b) => (a.kode || '').localeCompare(b.kode || ''))
  loading.value = false
}

const exportExcel = () => {
  const rows = [['KODE ERP','NAMA','WARNA','JENIS','GRADE','SALDO AWAL','MASUK','KELUAR','SALDO AKHIR'], ...logs.value.map(r => [r.kode, r.nama, r.warna, r.jenis, r.grade, r.awal, r.masuk, r.keluar, r.akhir])]
  const ws = window.XLSX.utils.aoa_to_sheet(rows), wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Mutasi')
  window.XLSX.writeFile(wb, `Mutasi_${blnPicker.value}.xlsx`)
}

onMounted(loadData)
</script>

<style scoped>
.modern-modal { border-radius: 24px; background: var(--bg-card); }
.backdrop-blur { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
.icon-circle { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.bg-success-subtle { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.modern-table th { background: var(--bg-main); color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; padding: 12px; border-bottom: 2px solid var(--border-color); }
.modern-table td { color: var(--text-main); font-size: 0.85rem; padding: 12px; }
.btn-close-custom { opacity: 0.5; }
.custom-input { background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-main); }
</style>
