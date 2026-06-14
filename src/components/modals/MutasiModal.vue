<template>
  <div class="modal fade show d-block backdrop-blur" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content modern-modal border-0 shadow-lg">
        <div class="modal-header border-0 pb-3">
          <h5 class="modal-title fw-bold d-flex align-items-center gap-2 m-0" style="color:var(--text-main)">
            <div class="icon-circle bg-success-subtle text-success"><i class="fas fa-exchange-alt"></i></div>
            Laporan Mutasi
          </h5>
          <button type="button" class="btn-close btn-close-custom" @click="$emit('close')"></button>
        </div>
        <div class="modal-body p-0">
          <div class="table-responsive" style="max-height:60vh">
            <table class="table modern-table table-hover align-middle mb-0">
              <thead class="sticky-top">
                <tr>
                  <th>Tanggal</th>
                  <th>Barang</th>
                  <th>Dari</th>
                  <th>Ke</th>
                  <th class="text-end">Qty (Kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="m in mutasiLogs" :key="m.id">
                  <td class="small">{{ new Date(m.tanggal).toLocaleDateString('id-ID') }}</td>
                  <td>
                    <div class="fw-bold" style="color:var(--text-main)">{{ m.namaBarang }}</div>
                    <div class="small" style="color:var(--text-muted)">{{ m.kodeErp }}</div>
                  </td>
                  <td><span class="badge-soft badge-soft-secondary">{{ m.dari }}</span></td>
                  <td><span class="badge-soft badge-soft-primary">{{ m.ke }}</span></td>
                  <td class="text-end fw-bold text-primary">{{ fmt(m.qty) }}</td>
                </tr>
              </tbody>
            </table>
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
import { dbStok } from '../../composables/useStok'

const emit = defineEmits(['close'])
const mutasiLogs = ref([])
const fmt = n => Number(n || 0).toLocaleString('id-ID', { minimumFractionDigits: 2 })

onMounted(async () => {
  const snap = await get(dbRef(db, 'riwayat_transaksi'))
  const all = snap.val() || {}
  const res = []
  Object.keys(all).forEach(pId => {
    Object.values(all[pId] || {}).forEach(t => {
      if (t.keterangan === 'ALOKASI' || t.tipe === 'MUTASI') {
        const item = dbStok.value.find(x => x.idUnik === pId)
        res.push({ ...t, namaBarang: item?.nama, kodeErp: item?.kodeErp, dari: t.blokAsal, ke: t.blokTujuan })
      }
    })
  })
  mutasiLogs.value = res.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
})
</script>

<style scoped>
.modern-modal { border-radius: 24px; background: var(--bg-card); }
.backdrop-blur { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
.icon-circle { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.bg-success-subtle { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.modern-table th { background: var(--bg-main); color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; padding: 12px; }
.modern-table td { color: var(--text-main); font-size: 0.85rem; padding: 12px; }
.badge-soft { font-size: 0.7rem; padding: 3px 8px; border-radius: 6px; font-weight: 700; }
.badge-soft-secondary { background: var(--bg-main); color: var(--text-muted); }
.badge-soft-primary { background: rgba(79, 70, 229, 0.1); color: #818cf8; }
.btn-close-custom { opacity: 0.5; }
</style>
