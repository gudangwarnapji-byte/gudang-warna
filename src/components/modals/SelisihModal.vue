<template>
  <div class="modal fade show d-block backdrop-blur" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content modern-modal border-0 shadow-lg">
        
        <div class="modal-header border-0 pb-3">
          <h5 class="fw-bold m-0 d-flex align-items-center gap-2" style="color:var(--text-main)">
            <div class="icon-circle bg-warning-subtle text-warning"><i class="fas fa-balance-scale"></i></div>
            Cek Selisih (Aplikasi vs ERP)
          </h5>
          <button type="button" class="btn-close btn-close-custom" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-4 pt-0">
          <div class="filter-card p-3 mb-4 rounded shadow-sm border">
            <div class="row align-items-end g-3">
              <div class="col-md-4">
                <label class="form-label">Pilih File Excel ERP</label>
                <input type="file" class="form-control custom-input" accept=".xlsx,.xls" @change="onFileChange">
              </div>
              <div class="col-md-3">
                <label class="form-label">Stok Per Tanggal</label>
                <input type="date" class="form-control custom-input" v-model="tglBanding">
              </div>
              <div class="col-md-2">
                <button class="btn btn-primary fw-bold w-100 shadow-sm" @click="prosesBanding">
                  <i class="fas fa-search me-1"></i> CEK DATA
                </button>
              </div>
              <div class="col-md-3 text-md-end">
                <div class="small fw-bold" style="color:var(--text-muted)">TOTAL SELISIH</div>
                <div class="fs-4 fw-bold text-danger">{{ fmt(totalSelisih) }} Kg</div>
              </div>
            </div>
          </div>

          <div class="table-container shadow-sm">
            <table class="table modern-table table-hover align-middle mb-0">
              <thead class="sticky-top">
                <tr>
                  <th>KODE ERP</th>
                  <th class="text-start">NAMA BARANG</th>
                  <th>STOK APLIKASI</th>
                  <th>STOK ERP</th>
                  <th>SELISIH</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!hasil.length"><td colspan="6" class="text-center py-5 text-muted">Silakan upload file Excel ERP untuk memulai pengecekan.</td></tr>
                <tr v-for="d in hasil" :key="d.kode" :class="d.stat !== 'OK' ? 'row-diff' : ''">
                  <td class="fw-bold font-monospace">{{ d.kode }}</td>
                  <td class="text-start fw-medium">{{ d.nama }}</td>
                  <td class="fw-bold">{{ fmt(d.app) }}</td>
                  <td style="color:var(--text-muted)">{{ fmt(d.erp) }}</td>
                  <td class="fw-bold" :class="d.diff > 0 ? 'text-primary' : d.diff < 0 ? 'text-danger' : 'text-muted'">
                    {{ d.diff > 0 ? '+' : '' }}{{ fmt(d.diff) }}
                  </td>
                  <td>
                    <span v-if="d.stat === 'OK'" class="badge-soft badge-soft-success"><i class="fas fa-check"></i> OK</span>
                    <span v-else class="badge-soft badge-soft-danger"><i class="fas fa-times"></i> {{ d.stat }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer border-0 p-4 pt-0">
          <button class="btn btn-success fw-bold w-100 shadow-sm" style="border-radius:12px; padding:12px;" @click="exportExcel" :disabled="!hasil.length">
            <i class="fas fa-file-download me-1"></i> Download Laporan Selisih
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../../firebase'
import { dbStok } from '../../composables/useStok'

const emit = defineEmits(['close'])
const tglBanding = ref('')
const fileErp    = ref(null)
const hasil      = ref([])

const fmt = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const totalSelisih = computed(() => hasil.value.filter(d => d.stat !== 'OK').reduce((s, d) => s + Math.abs(d.diff), 0))
const onFileChange = e => { fileErp.value = e.target.files[0] || null }

const prosesBanding = async () => {
  if (!fileErp.value) { window.Swal.fire('File Kosong', 'Pilih file Excel ERP dulu.', 'warning'); return }
  window.Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading() })
  try {
    const buffer = await fileErp.value.arrayBuffer()
    const wb  = window.XLSX.read(new Uint8Array(buffer), { type: 'array' })
    const raw = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])
    const mapErp = {}
    raw.forEach(r => {
      const keyKode = Object.keys(r).find(k => k.toUpperCase().includes('KODE'))
      const keyQty  = Object.keys(r).find(k => k.toUpperCase().includes('QTY') || k.toUpperCase().includes('STOK'))
      if (keyKode && keyQty) {
        const k = String(r[keyKode]).trim().toUpperCase()
        mapErp[k] = (mapErp[k] || 0) + (parseFloat(r[keyQty]) || 0)
      }
    })

    let stokAppMap = {}
    if (!tglBanding.value) {
      dbStok.value.forEach(i => { stokAppMap[i.kodeErp] = { qty: parseFloat(i.stok) || 0, nama: i.nama } })
    } else {
      const snap = await get(dbRef(db, 'riwayat_transaksi'))
      const history = snap.val() || {}
      const cutoff  = new Date(tglBanding.value)
      cutoff.setHours(23, 59, 59, 999)
      dbStok.value.forEach(item => {
        let run = parseFloat(item.stokAwal) || 0
        const logs = history[item.idUnik]
        if (logs) {
          Object.values(logs).sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal)).forEach(l => {
            if (new Date(l.tanggal) <= cutoff) {
              const q = parseFloat(l.qty)
              if (l.tipe === 'MASUK') run += q; else if (l.tipe === 'KELUAR') run -= q; else if (l.tipe === 'OPNAME') run = q
              run = parseFloat(run.toFixed(2))
            }
          })
        }
        stokAppMap[item.kodeErp] = { qty: run, nama: item.nama }
      })
    }

    const data = []
    const processed = new Set()
    Object.keys(stokAppMap).forEach(kode => {
      const stokApp = stokAppMap[kode].qty
      const stokErp = mapErp[kode] ?? 0
      const selisih = stokApp - stokErp
      data.push({ kode, nama: stokAppMap[kode].nama, app: stokApp, erp: stokErp, diff: selisih, stat: Math.abs(selisih) < 0.01 ? 'OK' : 'DIFF' })
      processed.add(kode)
    })
    Object.keys(mapErp).forEach(k => { if (!processed.has(k)) data.push({ kode: k, nama: '(Tidak ada di App)', app: 0, erp: mapErp[k], diff: -mapErp[k], stat: 'MISSING' }) })
    hasil.value = data.sort((a, b) => (a.stat === 'OK' && b.stat !== 'OK') ? 1 : -1)
    window.Swal.close()
  } catch(e) { window.Swal.fire('Error', e.message, 'error') }
}

