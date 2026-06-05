<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow">

        <!-- HEADER -->
        <div class="modal-header text-white" style="background-color:#6f42c1">
          <div class="w-100">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="modal-title fw-bold">Laporan Arus Bulanan</h5>
              <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
            </div>
            <div class="input-group input-group-sm shadow-sm">
              <input type="month" class="form-control border-0 fw-bold"
                     v-model="blnPicker" @change="loadData">
              <button class="btn btn-light text-primary fw-bold" @click="loadData">
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
          <div class="table-responsive" style="max-height:50vh;overflow-y:auto">
            <table class="table table-striped mb-0 align-middle text-center small">
              <thead class="table-light sticky-top shadow-sm">
                <tr>
                  <th>TANGGAL</th>
                  <th>KETERANGAN</th>
                  <th class="text-success">TOTAL MASUK (Kg)</th>
                  <th class="text-danger">TOTAL KELUAR (Kg)</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="loading">
                  <tr><td colspan="4" class="text-center py-4">
                    <div class="spinner-border text-primary"></div>
                  </td></tr>
                </template>
                <template v-else-if="rows.length">
                  <tr v-for="r in rows" :key="r.key">
                    <td class="fw-bold">{{ formatDate(r.date) }}</td>
                    <td>
                      <span class="badge badge-ket text-uppercase shadow-sm"
                            :class="ketBadgeClass(r.ket)">
                        {{ r.ket }}
                      </span>
                    </td>
                    <td class="text-success fw-bold">{{ r.in > 0 ? fmt(r.in) : '-' }}</td>
                    <td class="text-danger fw-bold">{{ r.out > 0 ? fmt(r.out) : '-' }}</td>
                  </tr>
                </template>
                <template v-else>
                  <tr><td colspan="4" class="text-center py-5 text-muted">
                    Tidak ada data bulan ini
                  </td></tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer bg-light py-2 d-flex justify-content-between fw-bold small">
          <div>Total Masuk: <span class="text-success">{{ fmt(grandIn) }} Kg</span></div>
          <div>Total Keluar: <span class="text-danger">{{ fmt(grandOut) }} Kg</span></div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../../firebase'

const emit = defineEmits(['close'])

const blnPicker = ref(new Date().toISOString().slice(0, 7))
const loading   = ref(false)
const rows      = ref([])

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const grandIn  = computed(() => rows.value.reduce((s, r) => s + r.in, 0))
const grandOut = computed(() => rows.value.reduce((s, r) => s + r.out, 0))

const formatDate = d => new Date(d).toLocaleDateString('id-ID', {
  day: '2-digit', month: 'short', year: 'numeric'
})

const ketBadgeClass = ket => {
  const t = (ket || '').toUpperCase()
  if (t.includes('AJL'))     return 'bg-primary'
  if (t.includes('WARPING')) return 'bg-danger'
  if (t.includes('WEAVING')) return 'bg-warning text-dark'
  if (t.includes('KELOS'))   return 'bg-success'
  return 'bg-secondary'
}

const loadData = async () => {
  if (!blnPicker.value) return
  loading.value = true
  rows.value = []
  try {
    const snap = await get(dbRef(db, 'riwayat_transaksi'))
    const all  = snap.val() || {}
    const breakdown = {}

    Object.values(all).forEach(trxs => {
      Object.values(trxs || {}).forEach(trx => {
        const d = (trx.tanggal || '').split('T')[0]
        if (!d.startsWith(blnPicker.value)) return
        if (!['MASUK', 'KELUAR'].includes(trx.tipe)) return
        const ket = (trx.keterangan || '-').toUpperCase().trim() || '-'
        const key = `${d}||${ket}`
        if (!breakdown[key]) breakdown[key] = { date: d, ket, in: 0, out: 0, key }
        const q = parseFloat(trx.qty) || 0
        if (trx.tipe === 'MASUK')  breakdown[key].in  += q
        else                        breakdown[key].out += q
      })
    })

    rows.value = Object.values(breakdown).sort((a, b) =>
      a.date.localeCompare(b.date) || a.ket.localeCompare(b.ket)
    )
  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  } finally {
    loading.value = false
  }
}

const exportExcel = () => {
  if (!rows.value.length) return
  const data = [
    ['TANGGAL', 'KETERANGAN', 'TOTAL MASUK (KG)', 'TOTAL KELUAR (KG)'],
    ...rows.value.map(r => [r.date, r.ket, r.in, r.out])
  ]
  const ws = window.XLSX.utils.aoa_to_sheet(data)
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Bulanan')
  window.XLSX.writeFile(wb, `Laporan_Bulanan_${blnPicker.value}.xlsx`)
}

onMounted(() => loadData())
</script>

<style scoped>
.badge-ket {
  font-size: .75rem; padding: 5px 8px;
  border-radius: 6px; font-weight: 600;
  white-space: normal; text-align: left; line-height: 1.2;
}
</style>
