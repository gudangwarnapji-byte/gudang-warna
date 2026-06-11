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
              <div class="blok-card shadow-sm" :class="activeBlok === blok.nama ? 'blok-active' : ''"
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
                        <div class="fw-bold"
                             :class="(item.stokBlok||0) < 5 ? 'text-danger' : 'text-success'"
                             style="font-size:.9rem">
                          {{ fmt(item.stokBlok) }} Kg
                        </div>
                        <div v-if="isAdmin" class="d-flex gap-1 mt-1 justify-content-end flex-wrap">
                          
                          <select class="form-select form-select-sm"
                                  style="max-width:110px;font-size:.72rem"
                                  value=""
                                  @change="assignBlok(item, $event.target.value, blok.nama); $event.target.value=''"
                                  @click.stop>
                            <option value="">Pindah Blok...</option>
                            <option v-for="b in masterBlok" :key="b.id" :value="b.nama" :disabled="b.nama === blok.nama">
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
                        </div>
                      </div>
                    </div>
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
                        <div class="fw-bold"
                             :class="(item.sisaTanpaBlok||0) < 5 ? 'text-danger' : 'text-success'"
                             style="font-size:.9rem">
                          {{ fmt(item.sisaTanpaBlok) }} Kg
                        </div>
                        <div v-if="isAdmin" class="d-flex gap-1 mt-1 justify-content-end flex-wrap">
                          
                          <select class="form-select form-select-sm"
                                  style="max-width:110px;font-size:.72rem"
                                  value=""
                                  @change="assignBlok(item, $event.target.value, null); $event.target.value=''"
                                  @click.stop>
                            <option value="">Set Blok...</option>
                            <option v-for="b in masterBlok" :key="b.id" :value="b.nama">
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
import { ref as dbRef, set, remove, update } from 'firebase/database'
import { db } from '../../firebase'
import { dbStok } from '../../composables/useStok'
import { currentRole } from '../../composables/useAuth'
import { useTrans } from '../../composables/useTrans'
import { useHist } from '../../composables/useHist'
import { masterBlok, loadMasterBlok } from '../../composables/useBlok'

const emit = defineEmits(['close'])
const { bukaTransaksi } = useTrans()
const { bukaRiwayat }   = useHist()

const isAdmin        = computed(() => currentRole.value === 'admin')
const showKelolaBlok = ref(false)
const namaBlokBaru   = ref('')
const activeBlok     = ref('')
const searchBlok     = ref('')

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const tambahBlok = async () => {
  if (!namaBlokBaru.value.trim()) return
  const nama = namaBlokBaru.value.trim().toUpperCase()
  if (masterBlok.value.find(b => b.nama === nama)) {
    window.Swal.fire('Sudah Ada', `Blok ${nama} sudah terdaftar.`, 'warning')
    return
  }
  const id = 'blok_' + Date.now()
  await set(dbRef(db, `master_blok/${id}`), { nama })
  namaBlokBaru.value = ''
}

const hapusBlok = async (id) => {
  const result = await window.Swal.fire({
    title: 'Hapus Blok?',
    text: 'Item di blok ini tidak ikut terhapus.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545'
  })
  if (!result.isConfirmed) return
  await remove(dbRef(db, `master_blok/${id}`))
}

// LOGIKA PINDAH BLOK YANG BARU
const assignBlok = async (item, targetBlok, asalBlok = null) => {
  if (!targetBlok) return
  try {
    const bloks = { ...(item.bloks || {}) }
    let qtyYangDipindah = 0;

    if (asalBlok) {
      // Mindahin dari Blok A ke Blok B
      qtyYangDipindah = parseFloat(item.stokBlok) || 0;
      if (qtyYangDipindah <= 0) return;
      delete bloks[asalBlok]; // Cabut dari blok asal
    } else {
      // Set dari Tanpa Lokasi ke Blok Baru
      qtyYangDipindah = parseFloat(item.sisaTanpaBlok) || 0;
      if (qtyYangDipindah <= 0) return;
    }

    // Masukin qty ke blok tujuan (ditambah kalau blok tujuan udah ada isinya)
    const targetKey = targetBlok.toUpperCase();
    bloks[targetKey] = (parseFloat(bloks[targetKey]) || 0) + qtyYangDipindah;

    // Update ke Firebase
    await update(dbRef(db, `stok_benang/${item.idUnik}`), {
      bloks: bloks
    });

    window.Swal.fire({
      icon: 'success',
      title: asalBlok ? `Dipindah ke ${targetBlok}` : `Diset ke Blok ${targetBlok}`,
      timer: 1000,
      showConfirmButton: false
    })
  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  }
}

// LOGIKA MULTI-BLOK UNTUK RENDER BLOK
const blokData = computed(() => {
  return masterBlok.value.map(blok => {
    let items = []
    let totalStok = 0
    
    dbStok.value.forEach(i => {
      if (i.bloks && i.bloks[blok.nama]) {
        items.push({
          ...i,
          stokBlok: parseFloat(i.bloks[blok.nama])
        })
        totalStok += parseFloat(i.bloks[blok.nama])
      }
    })

    if (searchBlok.value) {
      const q = searchBlok.value.toLowerCase()
      items = items.filter(i =>
        (i.nama    || '').toLowerCase().includes(q) ||
        (i.kodeErp || '').toLowerCase().includes(q) ||
        (i.warna   || '').toLowerCase().includes(q)
      )
      totalStok = items.reduce((s, i) => s + i.stokBlok, 0)
    }
    
    return { nama: blok.nama, items, totalStok }
  }).filter(blok => searchBlok.value ? blok.items.length > 0 : true)
})

// LOGIKA UNTUK BARANG TANPA BLOK ATAU ADA SELISIH TOTAL STOK
const tanpaLokasi = computed(() => {
  let items = []
  
  dbStok.value.forEach(i => {
    const totalStok = parseFloat(i.stok) || 0
    let stokDiBlok = 0
    if (i.bloks) {
       stokDiBlok = Object.values(i.bloks).reduce((s, val) => s + parseFloat(val), 0)
    }
    
    const selisih = totalStok - stokDiBlok
    
    if (selisih > 0.01) {
       items.push({
         ...i,
         sisaTanpaBlok: selisih
       })
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
.btn-xs {
  padding: 2px 6px; font-size: .7rem; border-radius: 4px;
}
</style>