const exportExcel = () => {
  if (!hasil.value.length) return
  const rows = [['KODE ERP', 'NAMA BARANG', 'STOK APP', 'STOK ERP', 'SELISIH', 'STATUS'], ...hasil.value.map(d => [d.kode, d.nama, d.app, d.erp, d.diff, d.stat])]
  const ws = window.XLSX.utils.aoa_to_sheet(rows); const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Selisih'); window.XLSX.writeFile(wb, 'Laporan_Selisih_Stok.xlsx')
}
</script>

<style scoped>
.modern-modal { border-radius: 24px; background: var(--bg-card); }
.backdrop-blur { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
.icon-circle { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.bg-warning-subtle { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
.filter-card { background: var(--bg-main); border: 1px solid var(--border-color); }
.custom-input { background: var(--bg-card); border: 1px solid var(--border-color); color: var(--text-main); }
.table-container { border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); }
.modern-table th { background: var(--bg-main); color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; padding: 12px; }
.modern-table td { color: var(--text-main); padding: 12px; }
.row-diff { background: rgba(239, 68, 68, 0.05); }
.badge-soft { font-size: 0.7rem; padding: 3px 8px; border-radius: 6px; font-weight: 700; }
.badge-soft-success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.badge-soft-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.btn-close-custom { opacity: 0.5; }
</style>
