<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content border-0 shadow">

        <div class="modal-header text-white" style="background:linear-gradient(135deg,#1e3c72,#2a5298)">
          <div class="w-100">
            <div class="d-flex justify-content-between align-items-center">
              <h5 class="modal-title fw-bold">
                <i class="fas fa-th-large me-2"></i>Peta Gudang per Blok
              </h5>
              <div class="d-flex gap-2 align-items-center">
                <button v-if="isAdmin" class="btn btn-sm btn-light fw-bold"
                        @click="showKelolaBlok = !showKelolaBlok">
                  <i class="fas fa-cog me-1"></i> Kelola Blok
                </button>
                <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="showKelolaBlok && isAdmin" class="border-bottom p-3 bg-light">
          <div class="d-flex gap-2 align-items-center flex-wrap">
            <input type="text" class="form-control form-control-sm text-uppercase fw-bold"
                   style="max-width:200px" v-model="namaBlokBaru"
                   placeholder="Nama Blok Baru..." @keydown.enter="tambahBlok">
            <button class="btn btn-sm btn-success fw-bold" @click="tambahBlok">
              <i class="fas fa-plus me-1"></i> Tambah Blok
            </button>
            <div class="d-flex gap-2 flex-wrap">
              <span v-for="blok in masterBlok" :key="blok.id"
                    class="badge bg-primary d-flex align-items-center gap-2 px-3 py-2"
                    style="font-size:.8rem">
                {{ blok.nama }}
                <i class="fas fa-times" style="cursor:pointer" @click="hapusBlok(blok.id)"></i>
              </span>
            </div>
          </div>
        </div>

        <div class="px-3 py-2 border-bottom bg-white">
          <div class="input-group input-group-sm shadow-sm">
            <span class="input-group-text bg-white border-0">
              <i class="fas fa-search text-muted"></i>
            </span>
            <input type="text" class="form-control border-0"
                   placeholder="Cari Kode, Nama, Warna..."
                   autocomplete="off" v-model="searchBlok">
            <button v-if="searchBlok" class="btn btn-sm btn-link text-muted"
                    @click="searchBlok = ''">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>

        <div class="modal-body p-3" style="max-height:70vh;overflow-y:auto">
          <div class="row g-3">

            <div v-for="blok in blokData" :key="blok.nama" class="col-12 col-md-6 col-lg-4">
              <div class="blok-card shadow-sm"
                   :class="activeBlok === blok.nama ? 'blok-active' : ''"
                   @click="toggleBlok(blok.nama)">
                <div class="blok-header">
                  <div class="d-flex justify-content-between align-items-center">
                    <h6 class="fw-bold mb-0">
                      <i class="fas fa-warehouse me-2 opacity-75"></i>{{ blok.nama }}
                    </h6>
                    <div class="d-flex gap-2 align-items-center">
                      <span class="badge bg-white text-primary fw-bold">{{ blok.items.length }} Item</span>
                      <i class="fas" :class="activeBlok === blok.nama ? 'fa-chevron-up' : 'fa-chevron-down'"
                         style="font-size:.75rem;opacity:.7"></i>
                    </div>
                  </div>
                  <div class="mt-2 fw-bold" style="font-size:1.1rem">{{ fmt(blok.totalStok) }} Kg</div>
                </div>

                <div v-if="activeBlok === blok.nama" class="blok-items">
                  <div v-for="item in blok.items" :key="item.idUnik"
                       class="blok-item-row" @click.stop>
                    <div class="d-flex justify-content-between align-items-center">
                      <div style="min-width:0;flex:1">
                        <div class="fw-bold text-truncate" style="font-size:.85rem">{{ item.nama }}</div>
                        <div class="text-muted" style="font-size:.7rem">{{ item.kodeErp }}</div>
                      </div>
                      <div class="text-end ms-2">
                        
                        <div v-if="isAdmin && editingItem === item.idUnik + blok.nama"
                             class="d-flex gap-1 align-items-center" @click.stop>
                          <input
                            type="number" step="any"
                            class="form-control form-control-sm text-center fw-bold"
                            style="width:90px"
                            v-model="editStokVal"
                            @keydown.enter="simpanStokBlok(item, blok.nama)"
                            @keydown.escape="editingItem = ''"
                          >
                          <button class="btn btn-xs btn-success"
                                  @click.stop="simpanStokBlok(item, blok.nama)">
                            <i class="fas fa-check" style="font-size:.65rem"></i>
                          </button>
                          <button class="btn btn-xs btn-secondary"
                                  @click.stop="editingItem = ''">
                            <i class="fas fa-times" style="font-size:.65rem"></i>
                          </button>
                        </div>
                        
                        <div v-else
                             class="fw-bold"
                             :class="item.stokDiBlok < 5 ? 'text-danger' : 'text-success'"
                             style="font-size:.9rem">
                          {{ fmt(item.stokDiBlok) }} Kg
                          <i v-if="isAdmin"
                             class="fas fa-pencil-alt ms-1"
                             style="font-size:.6rem;opacity:.5;cursor:pointer"
                             @click.stop="bukaEditStok(item, blok.nama)"></i>
                        </div>
                        
                        <div v-if="isAdmin" class="d-flex gap-1 mt-1 justify-content-end flex-wrap">
                          <select class="form-select form-select-sm"
                                  style="max-width:100px;font-size:.7rem"
                                  value=""
                                  @change="pindahBlok(item, blok.nama, $event.target.value)"
                                  @click.stop>
                            <option value="">Pindah...</option>
                            <option v-for="b in masterBlok.filter(b => b.nama !== blok.nama)"
                                    :key="b.id" :value="b.nama">
                              {{ b.nama }}
                            </option>
                          </select>
                          <button class="btn btn-xs btn-outline-success"
                                  @click.stop="quickTrans('MASUK', item)">
                            <i class="fas fa-arrow-down" style="font-size:.65rem"></i>
                          </button>
                          <button class="btn btn-xs btn-outline-danger"
                                  @click.stop="quickTrans('KELUAR', item)">
                            <i class="fas fa-arrow-up" style="font-size:.65rem"></i>
                          </button>
                          <button class="btn btn-xs btn-outline-secondary"
                                  @click.stop="quickRiwayat(item)">
                            <i class="fas fa-history" style="font-size:.65rem"></i>
                          </button>
                          <button class="btn btn-xs btn-outline-danger"
                                  title="Hapus dari blok ini"
                                  @click.stop="hapusDariBlok(item, blok.nama)">
                            <i class="fas fa-trash-alt" style="font-size:.65rem"></i>
                          </button>
                        </div>

                      </div>
                    </div>
                  </div>

                  <div v-if="isAdmin" class="p-2 border-top bg-light">
                    <div v-if="assigningToBlok === blok.nama" class="p-2 border rounded bg-white shadow-sm" @click.stop>
                      <div class="mb-2" style="position:relative">
                        <input
                          class="form-control form-control-sm border-primary fw-bold"
                          v-model="assignRawKey"
                          placeholder="🔍 Cari Kode / Nama..."
                          autocomplete="off"
                          @input="onInputAssign"
                          @blur="setTimeout(() => assignDrop = false, 150)"
                        >
                        <div v-if="assignDrop && assignSuggestions.length" class="ac-dropdown-new">
                          <div v-for="sug in assignSuggestions" :key="sug.idUnik"
                               class="ac-item-new" @mousedown.prevent="pilihAssignItem(sug)">
                            <div class="d-flex justify-content-between w-100 mb-1">
                              <span class="fw-bold text-primary" style="font-size:.8rem">{{ sug.kodeErp }}</span>
                              <span class="badge bg-light text-dark border">{{ fmt(sug.stok) }} Kg</span>
                            </div>
                            <div class="text-muted text-truncate w-100" style="font-size:.7rem">
                              {{ sug.nama }} <span v-if="sug.warna">- {{ sug.warna }}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div v-if="assignItemPilih" class="mb-2 px-2 py-1 bg-success text-white rounded small fw-bold text-center">
                        <i class="fas fa-check-circle me-1"></i> Terpilih: {{ assignItemPilih.kodeErp }}
                      </div>

                      <div class="d-flex gap-2">
                        <div class="input-group input-group-sm" style="flex: 1;">
                          <input type="number" step="any" placeholder="Jumlah"
                                 class="form-control text-center fw-bold border-success"
                                 v-model="assignStokVal" @click.stop>
                          <span class="input-group-text bg-light text-muted">Kg</span>
                        </div>
                        <button class="btn btn-sm btn-success fw-bold px-3 shadow-sm"
                                @click.stop="simpanAssignKeBlok(blok.nama)">
                          <i class="fas fa-save"></i>
                        </button>
                        <button class="btn btn-sm btn-light border fw-bold px-3 shadow-sm"
                                @click.stop="assigningToBlok = ''">
                          <i class="fas fa-times text-danger"></i>
                        </button>
                      </div>
                    </div>

                    <button v-else
                            class="btn btn-sm btn-outline-primary w-100 fw-bold border-dashed"
                            @click.stop="bukaAssignKeBlok(blok.nama)">
                      <i class="fas fa-plus me-1"></i> Tambah Item ke {{ blok.nama }}
                    </button>
                  </div>

                  <div class="blok-total">
                    <span class="text-muted">Total {{ blok.nama }}</span>
                    <span class="fw-bold text-primary">{{ fmt(blok.totalStok) }} Kg</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 col-md-6 col-lg-4" v-if="tanpaLokasi.length">
              <div class="blok-card shadow-sm border-warning"
                   :class="activeBlok === '__TANPALOKASI__' ? 'blok-active' : ''"
                   @click="toggleBlok('__TANPALOKASI__')">
                <div class="blok-header" style="background:#fff8e1">
                  <div class="d-flex justify-content-between align-items-center">
                    <h6 class="fw-bold mb-0 text-warning">
                      <i class="fas fa-map-marker-alt me-2"></i>Tanpa Lokasi
                    </h6>
                    <span class="badge bg-warning text-dark fw-bold">{{ tanpaLokasi.length }} Item</span>
                  </div>
                  <div class="mt-2 fw-bold text-warning" style="font-size:1.1rem">
                    {{ fmt(tanpaLokasi.reduce((s,i) => s + (parseFloat(i.sisaTanpaBlok)||0), 0)) }} Kg
                  </div>
                </div>

                <div v-if="activeBlok === '__TANPALOKASI__'" class="blok-items">
                  <div v-for="item in tanpaLokasi" :key="item.idUnik"
                       class="blok-item-row" @click.stop>
                    <div class="d-flex justify-content-between align-items-center">
                      <div style="min-width:0;flex:1">
                        <div class="fw-bold text-truncate" style="font-size:.85rem">{{ item.nama }}</div>
                        <div class="text-muted" style="font-size:.7rem">{{ item.kodeErp }}</div>
                      </div>
                      <div class="text-end ms-2">
                        <div class="fw-bold text-success" style="font-size:.9rem">
                          {{ fmt(item.sisaTanpaBlok) }} Kg
                        </div>
                        
                        <div v-if="isAdmin" class="mt-1">
                          <div v-if="assigningItem === item.idUnik"
                               class="d-flex gap-1 flex-wrap" @click.stop>
                            <select class="form-select form-select-sm"
                                    style="max-width:100px;font-size:.72rem"
                                    v-model="assignBlokNama">
                              <option value="">Pilih Blok...</option>
                              <option v-for="b in masterBlok" :key="b.id" :value="b.nama">
                                {{ b.nama }}
                              </option>
                            </select>
                            <input type="number" step="any" placeholder="Kg"
                                   class="form-control form-control-sm text-center"
                                   style="max-width:75px"
                                   v-model="assignStokTanpaLok">
                            <button class="btn btn-xs btn-success"
                                    @click.stop="simpanAssignTanpaLok(item)">
                              <i class="fas fa-check" style="font-size:.65rem"></i>
                            </button>
                            <button class="btn btn-xs btn-secondary"
                                    @click.stop="assigningItem = ''">
                              <i class="fas fa-times" style="font-size:.65rem"></i>
                            </button>
                          </div>
                          <div v-else class="d-flex gap-1 justify-content-end">
                            <button class="btn btn-xs btn-outline-primary"
                                    @click.stop="bukaAssignTanpaLok(item)">
                              <i class="fas fa-plus me-1" style="font-size:.65rem"></i> Set Blok
                            </button>
                            <button class="btn btn-xs btn-outline-secondary"
                                    @click.stop="quickRiwayat(item)">
                              <i class="fas fa-history" style="font-size:.65rem"></i>
                            </button>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                  <div class="blok-total">
                    <span class="text-muted">Total Tanpa Lokasi</span>
                    <span class="fw-bold text-warning">
                      {{ fmt(tanpaLokasi.reduce((s,i) => s + (parseFloat(i.sisaTanpaBlok)||0), 0)) }} Kg
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        <div class="modal-footer bg-light py-2 d-flex justify-content-between fw-bold small">
          <div>Total Blok: <span class="text-primary">{{ blokData.length }}</span></div>
          <div>Grand Total: <span class="text-primary fs-6">{{ fmt(grandTotal) }}</span> Kg</div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ref as dbRef, set, remove } from 'firebase/database'
