<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <!-- HEADER -->
        <div class="modal-header bg-purple text-white fw-bold" style="background:#6f42c1">
          <h5 class="modal-title">
            <i class="fas fa-chart-bar me-2"></i>Laporan Arus Bulanan
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- BODY -->
        <div class="modal-body">
          <!-- MONTH SELECTOR -->
          <div class="mb-3">
            <label class="small fw-bold text-muted">Pilih Bulan & Tahun</label>
            <input type="month" v-model="bulanTahun" class="form-control">
          </div>

          <!-- LOADING -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="mt-2 text-muted small">Memproses data...</p>
          </div>

          <!-- CHART & DATA -->
          <div v-else-if="chartData.length">
            <!-- SUMMARY CARDS -->
            <div class="row g-2 mb-3">
              <div class="col-4">
                <div class="card border-0 bg-success text-white text-center">
                  <div class="card-body py-2">
                    <small class="d-block fw-bold" style="font-size:.7rem">TOTAL MASUK</small>
                    <div class="fw-bold" style="font-size:1.1rem">+{{ fmt(totalMasuk) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-4">
                <div class="card border-0 bg-danger text-white text-center">
                  <div class="card-body py-2">
                    <small class="d-block fw-bold" style="font-size:.7rem">TOTAL KELUAR</small>
                    <div class="fw-bold" style="font-size:1.1rem">-{{ fmt(totalKeluar) }}</div>
                  </div>
                </div>
              </div>
              <div class="col-4">
                <div class="card border-0 text-center" :style="`background:${totalNetto >= 0 ? '#198754' : '#dc3545'}`" style="color:white">
                  <div class="card-body py-2">
                    <small class="d-block fw-bold" style="font-size:.7rem">NETTO</small>
                    <div class="fw-bold" style="font-size:1.1rem">{{ totalNetto >= 0 ? '+' : '' }}{{ fmt(totalNetto) }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- TABLE -->
            <div class="table-responsive" style="max-height:400px;overflow-y:auto">
              <table class="table table-sm table-bordered mb-0">
                <thead class="sticky-top bg-light">
                  <tr>
                    <th class="text-center fw-bold" style="font-size:.8rem">Tanggal</th>
                    <th class="text-center fw-bold" style="font-size:.8rem">Masuk</th>
                    <th class="text-center fw-bold" style="font-size:.8rem">Keluar</th>
                    <th class="text-center fw-bold" style="font-size:.8rem">Netto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="data in chartData" :key="data.tgl">
                    <td class="fw-bold" style="font-size:.8rem">{{ formatDate(data.tgl) }}</td>
                    <td class="text-center text-success fw-bold" style="font-size:.85rem">+{{ fmt(data.masuk) }}</td>
                    <td class="text-center text-danger fw-bold" style="font-size:.85rem">-{{ fmt(data.keluar) }}</td>
                    <td class="text-center fw-bold" style="font-size:.85rem">
                      <span :class="data.netto >= 0 ? 'text-success' : 'text-danger'">
                        {{ data.netto >= 0 ? '+' : '' }}{{ fmt(data.netto) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- EMPTY -->
          <div v-else class="text-center py-5 text-muted">
            <i class="fas fa-inbox" style="font-size:2rem;opacity:.3"></i>
            <p class="mt-2 small">Tidak ada data untuk bulan ini</p>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer bg-light border-top">
          <button type="button" class="btn btn-sm btn-primary" @click="exportExcel" :disabled="!chartData.length">
            <i class="fas fa-download me-1"></i>Export Excel
          </button>
          <button type="button" class="btn btn-sm btn-secondary" @click="$emit('close')">
            Tutup
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { db } from '../../firebase'

const emit = defineEmits(['close'])

const bulanTahun = ref('')
const loading = ref(false)
const chartData = ref([])

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const formatDate = dateStr => {
  return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}

const totalMasuk = computed(() => chartData.value.reduce((a, b) => a + (b.masuk || 0), 0))
const totalKeluar = computed(() => chartData.value.reduce((a, b) => a + (b.keluar || 0), 0))
const totalNetto = computed(() => totalMasuk.value - totalKeluar.value)

const loadBulanan = () => {
  if (!bulanTahun.value) return
  
  loading.value = true
  chartData.value = []
  
  onValue(dbRef(db, 'riwayat_transaksi'), snap => {
    loading.value = false
    const all = snap.val()
    const byDate = {}
    
    if (all) {
      Object.values(all).forEach(itemHist => {
        Object.values(itemHist || {}).forEach(trx => {
          const tgl = trx.tanggal?.slice(0, 10)
          if (tgl?.startsWith(bulanTahun.value)) {
            if (!byDate[tgl]) byDate[tgl] = { tgl, masuk: 0, keluar: 0 }
            const qty = Number(trx.qty) || 0
            if (trx.tipe === 'MASUK') byDate[tgl].masuk += qty
            else if (trx.tipe === 'KELUAR') byDate[tgl].keluar += qty
          }
        })
      })
    }
    
    chartData.value = Object.values(byDate)
      .sort((a, b) => new Date(a.tgl) - new Date(b.tgl))
      .map(d => ({ ...d, netto: d.masuk - d.keluar }))
  }, { onlyOnce: true })
}

const exportExcel = () => {
  if (!chartData.value.length) return
  const [tahun, bulan] = bulanTahun.value.split('-')
  const namaBulan = ['','Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][parseInt(bulan)]
  const rows = [
    ['LAPORAN ARUS BULANAN'],
    ['Periode:', `${namaBulan} ${tahun}`],
    [],
    ['TANGGAL', 'MASUK (KG)', 'KELUAR (KG)', 'NETTO (KG)'],
    ...chartData.value.map(d => [
      formatDate(d.tgl),
      d.masuk,
      d.keluar,
      d.netto
    ]),
    [],
    ['TOTAL BULAN', totalMasuk.value, totalKeluar.value, totalNetto.value]
  ]
  const ws = window.XLSX.utils.aoa_to_sheet(rows)
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Arus')
  window.XLSX.writeFile(wb, `Laporan_Arus_Bulanan_${bulanTahun.value}.xlsx`)
}

watch(bulanTahun, () => loadBulanan())

onMounted(() => {
  const today = new Date()
  bulanTahun.value = today.toISOString().slice(0, 7)
})
</script>

<style scoped>
.table-sm th { padding: 8px 4px; }
.table-sm td { padding: 6px 4px; }
</style>
