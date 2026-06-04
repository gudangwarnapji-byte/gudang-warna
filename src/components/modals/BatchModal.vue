<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content border-0 shadow">

        <!-- HEADER -->
        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title fw-bold">Input Massal (Smart Paste)</h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <!-- BODY -->
        <div class="modal-body p-3">
          <div class="row g-3">

            <!-- PASTE AREA -->
            <div class="col-12">
              <label class="small fw-bold text-primary mb-1">1. COPY DATA DARI EXCEL (Tanpa Header)</label>
              <textarea
                class="form-control font-monospace"
                rows="3"
                placeholder="Format: [Kode/Nama]  [Qty]"
                style="border:2px dashed #ccc;background:#f0f8ff;font-size:.85rem"
                @paste="handlePaste"
              ></textarea>
              <div class="form-text small text-muted">Paste data 2 Kolom (Item & Qty).</div>
            </div>

            <!-- SETTINGS -->
            <div class="col-12 border-top pt-2">
              <label class="small fw-bold text-dark mb-1">2. PENGATURAN UMUM</label>
              <div class="row g-2">
                <div class="col-md-3">
                  <select class="form-select fw-bold border-primary" v-model="globalTipe" @change="updatePreviews">
                    <option value="MASUK">IN (Masuk)</option>
                    <option value="KELUAR">OUT (Keluar)</option>
                    <option value="OPNAME">ADJ (Opname)</option>
                  </select>
                </div>
                <div class="col-md-3">
                  <input type="datetime-local" class="form-control" v-model="globalDate">
                </div>
                <div class="col-md-3">
                  <input type="text" class="form-control text-uppercase" v-model="globalKet" placeholder="Keterangan Umum">
                </div>
                <div class="col-md-3">
                  <button class="btn btn-warning w-100 fw-bold" @click="addEmptyRow">+ Baris Manual</button>
                </div>
              </div>
            </div>

            <!-- TABLE -->
            <div class="col-12">
              <div class="table-responsive" style="max-height:400px;border:1px solid #eee;border-radius:8px">
                <table class="table table-sm table-bordered align-middle mb-0">
                  <thead class="table-light sticky-top text-center">
                    <tr>
                      <th style="width:5%">#</th>
                      <th style="width:35%">KODE / NAMA</th>
                      <th style="width:20%">WARNA</th>
                      <th style="width:15%">QTY (KG)</th>
                      <th style="width:20%">PREVIEW SALDO</th>
                      <th style="width:5%">X</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in rows" :key="idx"
                        :class="row.itemId ? '' : 'table-warning'">
                      <td class="text-center">{{ idx + 1 }}</td>
                      <td>
                        <input
                          class="form-control form-control-sm fw-bold"
                          v-model="row.rawKey"
                          :list="`dl_${idx}`"
                          placeholder="Ketik/Paste..."
                          @change="detectItem(row)"
                        >
                        <datalist :id="`dl_${idx}`">
                          <option v-for="i in dbStok" :key="i.idUnik"
                                  :value="`${i.kodeErp} | ${i.nama}`">
                          </option>
                        </datalist>
                        <div class="small mt-1" :class="row.itemId ? 'text-success' : 'text-danger'">
                          <i :class="row.itemId ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                          {{ row.itemId ? `Cocok: ${row.kodeErp}` : 'Tidak ditemukan' }}
                        </div>
                      </td>
                      <td class="text-center small text-muted">{{ row.warna }}</td>
                      <td>
                        <input type="number" step="any"
                               class="form-control form-control-sm text-center fw-bold border-primary"
                               v-model="row.qty"
                               @input="updatePreviews">
                      </td>
                      <td class="text-center small">
                        <span v-if="row.itemId && row.qty">
                          <span class="text-muted">{{ fmt(row.currentStok) }}</span>
                          <i class="fas fa-arrow-right text-muted mx-1" style="font-size:.7rem"></i>
                          <span :class="previewColor">{{ fmt(previewSaldo(row)) }}</span>
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>
                      <td class="text-center">
                        <button class="btn btn-sm text-danger" @click="rows.splice(idx, 1)">
                          <i class="fas fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="d-flex justify-content-end gap-3 mt-2">
                <span class="fw-bold text-muted small">{{ validCount }} Item Valid</span>
                <span class="fw-bold text-primary small">Total: {{ fmt(totalQty) }} Kg</span>
              </div>
            </div>

          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer bg-light">
          <button class="btn btn-lg btn-success fw-bold w-100 shadow"
                  :disabled="!validCount || submitting"
                  @click="submit">
            {{ submitting ? 'Memproses...' : 'PROSES SEKARANG' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ref as dbRef, update } from 'firebase/database'
import { db } from '../../firebase'
import { dbStok } from '../../composables/useStok'
import { useStok } from '../../composables/useStok'

const emit = defineEmits(['close'])
const { refreshData } = useStok()

const globalTipe = ref('MASUK')
const globalDate = ref('')
const globalKet  = ref('')
const submitting = ref(false)
const rows = ref([])

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const previewColor = computed(() => ({
  'text-success': globalTipe.value === 'MASUK',
  'text-danger':  globalTipe.value === 'KELUAR',
  'text-warning': globalTipe.value === 'OPNAME'
}))

const previewSaldo = row => {
  const q = parseFloat(row.qty) || 0
  const s = row.currentStok || 0
  if (globalTipe.value === 'MASUK')  return s + q
  if (globalTipe.value === 'KELUAR') return s - q
  return q
}

const validCount = computed(() =>
  rows.value.filter(r => r.itemId && parseFloat(r.qty) > 0).length
)

const totalQty = computed(() =>
  rows.value.reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0)
)