import { db } from '../../firebase'
// PANGGIL kirimMutasi BIAR TOTAL STOK AMAN TENTRAM
import { dbStok, useStok } from '../../composables/useStok'
import { currentRole } from '../../composables/useAuth'
import { useTrans } from '../../composables/useTrans'
import { useHist } from '../../composables/useHist'
import { masterBlok, loadMasterBlok } from '../../composables/useBlok'

const emit = defineEmits(['close'])
const { bukaTransaksi } = useTrans()
const { bukaRiwayat }   = useHist()
const { kirimTransaksi, kirimMutasi } = useStok() 

const isAdmin        = computed(() => currentRole.value === 'admin')
const showKelolaBlok = ref(false)
const namaBlokBaru   = ref('')
const activeBlok     = ref('')
const searchBlok     = ref('')

const editingItem = ref('')
const editStokVal = ref(0)

const assigningToBlok  = ref('')
const assignRawKey     = ref('')
const assignStokVal    = ref('')
const assignSuggestions = ref([])
const assignDrop       = ref(false)
const assignItemPilih  = ref(null)

const assigningItem      = ref('')
const assignBlokNama     = ref('')
const assignStokTanpaLok = ref('')

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

// ── KELOLA BLOK ──
const tambahBlok = async () => {
  if (!namaBlokBaru.value.trim()) return
  const nama = namaBlokBaru.value.trim().toUpperCase()
  if (masterBlok.value.find(b => b.nama === nama)) {
    window.Swal.fire('Sudah Ada', `Blok ${nama} sudah terdaftar.`, 'warning')
    return
  }
  await set(dbRef(db, `master_blok/blok_${Date.now()}`), { nama })
  namaBlokBaru.value = ''
}

