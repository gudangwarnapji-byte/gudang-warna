<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-warning text-dark">
          <h5 class="modal-title fw-bold">Revisi Transaksi</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <label class="small fw-bold">Waktu Transaksi</label>
            <input type="datetime-local" class="form-control fw-bold" v-model="tanggal">
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="small fw-bold">Tipe</label>
              <select class="form-select fw-bold" v-model="tipe">
                <option value="MASUK">MASUK</option>
                <option value="KELUAR">KELUAR</option>
                <option value="OPNAME">OPNAME</option>
              </select>
            </div>
            <div class="col-6">
              <label class="small fw-bold">Qty (Kg)</label>
              <input type="number" step="any" class="form-control fw-bold" v-model="qty">
            </div>
          </div>
          <div class="mb-2">
            <label class="small fw-bold">Blok Lokasi</label>
            <select class="form-select fw-bold" v-model="blok">
              <option value="">-- Tidak ada / Bebas --</option>
              <option v-if="blok && !masterBlok.find(b => b.nama === blok)" :value="blok">
                {{ blok }} (Lokasi Asli)
              </option>
              <option v-for="b in masterBlok" :key="b.id" :value="b.nama">
                {{ b.nama }}
              </option>
            </select>
          </div>
          <div class="mb-3">
            <label class="small fw-bold">Keterangan Tambahan</label>
            <input type="text" class="form-control text-uppercase" v-model="keterangan">
          </div>
          <div class="d-grid gap-2 mt-4">
            <button type="button" class="btn btn-warning fw-bold text-dark shadow-sm"
                    :disabled="saving || isAuditing" @click="simpan">
              <i class="fas fa-save me-1"></i> {{ saving ? 'Menyimpan...' : 'UPDATE TRANSAKSI' }}
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm fw-bold"
                    :disabled="saving || isAuditing" @click="hapus">
              <i class="fas fa-trash-alt me-1"></i> HAPUS TRANSAKSI
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ref as dbRef, update, remove, get } from 'firebase/database'
import { db } from '../../firebase'
import { activeEditTrans } from '../../composables/useEditTrans'
import { masterBlok } from '../../composables/useBlok'

const emit = defineEmits(['close', 'saved'])
const tanggal    = ref('')
const tipe       = ref('')
const qty        = ref(0)
const blok       = ref('')
const keterangan = ref('')
const saving     = ref(false)
const isAuditing = ref(false) // KUNCI PENGAMAN

onMounted(() => {
  const trx = activeEditTrans.value
  if (!trx) return
  const d = new Date(trx.tanggal)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  tanggal.value    = d.toISOString().slice(0, 16)
  tipe.value       = trx.tipe
  qty.value        = trx.qty
  blok.value       = trx.blok || ''
  keterangan.value = trx.keterangan || ''
})

const simpan = async () => {
  const trx = activeEditTrans.value
  if (!trx) return
  saving.value = true
  try {
    const path = `riwayat_transaksi/${trx.parentId}/${trx.trxId}`
    await update(dbRef(db, path), {
      tanggal:    new Date(tanggal.value).toISOString(),
      tipe:       tipe.value,
      qty:        parseFloat(qty.value) || 0,
      blok:       blok.value,
      keterangan: keterangan.value.toUpperCase()
    })
    
    await jalankanAuditSatu(trx.parentId)
    
    window.Swal.fire({
      icon: 'success', title: 'Tersimpan!',
      text: 'Transaksi direvisi & stok diaudit.',
      timer: 1500, showConfirmButton: false
    })
    emit('saved')
    emit('close')
  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  } finally {
    saving.value = false
  }
}

const hapus = async () => {
  const trx = activeEditTrans.value
  if (!trx) return
  const result = await window.Swal.fire({
    title: 'Hapus Transaksi?',
    text: 'Data dihapus permanen dan stok akan dihitung ulang.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Ya, Hapus!'
  })
  if (!result.isConfirmed) return
  
  saving.value = true
  try {
    await remove(dbRef(db, `riwayat_transaksi/${trx.parentId}/${trx.trxId}`))
    await jalankanAuditSatu(trx.parentId)
    
    window.Swal.fire({
      icon: 'success', title: 'Dihapus!',
      text: 'Transaksi dihapus & stok diaudit.',
      timer: 1500, showConfirmButton: false
    })
    emit('saved')
    emit('close')
  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  } finally {
    saving.value = false
  }
}

const jalankanAuditSatu = async (parentId) => {
  if (isAuditing.value) return
  isAuditing.value = true
  
  try {
    const [snapM, snapH] = await Promise.all([
      get(dbRef(db, `stok_benang/${parentId}`)),
      get(dbRef(db, `riwayat_transaksi/${parentId}`))
    ])
    
    const master = snapM.val()
    if (!master) return
    
    let run = Number(master.stokAwal) || 0
    const bloksAudit = {}
    const logs = snapH.val()
    const updates = {}
    
    if (logs) {
      Object.values(logs)
        .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
        .forEach(l => {
          const q = Number(l.qty) || 0
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
              run += (q - stokBlokLama)
              bloksAudit[blokNama] = q
            } else {
              run = q
              for (let key in bloksAudit) delete bloksAudit[key]
            }
          }
          run = parseFloat(run.toFixed(2))
          updates[`riwayat_transaksi/${parentId}/${l.trxId}/stokAkhir`] = run
        })
    }

    Object.keys(bloksAudit).forEach(b => {
      bloksAudit[b] = parseFloat(bloksAudit[b].toFixed(2))
      if (bloksAudit[b] <= 0) delete bloksAudit[b]
    })

    updates[`stok_benang/${parentId}/stok`] = run
    updates[`stok_benang/${parentId}/bloks`] = Object.keys(bloksAudit).length ? bloksAudit : null
    
    await update(dbRef(db), updates)
  } finally {
    isAuditing.value = false
  }
}
</script>
