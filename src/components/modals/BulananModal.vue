<template>
  <div class="modal fade show d-block backdrop-blur" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content modern-modal border-0 shadow-lg">
        
        <div class="modal-header border-0 pb-3">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2 m-0" style="color:var(--text-main)">
            <div class="icon-circle bg-primary-subtle text-primary"><i class="fas fa-chart-line"></i></div>
            Arus Barang per Keterangan (Bulanan)
          </h5>
          <button type="button" class="btn-close btn-close-custom" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-4">
          <div v-if="loading" class="text-center py-5"><div class="spinner-border text-primary"></div></div>
          
          <div v-else class="row g-4">
            <div v-for="(data, bulan) in arusData" :key="bulan" class="col-12 col-md-6">
              <div class="month-card shadow-sm">
                <div class="month-header">{{ bulan }}</div>
                
                <div class="rekap-grid">
                  <div v-for="(val, ket) in data" :key="ket" class="rekap-item">
                    <div class="fw-bold mb-1 border-bottom pb-1" style="font-size:0.8rem; color:var(--text-main)">
                      {{ ket }}
                    </div>
                    <div class="d-flex justify-content-between px-2 mt-1">
                      <div class="text-success"><small class="fw-bold d-block" style="font-size:0.6rem">IN</small>{{ fmt(val.MASUK) }}</div>
                      <div class="text-danger"><small class="fw-bold d-block" style="font-size:0.6rem">OUT</small>{{ fmt(val.KELUAR) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../../firebase'

const emit = defineEmits(['close'])
const arusData = ref({})
const loading = ref(false)
const fmt = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })

onMounted(async () => {
  loading.value = true
  const snap = await get(dbRef(db, 'riwayat_transaksi'))
  const all = snap.val() || {}
  const res = {}
  
  Object.values(all).forEach(p => Object.values(p).forEach(t => {
    const bulan = t.tanggal?.substring(0, 7) || 'LAIN'
    const ket = (t.keterangan || 'LAIN-LAIN').toUpperCase()
    
    if (!res[bulan]) res[bulan] = {}
    if (!res[bulan][ket]) res[bulan][ket] = { MASUK: 0, KELUAR: 0 }
    
    if (t.tipe === 'MASUK') res[bulan][ket].MASUK += parseFloat(t.qty) || 0
    if (t.tipe === 'KELUAR') res[bulan][ket].KELUAR += parseFloat(t.qty) || 0
  }))
  
  arusData.value = res
  loading.value = false
})
</script>

<style scoped>
.modern-modal { border-radius: 24px; background: var(--bg-card); }
.backdrop-blur { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
.icon-circle { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.bg-primary-subtle { background: rgba(79, 70, 229, 0.1); }
.month-card { background: var(--bg-main); border-radius: 16px; overflow: hidden; border: 1px solid var(--border-color); }
.month-header { background: #4f46e5; color: white; padding: 10px 15px; font-weight: 700; font-size: 0.9rem; }
.rekap-grid { padding: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.rekap-item { background: var(--bg-card); padding: 8px; border-radius: 8px; border: 1px solid var(--border-color); text-align: center; }
.btn-close-custom { opacity: 0.5; }
</style>
