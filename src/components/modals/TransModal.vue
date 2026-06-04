<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header text-white" :class="headerClass">
          <h5 class="modal-title fw-bold">{{ modalTitle }}</h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <!-- INFO BARANG -->
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
            <div class="d-flex justify-content-between">
              <span>Sisa Stok:</span>
              <span class="fw-bold fs-5">{{ fmt(activeItem?.stok) }}</span>
            </div>
          </div>

          <!-- INPUT QTY -->
          <label class="fw-bold small">JUMLAH (KG)</label>
          <div class="input-group input-group-lg">
            <input
              type="number" step="any"
              class="form-control fw-bold text-center"
              v-model="qty"
              ref="qtyInput"
            >
            <span class="input-group-text">Kg</span>
          </div>

          <!-- LIVE SELISIH (OPNAME) -->
          <div v-if="tipe === 'OPNAME' && qty" class="mt-2 small fw-bold text-end">
            <span :class="selisih > 0 ? 'text-success' : selisih < 0 ? 'text-danger' : 'text-muted'">
              {{ selisih > 0 ? `Selisih Lebih: +${fmt(selisih)}` : selisih < 0 ? `Selisih Kurang: ${fmt(selisih)}` : 'Stok Akurat (0)' }} Kg
            </span>
          </div>

          <!-- LOKASI -->
          <label class="fw-bold small mt-3">LOKASI SAAT INI</label>
          <input
            type="text"
            class="form-control border-warning text-uppercase fw-bold"
            v-model="lokasi"
            placeholder="Contoh: A-01, B-05"
          >

          <!-- KETERANGAN -->
          <input
            type="text"
            class="form-control mt-3"
            v-model="keterangan"
            placeholder="Keterangan"
          >

          <!-- SUBMIT -->
          <div class="d-grid mt-3">
            <button
              type="button"
              class="btn btn-lg fw-bold text-white"
              :class="btnClass"
              :disabled="submitting"
              @click="submit"
            >
              {{ submitting ? 'Menyimpan...' : 'SIMPAN DATA' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useStok } from '../composables/useStok'
import { activeTrans } from '../composables/useTrans'

const emit = defineEmits(['close'])
const { kirimTransaksi } = useStok()

const qty = ref('')
const lokasi = ref('')
const keterangan = ref('')
const submitting = ref(false)
const qtyInput = ref(null)

const tipe = computed(() => activeTrans.value?.tipe || '')
const activeItem = computed(() => activeTrans.value?.item || null)

const selisih = computed(() => {
  if (tipe.value !== 'OPNAME' || !qty.value) return 0
  return parseFloat(qty.value) - (parseFloat(activeItem.value?.stok) || 0)
})

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
  MASUK: 'Transaksi Masuk',
  KELUAR: 'Transaksi Keluar',
  OPNAME: 'Opname Stok'
}[tipe.value] || 'Transaksi'))

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

watch(() => activeTrans.value, val => {
  if (val) {
    qty.value = ''
    lokasi.value = val.item?.lokasi || ''
    keterangan.value = ''
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
      tipe.value, q,
      (keterangan.value || '-').toUpperCase(),
      lokasi.value
    )
    emit('close')
  } finally {
    submitting.value = false
  }
}
</script>
