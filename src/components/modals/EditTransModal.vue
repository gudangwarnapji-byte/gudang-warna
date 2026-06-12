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
                    :disabled="saving" @click="simpan">
              <i class="fas fa-save me-1"></i> {{ saving ? 'Menyimpan...' : 'UPDATE TRANSAKSI' }}
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm fw-bold"
                    :disabled="saving" @click="hapus">
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
import { ref as dbRef, update, remove } from 'firebase/database'
import { db } from '../../firebase'
import { activeEditTrans } from '../../composables/useEditTrans'
import { masterBlok } from '../../composables/useBlok'
// IMPORT JALANKAN AUDIT DARI USESTOK!
import { useStok } from '../../composables/useStok' 

const emit = defineEmits(['close', 'saved'])
const { jalankanAudit } = useStok() // TARIK FUNGSI PINTERNYA KE SINI

const tanggal    = ref('')
const tipe       = ref('')
const qty        = ref(0)
const blok       = ref('')
const keterangan = ref('')
const saving     = ref(false)

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
    
    // PANGGIL AUDIT PINTER DARI USESTOK.JS
    await jalankanAudit() 
    
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
    
    // PANGGIL AUDIT PINTER DARI USESTOK.JS
    await jalankanAudit()
    
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
</script>
