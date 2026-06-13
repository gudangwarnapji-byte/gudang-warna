<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow">

        <div class="modal-header bg-info text-white pb-3">
          <div class="w-100">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 class="modal-title fw-bold">Rekapitulasi Harian</h5>
              <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
            </div>
            <div class="input-group input-group-sm shadow-sm">
              <input type="date" class="form-control border-0 fw-bold" v-model="tglPicker" @change="loadData">
              <button class="btn btn-light text-info fw-bold" @click="loadData">
                <i class="fas fa-sync-alt"></i>
              </button>
              <button class="btn btn-success fw-bold ms-1" @click="exportExcel">
                <i class="fas fa-file-excel"></i>
              </button>
              <button v-if="currentRole === 'admin' && checkedIds.length"
                      class="btn btn-danger fw-bold ms-1"
                      @click="hapusTerpilih">
                <i class="fas fa-trash-alt me-1"></i>Hapus ({{ checkedIds.length }})
              </button>
            </div>
          </div>
        </div>

        <div class="modal-body p-0">
          <div class="table-responsive" style="max-height:50vh;overflow-y:auto">
            <table class="table table-hover mb-0 align-middle small">
              <thead class="table-light sticky-top shadow-sm">
                <tr>
                  <th v-if="currentRole === 'admin'" class="text-center" style="width:40px">
                    <input type="checkbox" class="form-check-input"
                           :checked="allChecked"
                           @change="toggleAll">
                  </th>
                  <th>Kode &amp; Nama Barang</th>
                  <th>Tipe Transaksi</th>
                  <th class="text-end">Qty (Kg)</th>
                  <th>Keterangan</th>
                  <th v-if="currentRole === 'admin'" class="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <template v-if="loading">
                  <tr><td :colspan="currentRole === 'admin' ? 6 : 5" class="text-center py-4">
                    <div class="spinner-border text-info"></div>
                  </td></tr>
                </template>
                <template v-else-if="groupedLogs.length">
                  <template v-for="group in groupedLogs" :key="group.tipe + group.ket">
                    <tr :class="tipeRowClass(group.tipe)">
                      <td :colspan="currentRole === 'admin' ? 6 : 5" class="fw-bold py-2">
                        <i :class="tipeIcon(group.tipe)" class="me-2"></i>
                        TRANSAKSI: {{ group.tipe }}
                      </td>
                    </tr>
                    <tr class="bg-light">
                      <td :colspan="currentRole === 'admin' ? 6 : 5" class="fw-bold text-secondary py-2 ps-3" style="font-size:.85rem">
                        <i class="fas fa-tag me-1 text-muted"></i> KETERANGAN: {{ group.ket }}
                      </td>
                    </tr>
                    <tr v-for="r in group.rows" :key="r.trxId" :class="checkedIds.includes(r.parentId+'|'+r.trxId) ? 'table-danger' : ''">
                      <td v-if="currentRole === 'admin'" class="text-center">
                        <input type="checkbox" class="form-check-input"
                               :value="r.parentId+'|'+r.trxId"
                               v-model="checkedIds">
                      </td>
                      <td class="ps-4">
                        <div class="fw-bold text-dark" style="line-height:1.1">{{ r.namaBarang }}</div>
                        <div style="font-size:.7rem" class="text-muted font-monospace">{{ r.kodeErpRef }}</div>
                      </td>
                      <td>
                        <div><span class="badge mb-1" :class="tipeBadgeClass(r.tipe)">{{ r.tipe }}</span></div>
                        <span v-if="r.blok" class="badge bg-secondary text-white" style="font-size:.65rem">
                          <i class="fas fa-warehouse me-1"></i> {{ r.blok }}
                        </span>
                      </td>
                      <td class="text-end fw-bold">{{ fmt(r.qty) }}</td>
                      <td>
                        <span class="badge badge-ket text-uppercase shadow-sm" :class="ketBadgeClass(r.keterangan)">
                          {{ r.keterangan || '-' }}
                        </span>
                      </td>
                      <td v-if="currentRole === 'admin'" class="text-center">
                        <button class="btn btn-sm btn-link text-warning p-0"
                                @click="editDariHarian(r)">
                          <i class="fas fa-pencil-alt"></i>
                        </button>
                      </td>
                    </tr>
                  </template>
                </template>
                <template v-else>
                  <tr><td :colspan="currentRole === 'admin' ? 6 : 5" class="text-center py-5 text-muted">
                    Tidak ada aktivitas pada tanggal ini
                  </td></tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer bg-light py-3 d-block border-top">
          <div class="d-flex flex-wrap gap-2 justify-content-center">
            <div
              v-for="(d, ket) in rekapMap" :key="ket"
              class="card shadow-sm border-0 bg-white p-2 text-center"
              style="min-width:145px;border-top:4px solid #1e3c72 !important"
            >
              <div class="fw-bold mb-1 border-bottom pb-1 text-primary" style="font-size:.75rem">{{ ket }}</div>
              <div class="d-flex justify-content-between gap-3 px-2">
                <div class="text-success">
                  <small style="font-size:.6rem;display:block" class="fw-bold">MASUK</small>
                  <b>{{ fmt(d.MASUK) }}</b>
                </div>
                <div class="text-danger">
                  <small style="font-size:.6rem;display:block" class="fw-bold">KELUAR</small>
                  <b>{{ fmt(d.KELUAR) }}</b>
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
import { ref, computed, onMounted } from 'vue'
import { ref as dbRef, get, update } from 'firebase/database'
import { db } from '../../firebase'
import { dbStok, useStok } from '../../composables/useStok'
import { useEditTrans } from '../../composables/useEditTrans'
import { currentRole } from '../../composables/useAuth'

