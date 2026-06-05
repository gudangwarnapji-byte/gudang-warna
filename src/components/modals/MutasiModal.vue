<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content border-0 shadow">

        <!-- HEADER -->
        <div class="modal-header text-white" style="background-color:#20c997">
          <div class="w-100">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="modal-title fw-bold">Laporan Mutasi Stok</h5>
              <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
            </div>
            <div class="input-group input-group-sm shadow-sm">
              <input type="month" class="form-control border-0 fw-bold"
                     v-model="blnPicker" @change="loadData">
              <button class="btn btn-light text-success fw-bold" @click="loadData">
                <i class="fas fa-sync-alt"></i>
              </button>
              <button class="btn btn-success fw-bold ms-1" @click="exportExcel">
                <i class="fas fa-file-excel"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- BODY -->
        <div class="modal-body p-0">
          <div class="table-responsive" style="max-height:60vh;overflow-y:auto">
            <table class="table table-bordered table-striped mb-0 align-middle text-center small">
              <thead class="table-light sticky-top shadow-sm">
                <tr>
                  <th>KODE ERP</th>
                  <th class="text-start">LOT</th>
                  <th>WARNA</th>
                  <th>JENIS</th>
                  <th>GRADE</th>
                  <th class="bg-light text-primary">SALDO AWAL</th>
                  <th class="text-success">MASUK</th>
                  <th class="text-danger">KELUAR</th>
                  <th class="bg-light text-primary">SALDO AKHIR</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="loading">
                  <tr><td colspan="9" class="text-center py-5">
                    <div class="spinner-border text-success"></div>
                  </td></tr>
                </template>
                <template v-else-if="logs.length">
                  <tr v-for="r in logs" :key="r.kode">
                    <td class="fw-bold font-monospace">{{ r.kode }}</td>
                    <td class="text-start">{{ r.nama }}</td>
                    <td class="small text-muted">{{ r.warna }}</td>
                    <td class="small text-muted">{{ r.jenis }}</td>
                    <td class="small text-muted">{{ r.grade }}</td>
                    <td class="bg-light fw-bold">{{ fmt(r.awal) }}</td>
                    <td class="text-success">{{ r.masuk > 0 ? fmt(r.masuk) : '-' }}</td>
                    <td class="text-danger">{{ r.keluar > 0 ? fmt(r.keluar) : '-' }}</td>
                    <td class="bg-light fw-bold text-primary">{{ fmt(r.akhir) }}</td>
                  </tr>
                </template>
                <template v-else>
                  <tr><td colspan="9" class="text-center py-4 text-muted">
                    Tidak ada data bulan ini
                  </td></tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer bg-light py-2 d-flex justify-content-between fw-bold border-top"
             style="font-size:.9rem">
          <div class="text-muted text-uppercase small">Total Mutasi Periode Ini</div>
          <div class="d-flex gap-4">
            <div class="text-success">Total Masuk: <span class="fs-6">{{ fmt(totalMasuk) }}</span> Kg</div>
            <div class="text-danger">Total Keluar: <span class="fs-6">{{ fmt(totalKeluar) }}</span> Kg</div>
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
const loading   = ref(false)
const logs      = ref([])

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const totalMasuk  = computed(() => logs.value.reduce((s, r) => s + r.masuk, 0))
const totalKeluar = computed(() => logs.value.reduce((s, r) => s + r.keluar, 0))

const loadData = async () => {
  if (!blnPicker.value) return
  loading.value = true
  logs.value = []
  try {
    const snap = await get(dbRef(db, 'riwayat_transaksi'))
    const histories = snap.val() || {}
    const start = new Date(blnPicker.value + '-01')
    const end   = new Date(new Date(start).setMonth(start.getMonth() + 1))
    const result = []

    dbStok.value.forEach(item => {
      let saldoAwal = Number(item.stokAwal) || 0
      let masuk = 0, keluar = 0

      Object.values(histories[item.idUnik] || {})
        .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
        .forEach(log => {
          const d = new Date(log.tanggal)
          const q = Number(log.qty)
          if (d < start) {
            if (log.tipe === 'MASUK')  saldoAwal += q
            else if (log.tipe === 'KELUAR') saldoAwal -= q
            else if (log.tipe === 'OPNAME') saldoAwal = q
          } else if (d < end) {
            if (log.tipe === 'MASUK')  masuk  += q
            else if (log.tipe === 'KELUAR') keluar += q
          }
        })

      const saldoAkhir = saldoAwal + masuk - keluar
      if (saldoAwal || masuk || keluar || saldoAkhir) {
        result.push({
          kode:   item.kodeErp,
          nama:   item.nama,
          warna:  item.warna  || '-',
          jenis:  item.jenis  || '-',
          grade:  item.grade  || '-',
          awal:   saldoAwal,
          masuk,
          keluar,
          akhir:  saldoAkhir
        })
      }
    })

    logs.value = result.sort((a, b) => (a.kode || '').localeCompare(b.kode || ''))
  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  } finally {
    loading.value = false
  }
}

const exportExcel = () => {
  if (!logs.value.length) return
  const rows = [
    ['KODE ERP','NAMA BARANG','WARNA','JENIS','GRADE','SALDO AWAL','MASUK','KELUAR','SALDO AKHIR'],
    ...logs.value.map(r => [r.kode, r.nama, r.warna, r.jenis, r.grade, r.awal, r.masuk, r.keluar, r.akhir])
  ]
  const ws = window.XLSX.utils.aoa_to_sheet(rows)
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Mutasi')
  window.XLSX.writeFile(wb, `Mutasi_Stok_${blnPicker.value}.xlsx`)
}

onMounted(() => loadData())
</script>
