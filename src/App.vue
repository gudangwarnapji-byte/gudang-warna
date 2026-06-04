<template>
  <div>
    <div v-if="isOffline" class="offline-badge">
      <i class="fas fa-wifi-slash me-2"></i>
      KONEKSI TERPUTUS - Data akan disinkronkan otomatis saat sinyal kembali.
    </div>

    <LoginView v-if="!authReady || !currentUser" />

    <div v-else-if="loading" class="loading-overlay">
      <div class="spinner-border text-primary mb-3"></div>
      <h5 class="fw-bold text-primary">Sinkronisasi Data...</h5>
    </div>

    <template v-else>
      <NavBar />
      <div class="container">
        <StickySearch />
        <div class="row g-3 mt-1">
          <CardItem
            v-for="item in visibleItems"
            :key="item.idUnik"
            :item="item"
            :velocity="itemVelocity[item.idUnik]"
            :role="currentRole"
            @transaksi="onTransaksi"
            @riwayat="onRiwayat"
            @lokasi="onLokasi"
          />
        </div>
        <div v-if="!filteredItems.length" class="text-center py-5 text-muted">
          <h5>Data Kosong / Tidak Ditemukan</h5>
        </div>
      </div>
<TransModal v-if="showTransModal" @close="activeTrans = null" />
      <HistDrawer v-show="showHistDrawer" @close="activeHistId = ''" />
      <DailyModal v-if="showDailyModal" @close="showDailyModal = false" />
      <AddModal v-if="showAddModal" @close="showAddModal = false" />
      <BatchModal v-if="showBatchModal" @close="showBatchModal = false" />
      <EditTransModal
  v-if="activeEditTrans"
  @close="activeEditTrans = null"
  @saved="onEditSaved"
/>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth, currentRole } from './composables/useAuth'
import { useStok, itemVelocity, loading } from './composables/useStok'
import { filteredItems } from './composables/useFilter'
import { useTrans, activeTrans } from './composables/useTrans'
import { useHist, activeHistId } from './composables/useHist'
import DailyModal from './components/modals/DailyModal.vue'
import { useDaily, showDailyModal } from './composables/useDaily'
import AddModal from './components/modals/AddModal.vue'
import { showAddModal } from './composables/useAdd'
import BatchModal from './components/modals/BatchModal.vue'
import { showBatchModal } from './composables/useBatch'
import EditTransModal from './components/modals/EditTransModal.vue'
import { activeEditTrans } from './composables/useEditTrans'
  
import LoginView from './components/LoginView.vue'
import NavBar from './components/NavBar.vue'
import StickySearch from './components/StickySearch.vue'
import CardItem from './components/CardItem.vue'
import TransModal from './components/modals/TransModal.vue'
import HistDrawer from './components/HistDrawer.vue'

const { initAuth } = useAuth()
const { refreshData } = useStok()
const { bukaRiwayat } = useHist()
const { bukaTransaksi } = useTrans()

const currentUser = ref(null)
const authReady = ref(false)
const isOffline = ref(false)
const itemsToShow = ref(30)

const visibleItems = computed(() => filteredItems.value.slice(0, itemsToShow.value))
const showTransModal = computed(() => !!activeTrans.value)
const showHistDrawer = computed(() => !!activeHistId.value)

initAuth(user => {
  currentUser.value = user
  authReady.value = true
  if (user) refreshData()
})

const onTransaksi = (tipe, item) => {
  console.log('onTransaksi:', tipe, item.nama)
  bukaTransaksi(tipe, item)
}

const onRiwayat = (id) => {
  console.log('onRiwayat:', id)
  bukaRiwayat(id)
}

const onLokasi = (id) => {
  if (currentRole.value !== 'admin') return
  const item = filteredItems.value.find(x => x.idUnik === id)
  window.Swal.fire({
    title: 'Update Lokasi',
    input: 'text',
    inputValue: item?.lokasi || '',
    inputLabel: 'Contoh: A-01, B-05',
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    confirmButtonColor: '#1e3c72'
  }).then(result => {
    if (result.isConfirmed) {
      const { updateLokasi } = useStok()
      updateLokasi(id, result.value)
    }
  })
}
  const onEditSaved = () => {
  // riwayat reload otomatis
}

const handleOffline = () => { isOffline.value = true }
const handleOnline = () => { isOffline.value = false }

onMounted(() => {
  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
  window.addEventListener('scroll', () => {
    if (window.scrollY + window.innerHeight > document.body.scrollHeight - 250) {
      if (itemsToShow.value < filteredItems.value.length) {
        itemsToShow.value += 20
      }
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('online', handleOnline)
})
</script>

<style>
:root { --primary: #1e3c72; --secondary: #2a5298; --bg: #f4f6f9; }
body { background: var(--bg); font-family: 'Inter', sans-serif; padding-bottom: 80px; }
.offline-badge {
  position: fixed; top: 0; left: 0; width: 100%;
  background: #dc3545; color: #fff; text-align: center;
  padding: 5px; font-size: .75rem; font-weight: 700;
  z-index: 11000;
}
.loading-overlay {
  position: fixed; inset: 0; background: rgba(255,255,255,.98);
  z-index: 9999; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
</style>
