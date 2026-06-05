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
                rows="2"
                placeholder="Format: [Teks Mentah Nama/Kode]  [Qty]"
                style="border:2px dashed #ccc;background:#f0f8ff;font-size:.85rem;min-height:80px;resize:vertical;padding:15px"
                @paste="handlePaste"
              ></textarea>
              <div class="form-text small text-muted">Paste data 2 Kolom (Item &amp; Qty).</div>
            </div>

            <!-- SETTINGS -->
            <div class="col-12 border-top pt-2">
              <label class="small fw-bold text-dark mb-1">2. PENGATURAN UMUM</label>
              <div class="row g-2">
                <div class="col-md-3">
                  <select class="form-select fw-bold border-primary" v-model="globalTipe">
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
                      <th style="width:40%">TEKS DARI EXCEL / PENCARIAN SISTEM</th>
                      <th style="width:20%">WARNA</th>
                      <th style="width:15%">QTY INPUT (KG)</th>
                      <th style="width:15%">PREVIEW SALDO</th>
                      <th style="width:5%">AKSI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in rows" :key="idx"
                        :class="row.itemId ? '' : 'table-warning'">
                      <td class="text-center fw-bold text-muted">{{ idx + 1 }}</td>

                      <!-- INPUT + DROPDOWN -->
                      <td style="position:relative">
                        <input
                          class="form-control form-control-sm fw-bold"
                          v-model="row.rawKey"
                          placeholder="Ketik/Paste Teks..."
                          autocomplete="off"
                          @input="onInput(row, idx)"
                          @focus="onFocus(idx)"
                          @blur="onBlur(idx)"
                          @keydown.down.prevent="moveDown(idx)"
                          @keydown.up.prevent="moveUp(idx)"
                          @keydown.enter.prevent="pilihSuggestion(idx)"
                          @keydown.escape="activeDrop = -1"
                        >
                        <!-- DROPDOWN -->
                        <div v-if="activeDrop === idx && suggestions[idx]?.length" class="ac-dropdown">
                          <div
                            v-for="(sug, si) in suggestions[idx]"
                            :key="sug.idUnik"
                            :class="['ac-item', highlightIdx[idx] === si ? 'ac-active' : '']"
                            @mousedown.prevent="pilihItem(row, idx, sug)"
                          >
                            <span class="ac-kode">{{ sug.kodeErp }}</span>
                            <span class="ac-sep">|</span>
                            <span class="ac-nama">{{ sug.nama }}</span>
                            <span class="ac-sep">-</span>
                            <span class="ac-warna">{{ sug.warna || '-' }}</span>
                            <span class="ac-stok ms-auto">{{ fmt(sug.stok) }} Kg</span>
                          </div>
                        </div>
                        <!-- STATUS -->
                        <div class="small mt-1" :class="row.itemId ? 'text-success' : 'text-danger'">
                          <i :class="row.itemId ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                          {{ row.itemId ? `Cocok: ${row.kodeErp}` : 'Tidak ditemukan' }}
                        </div>
                      </td>

                      <!-- WARNA -->
                      <td class="text-center small text-muted fw-bold">{{ row.warna || '-' }}</td>

                      <!-- QTY -->
                      <td>
                        <input
                          type="number" step="any"
                          class="form-control form-control-lg text-center fw-bold border-primary"
                          v-model="row.qty"
                          placeholder="0"
                        >
                      </td>

                      <!-- PREVIEW -->
                      <td class="align-middle text-center">
                        <div v-if="row.itemId && row.qty" class="fw-bold" style="font-size:1.1rem">
                          <span class="text-muted" style="font-size:.8rem">{{ fmt(row.currentStok) }}</span>
                          <i class="fas fa-arrow-right text-muted mx-1" style="font-size:.7rem"></i>
                          <span :class="previewColor">{{ fmt(previewSaldo(row)) }}</span>
                        </div>
                        <span v-else class="text-muted">-</span>
                      </td>

                      <!-- HAPUS -->
                      <td class="text-center">
                        <button class="btn text-danger" @click="rows.splice(idx, 1)">
                          <i class="fas fa-times"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="d-flex justify-content-end gap-3 mt-2">
                <div class="fw-bold text-muted small">{{ validCount }} Item Valid</div>
                <div class="fw-bold text-primary small">Total Input: {{ fmt(totalQty) }} Kg</div>
              </div>
            </div>

          </div>
        </div>

        <!-- FOOTER -->
        <div class="modal-footer bg-light">
          <button class="btn btn-lg btn-success fw-bold px-5 shadow w-100"
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
import { ref, computed, reactive } from 'vue'
import { ref as dbRef, update } from 'firebase/database'
import { db } from '../../firebase'
import { dbStok, useStok } from '../../composables/useStok'

const emit = defineEmits(['close'])
const { refreshData } = useStok()

const globalTipe = ref('MASUK')
const globalDate = ref('')
const globalKet  = ref('')
const submitting = ref(false)
const rows       = ref([])

const activeDrop   = ref(-1)
const suggestions  = reactive({})
const highlightIdx = reactive({})

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

const cariSuggestions = q => {
  if (!q || q.length < 1) return []
  
  const tokens = q.toUpperCase().trim().split(/\s+/).filter(Boolean)
  
  return dbStok.value
    .filter(i => {
      const haystack = [
        i.kodeErp || '',
        i.nama    || '',
        i.warna   || ''
      ].join(' ').toUpperCase()
      return tokens.every(token => haystack.includes(token))
    })
    .sort((a, b) => (a.kodeErp || '').localeCompare(b.kodeErp || ''))
    .slice(0, 10)
}