const hapusBlok = async (id) => {
  const result = await window.Swal.fire({
    title: 'Hapus Blok?', text: 'Item di dalamnya TIDAK akan terhapus, hanya pindah ke Tanpa Lokasi.',
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545'
  })
  if (!result.isConfirmed) return
  await remove(dbRef(db, `master_blok/${id}`))
}

// ── COMPUTED DATA ──
const blokData = computed(() => {
  return masterBlok.value.map(blok => {
    let items = dbStok.value
      .filter(i => i.bloks && (parseFloat(i.bloks[blok.nama]) || 0) > 0)
      .map(i => ({ ...i, stokDiBlok: parseFloat(i.bloks[blok.nama] || 0) }))

    if (searchBlok.value) {
      const q = searchBlok.value.toLowerCase()
      items = items.filter(i =>
        (i.nama    || '').toLowerCase().includes(q) ||
        (i.kodeErp || '').toLowerCase().includes(q) ||
        (i.warna   || '').toLowerCase().includes(q)
      )
    }
    const totalStok = items.reduce((s, i) => s + i.stokDiBlok, 0)
    return { nama: blok.nama, items, totalStok }
  }).filter(blok => searchBlok.value ? blok.items.length > 0 : true)
})

const tanpaLokasi = computed(() => {
  let items = []
  dbStok.value.forEach(i => {
    const totalStok = parseFloat(i.stok) || 0
    const diBlok = i.bloks ? Object.values(i.bloks).reduce((s, v) => s + parseFloat(v), 0) : 0
    const selisih = totalStok - diBlok
    
    if (selisih > 0.01) {
      items.push({ ...i, sisaTanpaBlok: selisih })
    }
  })

  if (searchBlok.value) {
    const q = searchBlok.value.toLowerCase()
    items = items.filter(i =>
      (i.nama    || '').toLowerCase().includes(q) ||
      (i.kodeErp || '').toLowerCase().includes(q) ||
      (i.warna   || '').toLowerCase().includes(q)
    )
  }
  return items
})