const findItem = rawKey => {
  const val = rawKey.split('|')[0].trim().toUpperCase()
  return dbStok.value.find(i =>
    i.kodeErp === val || i.nama.toUpperCase() === val
  )
}

const detectItem = row => {
  const item = findItem(row.rawKey)
  if (item) {
    row.itemId      = item.idUnik
    row.kodeErp     = item.kodeErp
    row.warna       = item.warna || ''
    row.currentStok = parseFloat(item.stok) || 0
  } else {
    row.itemId      = ''
    row.kodeErp     = ''
    row.warna       = ''
    row.currentStok = 0
  }
}

const addEmptyRow = () => {
  rows.value.push({ rawKey: '', itemId: '', kodeErp: '', warna: '', qty: '', currentStok: 0 })
}

const updatePreviews = () => { /* computed auto-update */ }

const handlePaste = e => {
  e.preventDefault()
  const pasted = (e.clipboardData || window.clipboardData).getData('text')
  rows.value = []
  pasted.split(/\r\n|\n|\r/).forEach(line => {
    if (!line.trim()) return
    let cols = line.split('\t')
    if (cols.length === 1) cols = line.split(',')
    if (cols.length === 1) cols = line.split(/\s{2,}/)
    const rawKey = (cols[0] || '').trim().toUpperCase()
    const qty    = parseFloat((cols[1] || '').trim().replace(',', '.'))
    const row    = { rawKey, itemId: '', kodeErp: '', warna: '', qty: isNaN(qty) ? '' : qty, currentStok: 0 }
    detectItem(row)
    rows.value.push(row)
  })
}

// Init 5 baris kosong
for (let i = 0; i < 5; i++) addEmptyRow()

const submit = async () => {
  const valid = rows.value.filter(r => r.itemId && parseFloat(r.qty) > 0)
  if (!valid.length) return
  submitting.value = true
  try {
    const updates = {}
    const base = globalDate.value ? new Date(globalDate.value) : new Date()
    valid.forEach((row, i) => {
      const item  = dbStok.value.find(x => x.idUnik === row.itemId)
      const sLama = Number(item.stok) || 0
      const qty   = parseFloat(row.qty)
      const sBaru = parseFloat(
        (globalTipe.value === 'MASUK'  ? sLama + qty
        : globalTipe.value === 'KELUAR' ? sLama - qty
        : qty).toFixed(2)
      )
      const iso   = new Date(base.getTime() + i * 1000).toISOString()
      const trxId = 'BCH_' + (base.getTime() + i * 1000)
      updates[`stok_benang/${row.itemId}/stok`]     = sBaru
      updates[`stok_benang/${row.itemId}/tglUpdate`] = iso
      updates[`riwayat_transaksi/${row.itemId}/${trxId}`] = {
        trxId, kodeErp: item.kodeErp, qty,
        stokAkhir: sBaru, tanggal: iso,
        tipe: globalTipe.value,
        keterangan: (globalKet.value || 'BULK').toUpperCase()
      }
    })
    await update(dbRef(db), updates)
    window.Swal.fire({ icon: 'success', title: 'Sukses!', text: `${valid.length} item diproses.`, timer: 1500, showConfirmButton: false })
    refreshData()
    emit('close')
  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  } finally {
    submitting.value = false
  }
}
</script>
