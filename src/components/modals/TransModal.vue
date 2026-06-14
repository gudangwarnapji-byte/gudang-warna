<template>
  <div class="modal fade show d-block backdrop-blur" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content modern-modal border-0 shadow-lg">
        
        <div class="modal-header border-0 pb-0" :class="headerClass">
          <div class="d-flex align-items-center gap-2">
            <div class="icon-circle" :class="iconClass">
              <i :class="iconName"></i>
            </div>
            <h5 class="modal-title fw-bold m-0" style="letter-spacing: -0.5px;">{{ modalTitle }}</h5>
          </div>
          <button type="button" class="btn-close btn-close-custom" @click="$emit('close')"></button>
        </div>

        <div class="modal-body pt-3">
          
          <div class="item-info-card mb-4 shadow-sm">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <span class="fw-bold fs-5 text-truncate pe-2" style="color: var(--text-main); letter-spacing:-0.5px">{{ activeItem?.nama }}</span>
              <div class="d-flex gap-1 flex-shrink-0">
                <span class="badge-soft badge-soft-secondary">{{ activeItem?.jenis }}</span>
                <span class="badge-soft badge-soft-warning fw-bold">{{ activeItem?.grade }}</span>
              </div>
            </div>
            <div class="small fw-medium mb-3" style="color: var(--text-muted)">{{ activeItem?.warna }} • {{ activeItem?.kodeErp }}</div>
            
            <div class="stok-total-badge d-flex justify-content-between align-items-center">
              <span class="fw-bold" style="font-size:0.75rem; letter-spacing: 0.5px; opacity:0.8;">GRAND TOTAL STOK</span>
              <span class="fw-bold fs-5">{{ fmt(activeItem?.stok) }} <small style="font-size:60%; opacity:0.8;">Kg</small></span>
            </div>

            <div class="mt-3">
              <div class="fw-bold mb-2" style="font-size: 0.7rem; color: var(--text-muted); letter-spacing:0.5px;">RINCIAN LOKASI:</div>
              <div class="lokasi-list">
                <div v-for="b in daftarBlok" :key="b.nama" class="lokasi-item">
                  <span><i class="fas fa-warehouse me-2 opacity-50"></i> {{ b.nama }}</span>
                  <span class="fw-bold" style="color:var(--text-main)">{{ fmt(b.qty) }} Kg</span>
                </div>
                <div v-if="stokTanpaBlok > 0" class="lokasi-item warning">
                  <span><i class="fas fa-map-marker-alt me-2 opacity-50"></i> Tanpa Lokasi</span>
                  <span class="fw-bold">{{ fmt(stokTanpaBlok) }} Kg</span>
                </div>
                <div v-if="!daftarBlok.length && stokTanpaBlok <= 0" class="text-center py-2 opacity-50 small">
                  Stok fisik kosong (0).
                </div>
              </div>
            </div>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">
              {{ tipe === 'MASUK' ? 'SIMPAN KE LOKASI' : tipe === 'KELUAR' ? 'AMBIL DARI LOKASI' : 'OPNAME LOKASI' }}
            </label>
            <select class="form-select custom-input fw-bold" v-model="blokPilih">
              <template v-if="tipe === 'KELUAR' || tipe === 'OPNAME'">
                <option value="">
                  -- TANPA LOKASI (Tersedia: {{ fmt(stokTanpaBlok) }} Kg) --
                </option>
                <option v-for="b in daftarBlok" :key="'saran-'+b.nama" :value="b.nama">
                  {{ b.nama }} (Tersedia: {{ fmt(b.qty) }} Kg)
                </option>
                <option disabled>──────────────────</option>
              </template>
              <template v-else>
                <option value="">-- Bebas / Tanpa Lokasi --</option>
                <option disabled>──────────────────</option>
              </template>
              
              <option v-for="b in masterBlok" :key="b.id" :value="b.nama">
                {{ b.nama }}
              </option>
            </select>
          </div>

          <div class="form-group mb-3">
            <label class="form-label">JUMLAH BERAT</label>
            <div class="input-group input-group-lg shadow-sm" style="border-radius: 12px; overflow:hidden;">
              <input
                type="number" step="any"
                class="form-control custom-input fw-bold text-center fs-4"
                v-model="qty"
                ref="qtyInput"
                placeholder="0.00"
                style="border-right: none;"
              >
              <span class="input-group-text fw-bold custom-addon" style="border-left: none;">Kg</span>
            </div>
          </div>

          <div v-if="qty !== '' && qty !== null" class="preview-box mt-3 mb-3">
            <div v-if="tipe === 'OPNAME'" class="small fw-bold text-end mb-2">
              <span :class="selisih > 0 ? 'text-success' : selisih < 0 ? 'text-danger' : 'text-muted'">
                <i :class="selisih > 0 ? 'fas fa-arrow-up' : selisih < 0 ? 'fas fa-arrow-down' : 'fas fa-equals'" class="me-1"></i>
                {{ selisih > 0 ? `Selisih Lebih: +${fmt(selisih)}` : selisih < 0 ? `Selisih Kurang: ${fmt(selisih)}` : 'Akurat (0)' }} Kg
              </span>
            </div>
            
            <div class="d-flex justify-content-between align-items-center">
              <span class="small fw-bold" style="color:var(--text-muted)">
                Preview Saldo <span v-if="blokPilih">({{ blokPilih }})</span><span v-else>(Tanpa Lokasi)</span>:
              </span>
              <span class="fw-bold fs-5" :class="previewSaldoAkhir < 0 ? 'text-danger' : 'text-primary'">
                {{ fmt(previewSaldoAkhir) }} Kg
              </span>
            </div>
            <div v-if="previewSaldoAkhir < 0" class="small text-danger text-end mt-1 fw-bold">
              <i class="fas fa-exclamation-triangle me-1"></i> Warning: Stok akan minus!
            </div>
          </div>

          <div class="form-group">
            <input
              type="text"
              class="form-control custom-input"
              v-model="keterangan"
              placeholder="Catatan / Keterangan (Opsional)"
            >
          </div>

          <div class="d-grid mt-4 pt-2">
            <button
              type="button"
              class="btn btn-lg fw-bold submit-btn shadow-sm"
              :class="btnClass"
              :disabled="submitting || qty === '' || qty === null"
              @click="submit"
            >
              <i v-if="submitting" class="fas fa-circle-notch fa-spin me-2"></i>
              <i v-else class="fas fa-paper-plane me-2"></i> 
              {{ submitting ? 'Memproses...' : 'SIMPAN TRANSAKSI' }}
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useStok } from '../../composables/useStok'
import { activeTrans } from '../../composables/useTrans'
import { masterBlok } from '../../composables/useBlok'

