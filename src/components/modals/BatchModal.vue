<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content border-0 shadow">

        <div class="modal-header bg-primary text-white">
          <h5 class="modal-title fw-bold">Input Massal (Smart Paste)</h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-3">
          <div class="row g-3">

            <div class="col-12">
              <label class="small fw-bold text-primary mb-1">1. COPY DATA DARI EXCEL (Tanpa Header)</label>
              <textarea
                class="form-control font-monospace"
                rows="3"
                placeholder="Format: [Teks Mentah Nama/Kode]  [Qty]"
                style="border:2px dashed #ccc;background:#f0f8ff;font-size:.85rem;min-height:80px;resize:vertical;padding:15px"
                @paste="handlePaste"
              ></textarea>
              <div class="form-text small text-muted">Paste data 2 Kolom (Item &amp; Qty).</div>
            </div>

            <div class="col-12 border-top pt-3">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <label class="small fw-bold text-dark m-0">2. PENGATURAN UMUM</label>
                <button class="btn btn-sm btn-warning fw-bold text-dark shadow-sm" @click="addEmptyRow">
                  <i class="fas fa-plus me-1"></i> Baris Manual
                </button>
              </div>
              
              <div class="row g-3">
                <div class="col-md-2 col-6">
                  <select class="form-select form-select-sm fw-bold border-primary" v-model="globalTipe">
                    <option value="MASUK">IN (Masuk)</option>
                    <option value="KELUAR">OUT (Keluar)</option>
                    <option value="OPNAME">ADJ (Opname)</option>
                  </select>
                </div>
                <div class="col-md-2 col-6">
                  <input type="date" class="form-control form-control-sm" v-model="globalDatePart">
                </div>
                <div class="col-md-2 col-4">
                  <input type="time" class="form-control form-control-sm" v-model="globalTimePart">
                </div>
                <div class="col-md-3 col-8">
                  <input type="text" class="form-control form-control-sm text-uppercase"
                         v-model="globalKet" placeholder="KETERANGAN UMUM">
                </div>
                <div class="col-md-3 col-12">
                  <select class="form-select form-select-sm fw-bold border-success" v-model="globalBlok">
                    <option value="">-- Blok (Semua) --</option>
                    <option v-for="b in masterBlok" :key="b.id" :value="b.nama">
                      {{ b.nama }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="col-12 mt-4">
              <div class="table-responsive" style="max-height:400px;border:1px solid #eee;border-radius:8px">
                <table class="table table-sm table-bordered align-middle mb-0">
                  <thead class="table-light sticky-top text-center">
                    <tr>
                      <th style="width:4%">#</th>
                      <th style="width:32%">KODE / NAMA</th>
                      <th style="width:12%">WARNA</th>
                      <th style="width:14%">BLOK</th>
                      <th style="width:13%">QTY (KG)</th>
                      <th style="width:20%">PREVIEW SALDO</th>
                      <th style="width:5%"> </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, idx) in rows" :key="idx"
                        :class="row.itemId ? '' : 'table-warning'">
                      <td class="text-center fw-bold text-muted">{{ idx + 1 }}</td>

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
                        <div v-if="activeDrop === idx && suggestions[idx]?.length"
                             class="ac-dropdown">
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
                        <div class="small mt-1"
                             :class="row.itemId ? 'text-success' : 'text-danger'">
                          <i :class="row.itemId ? 'fas fa-check-circle' : 'fas fa-times-circle'"></i>
                          {{ row.itemId ? `Cocok: ${row.kodeErp}` : 'Tidak ditemukan' }}
                        </div>
                      </td>

                      <td class="text-center small text-muted fw-bold">{{ row.warna || '-' }}</td>

                      <td>
                        <select class="form-select form-select-sm fw-bold"
                                v-model="row.blok">
                          <option value="">-</option>
                          <template v-if="globalTipe === 'KELUAR' && row.itemId">
                            <option v-for="(stokBlok, blokNama) in (getItemBloks(row.itemId))"
                                    :key="blokNama" :value="blokNama">
                              {{ blokNama }} ({{ fmt(stokBlok) }})
                            </option>
                          </template>
                          <template v-else>
                            <option v-for="b in masterBlok" :key="b.id" :value="b.nama">
                              {{ b.nama }}
                            </option>
                          </template>
                        </select>
                      </td>

                      <td>
                        <input type="number" step="any"
                               class="form-control form-control-sm text-center fw-bold border-primary"
                               v-model="row.qty">
                      </td>

                      <td class="text-center small">
                        <span v-if="row.itemId && row.qty && row.blok">
                          <span class="text-muted">{{ fmt(getStokBlok(row.itemId, row.blok)) }}</span>
                          <i class="fas fa-arrow-right text-muted mx-1" style="font-size:.7rem"></i>
                          <span :class="previewColor">{{ fmt(previewSaldo(row)) }}</span>
                        </span>
                        <span v-else class="text-muted">-</span>
                      </td>

                      <td class="text-center">
                        <button class="btn btn-sm text-danger"
                                @click="rows.splice(idx, 1)">
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
import { ref, computed, reactive, watch } from 'vue'
import { ref as dbRef, update } from 'firebase/database'
import { db } from '../../firebase'
import { dbStok, useStok } from '../../composables/useStok'
import { masterBlok } from '../../composables/useBlok'

const emit = defineEmits(['close'])
const { refreshData } = useStok()

const globalTipe     = ref('MASUK')
const globalDatePart = ref(new Date().toISOString().slice(0, 10))
const globalTimePart = ref(new Date().toTimeString().slice(0, 5))
const globalKet      = ref('')
const globalBlok     = ref('')
const submitting     = ref(false)
const rows           = ref([])

