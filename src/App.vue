<template>
  <div>
    <!-- OFFLINE BADGE -->
    <div v-if="isOffline" class="offline-badge">
      <i class="fas fa-wifi-slash me-2"></i>
      KONEKSI TERPUTUS - Data akan disinkronkan otomatis saat sinyal kembali.
    </div>

    <!-- LOGIN -->
    <LoginView v-if="!authReady || !currentUser" />

    <!-- LOADING -->
    <div v-else-if="loading" class="loading-overlay">
      <div class="spinner-border text-primary mb-3"></div>
      <h5 class="fw-bold text-primary">Sinkronisasi Data...</h5>
    </div>

    <!-- MAIN APP -->
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
            @transaksi="bukaTransaksi"
            @riwayat="bukaRiwayat"
            @lokasi="bukaLokasi"
          />
        </div>
        <div v-if="!filteredItems.length" class="text-center py-5 text-muted">
          <h5>Data Kosong / Tidak Ditemukan</h5>
        </div>
      </div>

      <!-- MODALS & DRAWER -->
      <TransModal v-if="showTransModal" @close="showTransModal = false" />
      <HistDrawer v-if="showHistDrawer" @close="showHistDrawer = false" />
    </template>
  </div>
</template>

import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuth } from './composables/useAuth'
import { useStok, dbStok, itemVelocity, loading } from './composables/useStok'
import { filteredItems } from './composables/useFilter'
import { useTrans, activeTrans } from './composables/useTrans'
import { useHist, activeHistId } from './composables/useHist'

import LoginView from './components/LoginView.vue'
import NavBar from './components/NavBar.vue'
import StickySearch from './components/StickySearch.vue'
import CardItem from './components/CardItem.vue'
import TransModal from './components/modals/TransModal.vue'
import HistDrawer from './components/HistDrawer.vue'

const { initAuth } = useAuth()
const { refreshData } = useStok()
const { bukaTransaksi } = useTrans()
const { bukaRiwayat } = useHist()

const currentUser = ref(null)
const authReady = ref(false)
const isOffline = ref(false)
const itemsToShow = ref(30)

const visibleItems = computed(() =>
  filteredItems.value.slice(0, itemsToShow.value)
)

const showTransModal = computed(() => !!activeTrans.value)
const showHistDrawer = computed(() => !!activeHistId.value)

initAuth(user => {
  currentUser.value = user
  authReady.value = true
  if (user) refreshData()
})

const handleOffline = () => isOffline.value = true
const handleOnline  = () => isOffline.value = false

onMounted(() => {
  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)
  window.addEventListener('scroll', () => {
    if (window.scrollY + window.innerHeight > document.body.scrollHeight - 250) {
      if (itemsToShow.value < filteredItems.value.length)
        itemsToShow.value += 20
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('online', handleOnline)
})
</style>