const grandTotal = computed(() =>
  dbStok.value.reduce((s, i) => s + (parseFloat(i.stok) || 0), 0)
)


// =========================================================================
// MENGGUNAKAN MUTASI AGAR TOTAL STOK TIDAK TERPENGARUH SAMA SEKALI
// =========================================================================

// 1. EDIT STOK BLOK SECARA MANUAL (Ini tetap Opname karena ngerubah jumlah real blok)
const bukaEditStok = (item, blokNama) => {
  editingItem.value = item.idUnik + blokNama
  editStokVal.value = item.stokDiBlok
}

const simpanStokBlok = async (item, blokNama) => {
  const stokBaru = parseFloat(editStokVal.value)
  if (isNaN(stokBaru) || stokBaru < 0) return

  try {
    await kirimTransaksi(item.idUnik, 'OPNAME', stokBaru, 'PENYESUAIAN PETA BLOK', blokNama)
    editingItem.value = ''
    window.Swal.fire({ icon: 'success', title: 'Tersimpan!', timer: 800, showConfirmButton: false })
  } catch(e) { window.Swal.fire('Error', e.message, 'error') }
}

// 2. PINDAH BLOK (MUTASI MURNI)
const pindahBlok = async (item, blokAsal, blokTujuan) => {
  if (!blokTujuan) return
  try {
    const bloks      = { ...(item.bloks || {}) }
    const stokPindah = parseFloat(bloks[blokAsal] || 0)
    if (stokPindah <= 0) return

    // Menggunakan kirimMutasi: Memindahkan dari Asal ke Tujuan TANPA mengubah Total Stok
    await kirimMutasi(item.idUnik, stokPindah, '', blokAsal, blokTujuan)

    window.Swal.fire({
      icon: 'success', title: `Dipindah ke Blok ${blokTujuan}`,
      timer: 800, showConfirmButton: false
    })
  } catch(e) { window.Swal.fire('Error', e.message, 'error') }
}