const globalDate = computed(() =>
  globalDatePart.value && globalTimePart.value
    ? `${globalDatePart.value}T${globalTimePart.value}`
    : ''
)

// Auto-apply globalBlok ke semua baris
watch(globalBlok, val => {
  if (val) rows.value.forEach(r => { r.blok = val })
})

const activeDrop   = ref(-1)
const suggestions  = reactive({})
const highlightIdx = reactive({})

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const getItemBloks = (itemId) => {
  const item = dbStok.value.find(x => x.idUnik === itemId)
  return item?.bloks || {}
}

const getStokBlok = (itemId, blokNama) => {
  const item = dbStok.value.find(x => x.idUnik === itemId)
  return parseFloat(item?.bloks?.[blokNama] || 0)
}

const previewColor = computed(() => ({
  'text-success': globalTipe.value === 'MASUK',
  'text-danger':  globalTipe.value === 'KELUAR',
  'text-warning': globalTipe.value === 'OPNAME'
}))

const previewSaldo = row => {
  const q = parseFloat(row.qty) || 0
  const s = getStokBlok(row.itemId, row.blok)
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
  return dbStok.value.filter(i => {
    const haystack = [i.kodeErp || '', i.nama || '', i.warna || ''].join(' ').toUpperCase()
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
  row.blok        = globalBlok.value || ''
  activeDrop.value  = -1
  suggestions[idx]  = []
  highlightIdx[idx] = -1
}

const fuzzyMatch = rawKey => {
  const val    = rawKey.toUpperCase().trim()
  const tokens = val.split(/\s+/).filter(Boolean)
  return dbStok.value.find(i => i.kodeErp.toUpperCase() === val) ||
         dbStok.value.find(i => (i.nama || '').toUpperCase() === val) ||
         dbStok.value.find(i => {
           const h = [i.kodeErp || '', i.nama || '', i.warna || ''].join(' ').toUpperCase()
           return tokens.every(t => h.includes(t))
         }) || null
}

const addEmptyRow = () => {
  rows.value.push({
    rawKey: '', itemId: '', kodeErp: '', warna: '',
    qty: '', currentStok: 0, blok: globalBlok.value || ''
  })
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
    rows.value.push({
      rawKey,
      itemId:      item ? item.idUnik  : '',
      kodeErp:     item ? item.kodeErp : '',
      warna:       item ? item.warna   : '',
      currentStok: item ? parseFloat(item.stok) || 0 : 0,
      qty:         isNaN(qty) ? '' : qty,
      blok:        globalBlok.value || ''
    })
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
      const item    = dbStok.value.find(x => x.idUnik === row.itemId)
      const qty     = parseFloat(row.qty)
      const blokNama = row.blok || ''
      const bloks   = { ...(item.bloks || {}) }
      const stokBlok = parseFloat(bloks[blokNama] || 0)

      let stokBlokBaru
      if (globalTipe.value === 'MASUK')       stokBlokBaru = parseFloat((stokBlok + qty).toFixed(2))
      else if (globalTipe.value === 'KELUAR') stokBlokBaru = parseFloat((stokBlok - qty).toFixed(2))
      else                                    stokBlokBaru = parseFloat(qty.toFixed(2))

      if (blokNama) {
        if (stokBlokBaru <= 0) delete bloks[blokNama]
        else bloks[blokNama] = stokBlokBaru
      }

      const totalStok = parseFloat(
        Object.values(bloks).reduce((s, v) => s + v, 0).toFixed(2)
      )

      const iso   = new Date(base.getTime() + i * 1000).toISOString()
      const trxId = 'BCH_' + (base.getTime() + i * 1000)

      updates[`stok_benang/${row.itemId}/stok`]      = totalStok
      updates[`stok_benang/${row.itemId}/bloks`]     = bloks
      updates[`stok_benang/${row.itemId}/tglUpdate`] = iso
      updates[`riwayat_transaksi/${row.itemId}/${trxId}`] = {
        trxId, kodeErp: item.kodeErp, qty,
        stokAkhir: totalStok, tanggal: iso,
        tipe: globalTipe.value, blok: blokNama,
        keterangan: (globalKet.value || 'BULK').toUpperCase()
      }
    })

    await update(dbRef(db), updates)
    window.Swal.fire({
      icon: 'success', title: 'Sukses!',
      text: `${valid.length} item diproses.`,
      timer: 1500, showConfirmButton: false
    })
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
  position: absolute; top: calc(100% - 22px);
  left: 0; right: 0; background: #fff;
  border: 1.5px solid #0d6efd; border-top: none;
  border-radius: 0 0 8px 8px; z-index: 9999;
  max-height: 220px; overflow-y: auto;
  box-shadow: 0 6px 16px rgba(0,0,0,.12);
}
.ac-item {
  padding: 7px 10px; cursor: pointer; font-size: .82rem;
  border-bottom: 1px solid #f0f0f0; display: flex;
  align-items: center; gap: 5px; transition: background .1s;
}
.ac-item:last-child { border-bottom: none; }
.ac-item:hover, .ac-active { background: #e7f1ff; }
.ac-kode  { font-weight: 700; color: #1e3c72; min-width: 120px; font-family: monospace; }
.ac-nama  { color: #333; flex: 1; font-size: .78rem; }
.ac-sep   { color: #aaa; }
.ac-warna { color: #6c757d; font-size: .78rem; }
.ac-stok  { font-weight: 700; color: #198754; font-size: .78rem; white-space: nowrap; }
</style>
