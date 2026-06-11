<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-success text-white">
          <h5 class="modal-title fw-bold">Barang Baru</h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <label class="small fw-bold">KODE ERP</label>
            <input type="text" class="form-control fw-bold text-uppercase"
                   v-model="form.kodeErp" @input="autoDetect"
                   placeholder="Contoh: BBO-GD30TR/A">
          </div>
          <div class="mb-2">
            <label class="small fw-bold">LOT / NAMA WARNA</label>
            <input type="text" class="form-control" v-model="form.nama">
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6">
              <input type="text" class="form-control form-control-sm"
                     v-model="form.warna" placeholder="Warna">
            </div>
            <div class="col-6">
              <input type="text" class="form-control form-control-sm text-uppercase"
                     v-model="form.jenis" placeholder="Jenis">
            </div>
            <div class="col-6">
              <input type="text" class="form-control form-control-sm"
                     v-model="form.grade" placeholder="Grade (Otomatis)">
            </div>
            <div class="col-6">
              <input type="text" class="form-control form-control-sm fw-bold bg-light"
                     v-model="form.tipe" placeholder="Tipe (Otomatis)" readonly>
            </div>
          </div>
          
          <div class="mb-2">
            <label class="small fw-bold">BLOK LOKASI</label>
            <select class="form-select border-warning fw-bold" v-model="form.lokasi">
              <option value="">-- Bebas / Tanpa Lokasi --</option>
              <option v-for="b in masterBlok" :key="b.id" :value="b.nama">
                {{ b.nama }}
              </option>
            </select>
          </div>
          
          <div class="row g-2">
            <div class="col-6">
              <label class="small fw-bold">STOK AWAL (Opsional)</label>
              <input type="number" step="any" class="form-control" v-model="form.stokAwal">
            </div>
            <div class="col-6">
              <label class="small fw-bold text-success">STOK AKTIF (SISTEM)</label>
              <input type="number" step="any" class="form-control border-success fw-bold" v-model="form.stok">
            </div>
          </div>
          <button type="button" class="btn btn-success w-100 mt-3 fw-bold shadow"
                  :disabled="saving" @click="simpan">
            {{ saving ? 'Menyimpan...' : 'SIMPAN BARANG' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ref as dbRef, push } from 'firebase/database'
import { db } from '../../firebase'
import { masterBlok } from '../../composables/useBlok'

const emit = defineEmits(['close'])
const saving = ref(false)

const form = ref({
  kodeErp: '', nama: '', warna: '', jenis: '',
  grade: '', tipe: '', lokasi: '', stokAwal: 0, stok: 0
})

const autoDetect = () => {
  const k = form.value.kodeErp.toUpperCase()
  form.value.tipe  = k.includes('BBO') ? 'OVERAN' : k.includes('BBG') ? 'DESTEX' : 'PAJITEX'
  const last = k.slice(-1)
  form.value.grade = last === 'B' ? 'B' : last === 'L' ? 'L' : 'A'
}

const simpan = async () => {
  if (!form.value.kodeErp || !form.value.nama) {
    window.Swal.fire('Peringatan', 'Kode ERP dan Nama wajib diisi.', 'warning')
    return
  }
  
  saving.value = true
  try {
    const qtyStok = Number(form.value.stok) || 0
    const blokTerpilih = form.value.lokasi ? form.value.lokasi.toUpperCase() : ''
    
    // Konversi ke format Multi-Blok baru
    let bloksObj = null
    if (blokTerpilih && qtyStok > 0) {
      bloksObj = {}
      bloksObj[blokTerpilih] = qtyStok
    }

    await push(dbRef(db, 'stok_benang'), {
      ...form.value,
      kodeErp: form.value.kodeErp.toUpperCase(),
      jenis: form.value.jenis.toUpperCase(),
      lokasi: '', // Kosongkan lokasi jadul biar gak numpuk
      bloks: bloksObj, // Simpan pakai format objek yang baru
      stokAwal: Number(form.value.stokAwal) || 0,
      stok: qtyStok,
      tglUpdate: new Date().toISOString()
    })
    
    window.Swal.fire({ icon: 'success', title: 'Tersimpan!', timer: 1500, showConfirmButton: false })
    emit('close')
  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  } finally {
    saving.value = false
  }
}
</script>