// 3. HAPUS DARI BLOK (MUTASI KE TANPA LOKASI)
const hapusDariBlok = async (item, blokNama) => {
  const result = await window.Swal.fire({
    title: 'Hapus dari Blok?',
    text: `Item akan ditarik dari Blok ${blokNama} dan menjadi Tanpa Lokasi.`,
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545'
  })
  if (!result.isConfirmed) return
  
  try {
    const bloks = { ...(item.bloks || {}) }
    const stokHapus = parseFloat(bloks[blokNama] || 0)
    
    // Tarik barangnya, balikin ke Tanpa Lokasi (Total stok aman!)
    await kirimMutasi(item.idUnik, stokHapus, 'DITARIK', blokNama, 'Tanpa Lokasi')

  } catch(e) { window.Swal.fire('Error', e.message, 'error') }
}

// 4. ASSIGN KE BLOK (DARI TANPA LOKASI MENGGUNAKAN PENCARIAN)
const bukaAssignKeBlok = (blokNama) => {
  assigningToBlok.value = blokNama
  assignRawKey.value    = ''
  assignStokVal.value   = ''
  assignItemPilih.value = null
}

const onInputAssign = () => {
  assignItemPilih.value = null
  if (!assignRawKey.value) { assignSuggestions.value = []; assignDrop.value = false; return }
  const tokens = assignRawKey.value.toUpperCase().trim().split(/\s+/)
  assignSuggestions.value = dbStok.value.filter(i => {
    const h = [i.kodeErp || '', i.nama || '', i.warna || ''].join(' ').toUpperCase()
    return tokens.every(t => h.includes(t))
  }).slice(0, 8)
  assignDrop.value = assignSuggestions.value.length > 0
}

const pilihAssignItem = (item) => {
  assignItemPilih.value = item
  assignRawKey.value    = item.kodeErp
  assignDrop.value      = false
}