const emit = defineEmits(['close'])
const { refreshData } = useStok()
const { bukaEdit } = useEditTrans()

const tglPicker = ref(new Date().toISOString().slice(0, 10))
const loading = ref(false)
const logs = ref([])
const checkedIds = ref([]) 

const fmt = n => Number(n || 0).toLocaleString('id-ID', {
  minimumFractionDigits: 2, maximumFractionDigits: 2
})

const editDariHarian = (r) => {
  bukaEdit(r, r.parentId)
  emit('close')
}

const allChecked = computed(() => {
  const allIds = logs.value.map(r => r.parentId + '|' + r.trxId)
  return allIds.length > 0 && allIds.every(id => checkedIds.value.includes(id))
})

const toggleAll = (e) => {
  if (e.target.checked) {
    checkedIds.value = logs.value.map(r => r.parentId + '|' + r.trxId)
  } else {
    checkedIds.value = []
  }
}

const loadData = async () => {
  loading.value = true
  logs.value = []
  checkedIds.value = [] 
  try {
    const snap = await get(dbRef(db, 'riwayat_transaksi'))
    const all = snap.val() || {}
    const result = []
    Object.keys(all).forEach(pId => {
      Object.values(all[pId] || {}).forEach(trx => {
        if (trx.tanggal?.startsWith(tglPicker.value)) {
          const m = dbStok.value.find(x => x.idUnik === pId)
          result.push({
            ...trx,
            namaBarang: m?.nama || 'N/A',
            kodeErpRef: m?.kodeErp || '-',
            parentId: pId
          })
        }
      })
    })
    
    // LOGIKA SORTING A-Z BERDASARKAN KODE ERP
    result.sort((a, b) => (a.kodeErpRef || '').localeCompare(b.kodeErpRef || ''))
    
    logs.value = result
  } finally {
    loading.value = false
  }
}

// FUNGSI HAPUS BULK & RE-AUDIT MULTI-BLOK
const hapusTerpilih = async () => {
  if (!checkedIds.value.length) return
  const result = await window.Swal.fire({
    title: `Hapus ${checkedIds.value.length} Transaksi?`,
    text: 'Data akan dihapus permanen dan stok dihitung ulang.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Ya, Hapus!'
  })
  
  if (!result.isConfirmed) return

  window.Swal.fire({
    title: 'Memproses...',
    allowOutsideClick: false,
    didOpen: () => window.Swal.showLoading()
  })

  try {
    const parentIds = new Set()
    const delUpdates = {}

    checkedIds.value.forEach(val => {
      const [pId, tId] = val.split('|')
      delUpdates[`riwayat_transaksi/${pId}/${tId}`] = null
      parentIds.add(pId)
    })

    await update(dbRef(db), delUpdates)

    const [snapM, snapH] = await Promise.all([
      get(dbRef(db, 'stok_benang')),
      get(dbRef(db, 'riwayat_transaksi'))
    ])
    
    const masters = snapM.val() || {}
    const histories = snapH.val() || {}
    const auditUp = {}

    parentIds.forEach(id => {
      const item = masters[id]
      if (!item) return
      let run = Number(item.stokAwal) || 0
      const bloksAudit = {}

      Object.values(histories[id] || {})
        .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
        .forEach(l => {
          const q = Number(l.qty)
          const blokNama = l.blok || ''
          
          if (l.tipe === 'MASUK') {
            run += q
            if (blokNama) bloksAudit[blokNama] = (parseFloat(bloksAudit[blokNama]) || 0) + q
          } else if (l.tipe === 'KELUAR') {
            run -= q
            if (blokNama) bloksAudit[blokNama] = (parseFloat(bloksAudit[blokNama]) || 0) - q
          } else if (l.tipe === 'OPNAME') {
            if (blokNama) {
              const stokBlokLama = parseFloat(bloksAudit[blokNama]) || 0
              const selisih = q - stokBlokLama
              run += selisih
              bloksAudit[blokNama] = q
            } else {
              run = q
            }
          }
          
          run = parseFloat(run.toFixed(2))
          auditUp[`riwayat_transaksi/${id}/${l.trxId}/stokAkhir`] = run
        })

      Object.keys(bloksAudit).forEach(b => { 
        bloksAudit[b] = parseFloat(bloksAudit[b].toFixed(2))
        if (bloksAudit[b] <= 0) delete bloksAudit[b] 
      })

      auditUp[`stok_benang/${id}/stok`] = run
      auditUp[`stok_benang/${id}/bloks`] = Object.keys(bloksAudit).length ? bloksAudit : null
    })

    if (Object.keys(auditUp).length) await update(dbRef(db), auditUp)

    window.Swal.fire('Berhasil!', 'Transaksi dihapus & stok diaudit.', 'success')
    refreshData()
    loadData()

  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  }
}

