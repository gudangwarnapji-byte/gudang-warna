<template>
  <div class="col-12 col-md-6 col-lg-4">
    <div class="card-item shadow-sm p-3" :style="{ background: isCritical ? '#fff0f0' : '#fff' }">

      <!-- HEADER -->
      <div class="d-flex justify-content-between mb-2">
        <h5 class="fw-bold text-primary m-0 text-truncate" style="letter-spacing:-.5px">
          {{ item.nama }}
        </h5>
        <div class="d-flex align-items-center gap-1">
          <span :class="['badge', jenisBadgeColor, 'badge-custom']">{{ item.jenis }}</span>
          <span class="badge bg-warning text-dark badge-custom fw-bold">{{ item.grade || '-' }}</span>
          <span v-if="velocity" v-html="velocityBadge"></span>
        </div>
      </div>

<!-- INFO -->
<div class="mb-3">
  <small class="text-muted d-block mb-2">
    {{ item.warna }} | <b>{{ item.kodeErp }}</b>
  </small>
  <div class="d-flex gap-2 mt-1">
    <div v-if="namaBlok" class="blok-pill">
      <i class="fas fa-warehouse me-1" style="font-size:.7rem"></i>
      Blok {{ namaBlok }}
    </div>
    <div v-else class="blok-pill-empty">
      <i class="fas fa-warehouse me-1" style="font-size:.7rem"></i>
      Belum ada blok
    </div>
  </div>
</div>

<!-- STOK -->
      <div class="stok-box mb-3 shadow-sm">
        <div class="small text-muted fw-bold" style="font-size:.65rem">STOK SAAT INI</div>
        <div :class="['stok-number', isCritical ? 'text-danger' : 'text-safe']">
          {{ fmt(item.stok) }} <span style="font-size:.8rem">Kg</span>
        </div>
      </div>

      <!-- ACTIONS -->
      <div v-if="role === 'admin'" class="d-flex gap-1">
        <button class="btn btn-outline-success flex-grow-1 fw-bold"
                @click="$emit('transaksi', 'MASUK', item)">Masuk</button>
        <button class="btn btn-outline-danger flex-grow-1 fw-bold"
                @click="$emit('transaksi', 'KELUAR', item)">Keluar</button>
<button class="btn btn-light border shadow-sm"
        @click="$emit('riwayat', item.idUnik)">
  <i class="fas fa-history"></i>
</button>
        <button class="btn btn-warning border text-dark shadow-sm"
                @click="$emit('transaksi', 'OPNAME', item)">
          <i class="fas fa-check-double"></i>
        </button>
      </div>
      <div v-else class="d-grid">
        <button class="btn btn-light border fw-bold shadow-sm"
                @click="$emit('riwayat', item.idUnik)">
          <i class="fas fa-history me-2 text-primary"></i>Riwayat
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { masterBlok } from '../composables/useBlok'

const props = defineProps({
  item: Object,
  velocity: String,
  role: String
})

defineEmits(['transaksi', 'riwayat'])

const fmt = n => Number(n).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const isCritical = computed(() => {
  const s = Number(props.item.stok) || 0
  return s < 5 && s !== 0
})

const jenisBadgeColor = computed(() => {
  const t = (props.item.jenis || '').toUpperCase()
  if (t.includes('AJL'))     return 'bg-primary'
  if (t.includes('WARPING')) return 'bg-danger'
  if (t.includes('WEAVING')) return 'bg-warning text-dark'
  if (t.includes('KELOS'))   return 'bg-success'
  return 'bg-secondary'
})

const velocityBadge = computed(() => {
  const v = props.velocity
  if (v === 'FAST')   return '<span class="badge bg-danger badge-custom ms-1 fw-bold"><i class="fas fa-fire me-1"></i>FAST</span>'
  if (v === 'MEDIUM') return '<span class="badge bg-success badge-custom ms-1 fw-bold">MEDIUM</span>'
  if (v === 'SLOW')   return '<span class="badge bg-warning text-dark badge-custom ms-1 fw-bold">SLOW</span>'
  return '<span class="badge bg-secondary badge-custom ms-1 fw-bold">DEAD</span>'
})

const namaBlok = computed(() => {
  if (!props.item?.lokasi) return ''
  if (!masterBlok.value?.length) return ''
  const blok = masterBlok.value.find(b =>
    b.nama === (props.item.lokasi || '').toUpperCase()
  )
  return blok ? blok.nama : ''
})
</script>
