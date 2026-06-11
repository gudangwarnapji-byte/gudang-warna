<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header text-white" :class="headerClass">
          <h5 class="modal-title fw-bold">{{ modalTitle }}</h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">

          <div class="alert alert-light border mb-3">
            <div class="d-flex justify-content-between mb-1">
              <span class="fw-bold text-primary fs-5">{{ activeItem?.nama }}</span>
              <div class="d-flex gap-1">
                <span class="badge bg-secondary">{{ activeItem?.jenis }}</span>
                <span class="badge bg-warning text-dark fw-bold">{{ activeItem?.grade }}</span>
              </div>
            </div>
            <div class="small text-muted">{{ activeItem?.warna }} | {{ activeItem?.kodeErp }}</div>
            <hr>
            <div class="d-flex justify-content-between align-items-center">
              <span>Total Keseluruhan Stok:</span>
              <span class="fw-bold fs-5">{{ fmt(activeItem?.stok) }} <small class="text-muted fs-6">Kg</small></span>
            </div>
            
            <div class="mt-2 p-2 bg-white rounded border">
              <div class="fw-bold text-secondary mb-1" style="font-size: 0.75rem;">RINCIAN SALDO SAAT INI:</div>
              
              <div v-for="b in daftarBlok" :key="b.nama" class="d-flex justify-content-between border-bottom pb-1 mb-1 small">
                <span class="text-dark fw-bold"><i class="fas fa-warehouse text-muted me-1"></i> {{ b.nama }}</span>
                <span class="text-primary fw-bold">{{ fmt(b.qty) }} Kg</span>
              </div>
              
              <div v-if="stokTanpaBlok > 0" class="d-flex justify-content-between pb-1 mb-1 small">
                <span class="text-warning fw-bold text-dark"><i class="fas fa-map-marker-alt text-muted me-1"></i> Tanpa Lokasi</span>
                <span class="text-warning fw-bold text-dark">{{ fmt(stokTanpaBlok) }} Kg</span>
              </div>
              
              <div v-if="!daftarBlok.length && stokTanpaBlok <= 0" class="text-muted small text-center pt-1">
                Stok saat ini kosong (0).
              </div>
            </div>
          </div>

          <label class="fw-bold small">
            {{ tipe === 'MASUK' ? 'MASUK KE BLOK' : tipe === 'KELUAR' ? 'AMBIL DARI BLOK' : 'OPNAME BLOK' }}
            <span class="text-muted fw-normal" style="font-size:.7rem"> — opsional</span>
          </label>
          <select class="form-select form-select-lg mb-3 border-secondary fw-bold" v-model="blokPilih">
            
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

          <label class="fw-bold small">JUMLAH (KG)</label>
          <div class="input-group input-group-lg">
            <input
              type="number" step="any"
              class="form-control fw-bold text-center"
              v-model="qty"
              ref="qtyInput"
              placeholder="0.00"
            >
            <span class="input-group-text">Kg</span>
          </div>

          <div v-if="qty !== '' && qty !== null" class="mt-3 p-2 rounded" style="background: #f8f9fa; border: 1px solid #dee2e6;">
            <div v-if="tipe === 'OPNAME'" class="small fw-bold text-end mb-2">
              <span :class="selisih > 0 ? 'text-success' : selisih < 0 ? 'text-danger' : 'text-muted'">
                {{ selisih > 0 ? `Selisih Lebih: +${fmt(selisih)}` : selisih < 0 ? `Selisih Kurang: ${fmt(selisih)}` : 'Stok Akurat (0)' }} Kg
              </span>
            </div>
            
            <div class="d-flex justify-content-between align-items-center">
              <span class="small fw-bold text-muted">
                Preview Saldo Akhir <span v-if="blokPilih">({{ blokPilih }})</span><span v-else>(Tanpa Lokasi)</span>:
              </span>
              <span class="fw-bold fs-6" :class="previewSaldoAkhir < 0 ? 'text-danger' : 'text-primary'">
                {{ fmt(previewSaldoAkhir) }} Kg
              </span>
            </div>
            <div v-if="previewSaldoAkhir < 0" class="small text-danger text-end mt-1">
              <i class="fas fa-exclamation-triangle me-1"></i> Peringatan: Stok minus!
            </div>
          </div>

          <input
            type="text"
            class="form-control mt-3"
            v-model="keterangan"
            placeholder="Keterangan Tambahan (Opsional)"
          >

          <div class="d-grid mt-4">
            <button
              type="button"
              class="btn btn-lg fw-bold text-white shadow-sm"
              :class="btnClass"
              :disabled="submitting || qty === '' || qty === null"
              @click="submit"
            >
              <i class="fas fa-save me-2"></i> {{ submitting ? 'Memproses...' : 'SIMPAN TRANSAKSI' }}
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

const headerClass = computed(() => ({
  'bg-success': tipe.value === 'MASUK',
  'bg-danger':  tipe.value === 'KELUAR',
  'bg-warning text-dark': tipe.value === 'OPNAME'
}))

const btnClass = computed(() => ({
  'btn-success': tipe.value === 'MASUK',
  'btn-danger':  tipe.value === 'KELUAR',
  'btn-warning text-dark': tipe.value === 'OPNAME'
}))

const modalTitle = computed(() => ({
  MASUK:  'Transaksi Masuk',
  KELUAR: 'Transaksi Keluar',
  OPNAME: 'Penyesuaian Stok'
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
