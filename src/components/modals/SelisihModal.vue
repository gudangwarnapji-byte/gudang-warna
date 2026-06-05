<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content border-0 shadow">

        <!-- HEADER -->
        <div class="modal-header bg-dark text-white">
          <h5 class="modal-title fw-bold">
            <i class="fas fa-balance-scale me-2"></i>Cek Selisih (Aplikasi vs ERP)
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- BODY -->
        <div class="modal-body">
          <div class="row align-items-end mb-4 g-2">
            <div class="col-md-4">
              <label class="small fw-bold mb-1">Pilih File Excel ERP</label>
              <input type="file" class="form-control" accept=".xlsx,.xls" @change="onFileChange">
            </div>
            <div class="col-md-3">
              <label class="small fw-bold mb-1">Stok Per Tanggal:</label>
              <input type="date" class="form-control fw-bold shadow-sm"
                     style="background:#e8f0fe" v-model="tglBanding">
              <div class="form-text small text-primary" style="font-size:.7rem">
                Biarkan kosong jika cek stok HARI INI.
              </div>
            </div>
            <div class="col-md-2">
              <button class="btn btn-primary fw-bold w-100" @click="prosesBanding">
                <i class="fas fa-search me-1"></i> CEK DATA
              </button>
            </div>
            <div class="col-md-3 text-end">
              <h4 class="fw-bold mb-0">{{ fmt(totalSelisih) }} Kg</h4>
              <small class="text-muted">Total Selisih</small>
            </div>
          </div>

          <div class="table-responsive" style="max-height:50vh;overflow-y:auto">
            <table class="table table-sm table-bordered align-middle text-center small">
              <thead class="table-light sticky-top">
                <tr>
                  <th>KODE ERP</th>
                  <th class="text-start">NAMA BARANG</th>
                  <th class="bg-primary text-white" style="width:12%">STOK APLIKASI</th>
                  <th class="bg-secondary text-white" style="width:12%">STOK ERP</th>
                  <th style="width:12%">SELISIH</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!hasil.length">
                  <td colspan="6" class="text-center py-5 text-muted">
                    Silakan upload file Excel stok dari ERP.
                  </td>
                </tr>
                <tr v-for="d in hasil" :key="d.kode"
                    :style="d.stat !== 'OK' ? 'background:#fff5f5' : ''">
                  <td class="fw-bold font-monospace">{{ d.kode }}</td>
                  <td class="text-start">{{ d.nama }}</td>
                  <td class="fw-bold">{{ fmt(d.app) }}</td>
                  <td class="text-muted">{{ fmt(d.erp) }}</td>
                  <td class="fw-bold" :class="d.diff > 0 ? 'text-primary' : 'text-danger'">
                    {{ fmt(d.diff) }}
                  </td>
                  <td>
                    <i v-if="d.stat === 'OK'" class="fas fa-check text-success"></i>
                    <i v-else class="fas fa-times text-danger"></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer bg-light">
          <button class="btn btn-success fw-bold" @click="exportExcel" :disabled="!hasil.length">
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

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const totalSelisih = computed(() =>
  hasil.value.filter(d => d.stat !== 'OK').reduce((s, d) => s + Math.abs(d.diff), 0)
)

const onFileChange = e => {
  fileErp.value = e.target.files[0] || null
}

const prosesBanding = async () => {
  if (!fileErp.value) {
    window.Swal.fire('File Kosong', 'Pilih file Excel ERP dulu.', 'warning')
    return
  }

  window.Swal.fire({ title: 'Memproses...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading() })

  try {
    // Baca file Excel
    const buffer = await fileErp.value.arrayBuffer()
    const wb  = window.XLSX.read(new Uint8Array(buffer), { type: 'array' })
    const raw = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])

    // Parse ERP data
    const mapErp = {}
    raw.forEach(r => {
      const keyKode = Object.keys(r).find(k => k.toUpperCase().includes('KODE'))
      const keyQty  = Object.keys(r).find(k => k.toUpperCase().includes('QTY') || k.toUpperCase().includes('STOK'))
      if (keyKode && keyQty) {
        const k = String(r[keyKode]).trim().toUpperCase()
        mapErp[k] = (mapErp[k] || 0) + (parseFloat(r[keyQty]) || 0)
      }
    })

    // Hitung stok aplikasi
    let stokAppMap = {}
    if (!tglBanding.value) {
      dbStok.value.forEach(i => {
        stokAppMap[i.kodeErp] = { qty: parseFloat(i.stok) || 0, nama: i.nama }
      })
    } else {
      const snap = await get(dbRef(db, 'riwayat_transaksi'))
      const history = snap.val() || {}
      const cutoff  = new Date(tglBanding.value)
      cutoff.setHours(23, 59, 59, 999)

      dbStok.value.forEach(item => {
        let run = parseFloat(item.stokAwal) || 0
        const logs = history[item.idUnik]
        if (logs) {
          Object.values(logs)
            .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
            .forEach(l => {
              if (new Date(l.tanggal) <= cutoff) {
                const q = parseFloat(l.qty)
                if (l.tipe === 'MASUK')       run += q
                else if (l.tipe === 'KELUAR') run -= q
                else if (l.tipe === 'OPNAME') run  = q
                run = parseFloat(run.toFixed(2))
              }
            })
        }
        stokAppMap[item.kodeErp] = { qty: run, nama: item.nama }
      })
    }

    // Bandingkan
    const data = []
    const processed = new Set()

    Object.keys(stokAppMap).forEach(kode => {
      const stokApp = stokAppMap[kode].qty
      const stokErp = mapErp[kode] ?? 0
      const selisih = stokApp - stokErp
      const match   = Math.abs(selisih) < 0.01
      data.push({ kode, nama: stokAppMap[kode].nama, app: stokApp, erp: stokErp, diff: selisih, stat: match ? 'OK' : 'DIFF' })
      processed.add(kode)
    })

    Object.keys(mapErp).forEach(k => {
      if (!processed.has(k)) {
        data.push({ kode: k, nama: '(Tidak ada di App)', app: 0, erp: mapErp[k], diff: -mapErp[k], stat: 'MISSING' })
      }
    })

    hasil.value = data.sort((a, b) => (a.stat === 'OK' && b.stat !== 'OK') ? 1 : -1)
    window.Swal.close()

  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  }
}

const exportExcel = () => {
  if (!hasil.value.length) return
  const rows = [
    ['KODE ERP', 'NAMA BARANG', 'STOK APP', 'STOK ERP', 'SELISIH', 'STATUS'],
    ...hasil.value.map(d => [d.kode, d.nama, d.app, d.erp, d.diff, d.stat])
  ]
  const ws = window.XLSX.utils.aoa_to_sheet(rows)
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Selisih')
  window.XLSX.writeFile(wb, 'Laporan_Selisih_Stok.xlsx')
}
</script>