const simpanAssignKeBlok = async (blokNama) => {
  if (!assignItemPilih.value) {
    window.Swal.fire('Peringatan', 'Pilih item dulu.', 'warning'); return
  }
  const stokMutasi = parseFloat(assignStokVal.value)
  if (isNaN(stokMutasi) || stokMutasi <= 0) {
    window.Swal.fire('Peringatan', 'Isi jumlah Kg.', 'warning'); return
  }
  
  try {
    const item = assignItemPilih.value
    
    // MUTASI! Tarik dari 'Tanpa Lokasi', masukkan ke Blok. Total Stok = TETAP 3000!
    await kirimMutasi(item.idUnik, stokMutasi, 'ALOKASI', 'Tanpa Lokasi', blokNama)

    assigningToBlok.value = ''
    assignRawKey.value    = ''
    assignStokVal.value   = ''
    assignItemPilih.value = null
    window.Swal.fire({
      icon: 'success', title: `Ditambahkan ke Blok ${blokNama}`,
      timer: 800, showConfirmButton: false
    })
  } catch(e) { window.Swal.fire('Error', e.message, 'error') }
}

// 5. ASSIGN DARI KOTAK TANPA LOKASI (YANG DI PALING BAWAH)
const bukaAssignTanpaLok = (item) => {
  assigningItem.value      = item.idUnik
  assignBlokNama.value     = ''
  assignStokTanpaLok.value = item.sisaTanpaBlok 
}

const simpanAssignTanpaLok = async (item) => {
  if (!assignBlokNama.value) {
    window.Swal.fire('Peringatan', 'Pilih blok dulu.', 'warning'); return
  }
  const stokMutasi = parseFloat(assignStokTanpaLok.value)
  if (isNaN(stokMutasi) || stokMutasi <= 0) {
    window.Swal.fire('Peringatan', 'Isi jumlah Kg.', 'warning'); return
  }

  try {
    // MUTASI! Tarik dari 'Tanpa Lokasi', masukkan ke Blok Tujuan. Total Stok = TETAP 3000!
    await kirimMutasi(item.idUnik, stokMutasi, 'ALOKASI', 'Tanpa Lokasi', assignBlokNama.value)

    assigningItem.value      = ''
    assignBlokNama.value     = ''
    assignStokTanpaLok.value = ''
    window.Swal.fire({
      icon: 'success', title: `Masuk ke Blok ${assignBlokNama.value}`,
      timer: 800, showConfirmButton: false
    })
  } catch(e) { window.Swal.fire('Error', e.message, 'error') }
}

// ── TOGGLE & SEARCH ──
const toggleBlok = nama => {
  activeBlok.value = activeBlok.value === nama ? '' : nama
}

watch(searchBlok, val => {
  if (val) {
    const blokAda = blokData.value.find(b => b.items.length > 0)
    if (blokAda) activeBlok.value = blokAda.nama
  } else {
    activeBlok.value = ''
  }
})

// ── QUICK AKSI ──
const quickTrans = (tipe, item) => {
  emit('close')
  setTimeout(() => bukaTransaksi(tipe, item), 300)
}

const quickRiwayat = (item) => {
  emit('close')
  setTimeout(() => bukaRiwayat(item.idUnik), 300)
}

onMounted(() => loadMasterBlok())
</script>

<style scoped>
.blok-card {
  border: 1.5px solid #dee2e6; border-radius: 12px;
  overflow: hidden; cursor: pointer;
  transition: all .2s; background: #fff;
}
.blok-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.1); }
.blok-active { border-color: #1e3c72 !important; }
.blok-header {
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  color: #fff; padding: 14px 16px;
}
.blok-items { padding: 0; border-top: 1px solid #eee; }
.blok-item-row {
  padding: 10px 14px; border-bottom: 1px solid #f5f5f5;
  transition: background .15s;
}
.blok-item-row:hover { background: #f8f9fa; }
.blok-total {
  display: flex; justify-content: space-between;
  padding: 10px 14px; background: #f8f9fa;
  border-top: 2px solid #dee2e6; font-size: .85rem;
}
.btn-xs { padding: 2px 6px; font-size: .7rem; border-radius: 4px; }

.ac-dropdown-new {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  background: #fff; border: 1px solid #ced4da;
  border-radius: 6px; z-index: 1050;
  max-height: 180px; overflow-y: auto;
  box-shadow: 0 8px 16px rgba(0,0,0,.15);
}
.ac-item-new {
  padding: 8px 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0;
  display: flex; flex-direction: column; align-items: flex-start;
  transition: background .15s;
}
.ac-item-new:last-child { border-bottom: none; }
.ac-item-new:hover { background-color: #f0f8ff; }
.border-dashed { border-width: 2px !important; border-style: dashed !important; opacity: 0.8; }
.border-dashed:hover { opacity: 1; }
</style>
