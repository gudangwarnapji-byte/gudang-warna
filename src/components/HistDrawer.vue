<template>
  <div class="hist-wrapper">
    <div class="hist-overlay" @click="$emit('close')"></div>

    <div class="hist-drawer">
      <div class="drawer-header">
        <h6 class="fw-bold m-0 text-truncate">{{ activeItem?.nama || 'Riwayat' }}</h6>
        <button class="btn-close" @click="$emit('close')"></button>
      </div>

      <div class="hist-list">
        <div v-if="loadingHist" class="text-center py-5">
            <div class="spinner-border text-primary"></div>
        </div>
        
        <div v-else-if="Object.keys(allLogs).length === 0" class="text-center py-5 text-muted">
            <small>Tidak ada data untuk ID: {{ activeHistId }}</small>
        </div>

        <template v-else v-for="m in months" :key="m">
            <div class="month-label">{{ formatMonth(m) }}</div>
            <div v-for="r in allLogs[m]" :key="r.trxId" class="history-item">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="small fw-bold">{{ formatDate(r.tanggal) }}</div>
                        <div class="small text-muted">{{ r.keterangan }}</div>
                    </div>
                    <div class="text-end">
                        <div class="fw-bold" :class="r.tipe === 'MASUK' ? 'text-success' : 'text-danger'">
                            {{ r.tipe === 'MASUK' ? '+' : '-' }}{{ fmt(r.qty) }}
                        </div>
                    </div>
                </div>
            </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { db } from '../firebase'
import { dbStok } from '../composables/useStok'
import { activeHistId } from '../composables/useHist'

const emit = defineEmits(['close'])
const allLogs = ref({})
const loadingHist = ref(false)
let unsubscribe = null

const fmt = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })
const formatDate = iso => new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
const formatMonth = m => m.split('-')[1] + '/' + m.split('-')[0]
const months = computed(() => Object.keys(allLogs.value).sort((a, b) => b.localeCompare(a)))

const loadHistoryData = (id) => {
  if (!id) return;
  console.log("Loading history for ID:", id); // DEBUG LOG
  
  if (unsubscribe) unsubscribe();
  loadingHist.value = true;
  allLogs.value = {};
  
  // Pastikan path Firebase benar (riwayat_transaksi/ID_ITEM)
  unsubscribe = onValue(dbRef(db, `riwayat_transaksi/${id}`), (snap) => {
    loadingHist.value = false;
    const data = snap.val();
    console.log("Data diterima:", data); // DEBUG LOG
    
    if (!data) return;
    
    const grouped = {};
    Object.values(data).forEach(r => {
      const key = (r.tanggal || '').slice(0, 7);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });
    allLogs.value = grouped;
  });
};

watch(activeHistId, loadHistoryData, { immediate: true });
onUnmounted(() => { if (unsubscribe) unsubscribe(); });
</script>