const ORDER = ['MASUK', 'KELUAR', 'OPNAME']

const groupedLogs = computed(() => {
  const groups = {}
  logs.value.forEach(r => {
    const key = `${r.tipe}||${(r.keterangan || 'LAIN-LAIN').toUpperCase()}`
    if (!groups[key]) groups[key] = {
      tipe: r.tipe,
      ket: (r.keterangan || 'LAIN-LAIN').toUpperCase(),
      rows: []
    }
    groups[key].rows.push(r)
  })
  return Object.values(groups).sort((a, b) =>
    ORDER.indexOf(a.tipe) - ORDER.indexOf(b.tipe)
  )
})

const rekapMap = computed(() => {
  const map = {}
  logs.value.forEach(r => {
    const ket = (r.keterangan || 'LAIN-LAIN').toUpperCase()
    if (!map[ket]) map[ket] = { MASUK: 0, KELUAR: 0 }
    if (r.tipe === 'MASUK') map[ket].MASUK += parseFloat(r.qty) || 0
    if (r.tipe === 'KELUAR') map[ket].KELUAR += parseFloat(r.qty) || 0
  })
  return map
})

const tipeRowClass = t => ({
  'bg-success text-white': t === 'MASUK',
  'bg-danger text-white': t === 'KELUAR',
  'bg-warning text-dark': t === 'OPNAME'
})

const tipeBadgeClass = t => ({
  'bg-success': t === 'MASUK',
  'bg-danger': t === 'KELUAR',
  'bg-warning text-dark': t === 'OPNAME'
})

const tipeIcon = t => ({
  'MASUK': 'fas fa-arrow-down',
  'KELUAR': 'fas fa-arrow-up',
  'OPNAME': 'fas fa-exchange-alt'
}[t])

const ketBadgeClass = ket => {
  const t = (ket || '').toUpperCase()
  if (t.includes('AJL')) return 'bg-primary'
  if (t.includes('WARPING')) return 'bg-danger'
  if (t.includes('WEAVING')) return 'bg-warning text-dark'
  if (t.includes('KELOS')) return 'bg-success'
  return 'bg-secondary'
}

// EXPORT EXCEL (Sudah ada BLOK LOKASI)
const exportExcel = () => {
  if (!logs.value.length) return
  const rows = [
    ['REKAPITULASI TRANSAKSI HARIAN', `Tanggal: ${tglPicker.value}`],
    [],
    ['TANGGAL', 'JAM', 'KODE ERP', 'NAMA BARANG', 'TIPE', 'BLOK LOKASI', 'QTY (KG)', 'KETERANGAN'],
    ...logs.value.map(l => [
      new Date(l.tanggal).toLocaleDateString('id-ID'),
      new Date(l.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      l.kodeErpRef, l.namaBarang, l.tipe, (l.blok || '-').toUpperCase(), l.qty, l.keterangan
    ])
  ]
  const ws = window.XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 25 }]
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Harian')
  window.XLSX.writeFile(wb, `Rekap_Gudang_${tglPicker.value}.xlsx`)
}

onMounted(() => loadData())
defineExpose({ loadData })
</script>

<style scoped>
.badge-ket {
  font-size: .75rem; padding: 5px 8px;
  border-radius: 6px; font-weight: 600;
  white-space: normal; text-align: left; line-height: 1.2;
}
</style>
