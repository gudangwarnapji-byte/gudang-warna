<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-lg modal-dialog-centered">
      <div class="modal-content border-0 shadow-lg">
        <!-- HEADER -->
        <div class="modal-header bg-success text-white fw-bold">
          <h5 class="modal-title">
            <i class="fas fa-exchange-alt me-2"></i>Laporan Mutasi Barang
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- BODY -->
        <div class="modal-body">
          <!-- DATE PICKER -->
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="small fw-bold text-muted">Dari Tanggal</label>
              <input type="date" v-model="tglMulai" class="form-control">
            </div>
            <div class="col-6">
              <label class="small fw-bold text-muted">Sampai Tanggal</label>
              <input type="date" v-model="tglAkhir" class="form-control">
            </div>
          </div>

          <!-- LOADING -->
          <div v-if="loading" class="text-center py-4">
            <div class="spinner-border text-success" role="status"></div>
            <p class="mt-2 text-muted small">Memproses data...</p>
          </div>

          <!-- DATA TABEL -->
          <div v-else-if="mutasiData.length">
            <div class="table-responsive" style="max-height:500px;overflow-y:auto">
              <table class="table table-sm table-bordered mb-0">
                <thead class="sticky-top bg-light">
                  <tr>
                    <th class="text-center fw-bold" style="font-size:.8rem">Kode ERP</th>
                    <th class="text-center fw-bold" style="font-size:.8rem">Nama Barang</th>
                    <th class="text-center fw-bold text-success" style="font-size:.8rem">Masuk</th>
                    <th class="text-center fw-bold text-danger" style="font-size:.8rem">Keluar</th>
                    <th class="text-center fw-bold" style="font-size:.8rem">Netto</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in mutasiData" :key="item.idUnik" :class="item.netto >= 0 ? 'table-success' : 'table-danger'">
                    <td class="fw-bold text-primary" style="font-size:.8rem">{{ item.kodeErp }}</td>
                    <td style="font-size:.8rem">{{ item.nama }}</td>
                    <td class="text-center text-success fw-bold" style="font-size:.85rem">+{{ fmt(item.masuk) }}</td>
                    <td class="text-center text-danger fw-bold" style="font-size:.85rem">-{{ fmt(item.keluar) }}</td>
                    <td class="text-center fw-bold" style="font-size:.85rem">
                      <span :class="item.netto >= 0 ? 'text-success' : 'text-danger'">
                        {{ item.netto >= 0 ? '+' : '' }}{{ fmt(item.netto) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot class="bg-light fw-bold">
                  <tr>
                    <td colspan="2" class="text-end">TOTAL:</td>
                    <td class="text-center text-success">+{{ fmt(totalMasuk) }}</td>
                    <td class="text-center text-danger">-{{ fmt(totalKeluar) }}</td>
                    <td class="text-center" :class="totalNetto >= 0 ? 'text-success' : 'text-danger'">
                      {{ totalNetto >= 0 ? '+' : '' }}{{ fmt(totalNetto) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- EMPTY -->
          <div v-else class="text-center py-5 text-muted">
            <i class="fas fa-inbox" style="font-size:2rem;opacity:.3"></i>
            <p class="mt-2 small">Tidak ada data untuk periode ini</p>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer bg-light border-top">
          <button type="button" class="btn btn-sm btn-success" @click="exportExcel" :disabled="!mutasiData.length">
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
import { dbStok } from '../../composables/useStok'

const emit = defineEmits(['close'])

const tglMulai = ref('')
const tglAkhir = ref('')
const loading = ref(false)
const mutasiData = ref([])

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const totalMasuk = computed(() => mutasiData.value.reduce((a, b) => a + (b.masuk || 0), 0))
const totalKeluar = computed(() => mutasiData.value.reduce((a, b) => a + (b.keluar || 0), 0))
const totalNetto = computed(() => totalMasuk.value - totalKeluar.value)

const loadMutasi = () => {
  if (!tglMulai.value || !tglAkhir.value) return
  
  loading.value = true
  mutasiData.value = []
  
  onValue(dbRef(db, 'riwayat_transaksi'), snap => {
    loading.value = false
    const all = snap.val()
    const hasil = {}
    
    if (all) {
      Object.keys(all).forEach(pId => {
        const item = dbStok.value.find(x => x.idUnik === pId)
        if (!item) return
        
        let masuk = 0, keluar = 0
        Object.values(all[pId] || {}).forEach(trx => {
          const tgl = trx.tanggal?.slice(0, 10)
          if (tgl >= tglMulai.value && tgl <= tglAkhir.value) {
            const qty = Number(trx.qty) || 0
            if (trx.tipe === 'MASUK') masuk += qty
            else if (trx.tipe === 'KELUAR') keluar += qty
          }
        })
        
        if (masuk > 0 || keluar > 0) {
          hasil[pId] = {
            idUnik: pId,
            kodeErp: item.kodeErp,
            nama: item.nama,
            masuk,
            keluar,
            netto: masuk - keluar
          }
        }
      })
    }
    
    mutasiData.value = Object.values(hasil).sort((a, b) => (b.netto || 0) - (a.netto || 0))
  }, { onlyOnce: true })
}

const exportExcel = () => {
  if (!mutasiData.value.length) return
  const rows = [
    ['LAPORAN MUTASI BARANG'],
    ['Periode:', `${tglMulai.value} s/d ${tglAkhir.value}`],
    [],
    ['KODE ERP', 'NAMA BARANG', 'MASUK (KG)', 'KELUAR (KG)', 'NETTO (KG)'],
    ...mutasiData.value.map(item => [
      item.kodeErp,
      item.nama,
      item.masuk,
      item.keluar,
      item.netto
    ]),
    [],
    ['TOTAL', '', totalMasuk.value, totalKeluar.value, totalNetto.value]
  ]
  const ws = window.XLSX.utils.aoa_to_sheet(rows)
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Mutasi')
  window.XLSX.writeFile(wb, `Laporan_Mutasi_${tglMulai.value}_${tglAkhir.value}.xlsx`)
}

watch([tglMulai, tglAkhir], () => loadMutasi())

onMounted(() => {
  const today = new Date()
  const first = new Date(today.getFullYear(), today.getMonth(), 1)
  tglMulai.value = first.toISOString().slice(0, 10)
  tglAkhir.value = today.toISOString().slice(0, 10)
})
</script>

<style scoped>
.table-sm th { padding: 8px 4px; }
.table-sm td { padding: 6px 4px; }
</style>