const emit = defineEmits(['close'])
const { kirimTransaksi } = useStok()

const qty        = ref('')
const keterangan = ref('')
const blokPilih  = ref('')
const submitting = ref(false)
const qtyInput   = ref(null)

const tipe       = computed(() => activeTrans.value?.tipe || '')
const activeItem = computed(() => activeTrans.value?.item || null)

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

// === LOGIKA KALKULASI MULTI-BLOK ===
const daftarBlok = computed(() => {
  const bloks = activeItem.value?.bloks
  if (!bloks) return []
  return Object.entries(bloks)
    .filter(([_, q]) => parseFloat(q) > 0)
    .map(([nama, qty]) => ({ nama, qty: parseFloat(qty) }))
})

const stokTanpaBlok = computed(() => {
  const total = parseFloat(activeItem.value?.stok) || 0
  const diBlok = daftarBlok.value.reduce((s, b) => s + b.qty, 0)
  const selisih = total - diBlok
  return selisih > 0.01 ? selisih : 0
})

const saldoAwalTerpilih = computed(() => {
  if (blokPilih.value && activeItem.value?.bloks) {
    return parseFloat(activeItem.value.bloks[blokPilih.value]) || 0
  }
  return stokTanpaBlok.value
})

const selisih = computed(() => {
  if (tipe.value !== 'OPNAME' || qty.value === '' || qty.value === null) return 0
  return parseFloat(qty.value) - saldoAwalTerpilih.value
})

const previewSaldoAkhir = computed(() => {
  const inputQty = parseFloat(qty.value) || 0
  if (tipe.value === 'MASUK') return saldoAwalTerpilih.value + inputQty
  if (tipe.value === 'KELUAR') return saldoAwalTerpilih.value - inputQty
  if (tipe.value === 'OPNAME') return inputQty
  return saldoAwalTerpilih.value
})
// ===================================

const headerClass = computed(() => {
  if (tipe.value === 'MASUK') return 'header-in'
  if (tipe.value === 'KELUAR') return 'header-out'
  return 'header-opname'
})

const iconClass = computed(() => {
  if (tipe.value === 'MASUK') return 'icon-in'
  if (tipe.value === 'KELUAR') return 'icon-out'
  return 'icon-opname'
})