const onInput = (row, idx) => {
  row.itemId = ''; row.kodeErp = ''; row.warna = ''; row.currentStok = 0
  suggestions[idx]  = cariSuggestions(row.rawKey)
  highlightIdx[idx] = -1
  activeDrop.value  = suggestions[idx].length ? idx : -1
}

const onFocus = idx => {
  const row = rows.value[idx]
  if (row.rawKey && !row.itemId) {
    suggestions[idx] = cariSuggestions(row.rawKey)
    if (suggestions[idx].length) activeDrop.value = idx
  }
}

const onBlur = idx => {
  setTimeout(() => { if (activeDrop.value === idx) activeDrop.value = -1 }, 150)
}

const moveDown = idx => {
  const max = (suggestions[idx]?.length || 0) - 1
  highlightIdx[idx] = Math.min((highlightIdx[idx] ?? -1) + 1, max)
}
const moveUp = idx => {
  highlightIdx[idx] = Math.max((highlightIdx[idx] ?? 0) - 1, 0)
}
const pilihSuggestion = idx => {
  const hi = highlightIdx[idx] ?? -1
  if (hi >= 0 && suggestions[idx]?.[hi]) pilihItem(rows.value[idx], idx, suggestions[idx][hi])
}

const pilihItem = (row, idx, item) => {
  row.rawKey      = item.kodeErp
  row.itemId      = item.idUnik
  row.kodeErp     = item.kodeErp
  row.warna       = item.warna || ''
  row.currentStok = parseFloat(item.stok) || 0
  activeDrop.value  = -1
  suggestions[idx]  = []
  highlightIdx[idx] = -1
}

const fuzzyMatch = rawKey => {
  const val    = rawKey.toUpperCase().trim()
  const tokens = val.split(/\s+/).filter(Boolean)

  // 1. Exact kode ERP
  let found = dbStok.value.find(i => i.kodeErp.toUpperCase() === val)
  if (found) return found

  // 2. Exact nama
  found = dbStok.value.find(i => (i.nama || '').toUpperCase() === val)
  if (found) return found

  // 3. Multi-token search di semua field
  found = dbStok.value.find(i => {
    const haystack = [
      i.kodeErp || '',
      i.nama    || '',
      i.warna   || ''
    ].join(' ').toUpperCase()
    return tokens.every(token => haystack.includes(token))
  })
  if (found) return found

  return null
}

const addEmptyRow = () => {
  rows.value.push({ rawKey: '', itemId: '', kodeErp: '', warna: '', qty: '', currentStok: 0 })
}

const handlePaste = e => {
  e.preventDefault()
  const pasted = (e.clipboardData || window.clipboardData).getData('text')
  rows.value = []
  pasted.split(/\r\n|\n|\r/).forEach(line => {
    if (!line.trim()) return
    let cols = line.split('\t')
    if (cols.length === 1) cols = line.split(',')
    if (cols.length === 1) cols = line.split(/\s{2,}/)
    const rawKey = (cols[0] || '').trim()
    const qty    = parseFloat((cols[1] || '').trim().replace(',', '.'))
    const item   = fuzzyMatch(rawKey)
    const row    = {
      rawKey,
      itemId:      item ? item.idUnik   : '',
      kodeErp:     item ? item.kodeErp  : '',
      warna:       item ? item.warna    : '',
      currentStok: item ? parseFloat(item.stok) || 0 : 0,
      qty: isNaN(qty) ? '' : qty
    }
    rows.value.push(row)
  })
}

for (let i = 0; i < 5; i++) addEmptyRow()

const submit = async () => {
  const valid = rows.value.filter(r => r.itemId && parseFloat(r.qty) > 0)
  if (!valid.length) return

  const confirm = await window.Swal.fire({
    title: `Proses ${valid.length} Item?`,
    html: `Tipe: <b>${globalTipe.value}</b><br>Total: <b>${fmt(totalQty.value)} Kg</b>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#198754',
    confirmButtonText: 'Ya, Proses!'
  })
  if (!confirm.isConfirmed) return

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
      updates[`stok_benang/${row.itemId}/stok`]      = sBaru
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

<style scoped>
.ac-dropdown {
  position: absolute;
  top: calc(100% - 22px);
  left: 0; right: 0;
  background: #fff;
  border: 1.5px solid #0d6efd;
  border-top: none;
  border-radius: 0 0 8px 8px;
  z-index: 9999;
  max-height: 220px;
  overflow-y: auto;
  box-shadow: 0 6px 16px rgba(0,0,0,.12);
}
.ac-item {
  padding: 7px 10px;
  cursor: pointer;
  font-size: .82rem;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: background .1s;
}
.ac-item:last-child { border-bottom: none; }
.ac-item:hover, .ac-active { background: #e7f1ff; }
.ac-kode  { font-weight: 700; color: #1e3c72; min-width: 120px; font-family: monospace; }
.ac-nama  { color: #333; flex: 1; font-size: .78rem; }
.ac-sep   { color: #aaa; }
.ac-warna { color: #6c757d; font-size: .78rem; }
.ac-stok  { font-weight: 700; color: #198754; font-size: .78rem; white-space: nowrap; }
</style>