const iconName = computed(() => {
  if (tipe.value === 'MASUK') return 'fas fa-arrow-down'
  if (tipe.value === 'KELUAR') return 'fas fa-arrow-up'
  return 'fas fa-check-double'
})

const btnClass = computed(() => {
  if (tipe.value === 'MASUK') return 'btn-in-submit'
  if (tipe.value === 'KELUAR') return 'btn-out-submit'
  return 'btn-opname-submit'
})

const modalTitle = computed(() => ({
  MASUK:  'Transaksi Masuk',
  KELUAR: 'Transaksi Keluar',
  OPNAME: 'Penyesuaian Fisik'
}[tipe.value] || 'Transaksi'))

watch(() => activeTrans.value, val => {
  if (val) {
    qty.value        = ''
    keterangan.value = ''
    blokPilih.value  = '' 
    nextTick(() => qtyInput.value?.focus())
  }
})

const submit = async () => {
  const q = parseFloat(qty.value)
  if (!activeItem.value || isNaN(q)) return
  submitting.value = true
  try {
    await kirimTransaksi(
      activeItem.value.idUnik,
      tipe.value, 
      q,
      (keterangan.value || '-').toUpperCase(),
      blokPilih.value
    )
    emit('close')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
/* BACKGROUND GELAP LEBIH HALUS */
.backdrop-blur { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }

/* MODAL CONTAINER MODERN */
.modern-modal {
  border-radius: 24px;
  background: var(--bg-main); /* Ikut dark mode */
  overflow: hidden;
}

/* HEADER DINAMIS */
.modal-header { padding: 20px 24px; }
.header-in { color: #059669; }
.header-out { color: #dc2626; }
.header-opname { color: #d97706; }

.icon-circle {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
}
.icon-in { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.icon-out { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.icon-opname { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.btn-close-custom {
  background: transparent url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%2364748b'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414z'/%3e%3c/svg%3e") center/1em auto no-repeat;
  border: none; width: 32px; height: 32px; opacity: 0.5; transition: opacity 0.2s; cursor:pointer;
}
.btn-close-custom:hover { opacity: 1; }

/* KARTU INFO BARANG */
.item-info-card {
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 16px; padding: 20px;
}
.badge-soft {
  font-size: 0.7rem; padding: 4px 10px; border-radius: 8px; font-weight: 700;
}
.badge-soft-secondary { background: var(--bg-main); color: var(--text-muted); }
.badge-soft-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

.stok-total-badge {
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  color: white; padding: 12px 16px; border-radius: 12px;
}

.lokasi-list { display: flex; flex-direction: column; gap: 8px; }
.lokasi-item {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 0.85rem; color: var(--text-muted); padding-bottom: 6px; border-bottom: 1px dashed var(--border-color);
}
.lokasi-item:last-child { border-bottom: none; padding-bottom: 0; }
.lokasi-item.warning { color: #d97706; }
.lokasi-item.warning .fw-bold { color: #b45309; }

/* INPUT FORM MODERN */
.form-label {
  font-size: 0.75rem; font-weight: 800; color: var(--text-muted); letter-spacing: 0.5px;
}
.custom-input {
  background: var(--bg-card); color: var(--text-main);
  border: 1px solid var(--border-color); border-radius: 12px;
  padding: 12px 16px; transition: all 0.3s;
}
.custom-input:focus {
  background: var(--bg-card); color: var(--text-main);
  border-color: #818cf8; box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1); outline: none;
}
.custom-input::placeholder { color: var(--text-muted); opacity: 0.5; }

.custom-addon {
  background: var(--bg-main); color: var(--text-muted);
  border: 1px solid var(--border-color); border-radius: 12px;
}

/* PREVIEW BOX */
.preview-box {
  background: var(--bg-card); border: 1px solid var(--border-color);
  border-radius: 12px; padding: 16px; border-left: 4px solid #4f46e5;
}

/* SUBMIT BUTTON */
.submit-btn { border-radius: 14px; padding: 14px; font-size: 1rem; color: #fff; border: none; transition: transform 0.2s;}
.submit-btn:hover:not(:disabled) { transform: translateY(-2px); }
.btn-in-submit { background: linear-gradient(135deg, #10b981, #059669); }
.btn-out-submit { background: linear-gradient(135deg, #ef4444, #dc2626); }
.btn-opname-submit { background: linear-gradient(135deg, #f59e0b, #d97706); }
</style>
