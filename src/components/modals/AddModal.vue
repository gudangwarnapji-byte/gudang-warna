<template>
  <div class="modal fade show d-block backdrop-blur" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content modern-modal border-0 shadow-lg">
        
        <div class="modal-header border-0 pb-3">
          <h5 class="fw-bold m-0 d-flex align-items-center gap-2" style="color:var(--text-main)">
            <div class="icon-circle bg-success-subtle text-success"><i class="fas fa-plus-circle"></i></div>
            Barang Baru
          </h5>
          <button type="button" class="btn-close btn-close-custom" @click="$emit('close')"></button>
        </div>

        <div class="modal-body p-4 pt-0">
          <div class="mb-3">
            <label class="form-label">KODE ERP</label>
            <input type="text" class="form-control custom-input fw-bold text-uppercase"
                   v-model="form.kodeErp" @input="autoDetect"
                   placeholder="Contoh: BBO-GD30TR/A">
          </div>
          
          <div class="mb-3">
            <label class="form-label">LOT / NAMA BARANG</label>
            <input type="text" class="form-control custom-input" v-model="form.nama">
          </div>

          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label">Warna</label>
              <input type="text" class="form-control custom-input" v-model="form.warna">
            </div>
            <div class="col-6">
              <label class="form-label">Jenis</label>
              <input type="text" class="form-control custom-input text-uppercase" v-model="form.jenis">
            </div>
            <div class="col-6">
              <label class="form-label">Grade</label>
              <input type="text" class="form-control custom-input bg-main-dim" v-model="form.grade" readonly>
            </div>
            <div class="col-6">
              <label class="form-label">Tipe</label>
              <input type="text" class="form-control custom-input bg-main-dim" v-model="form.tipe" readonly>
            </div>
          </div>
          
          <div class="mb-3">
            <label class="form-label">BLOK LOKASI</label>
            <select class="form-select custom-input fw-bold border-warning" v-model="form.lokasi">
              <option value="">-- Tanpa Lokasi --</option>
              <option v-for="b in masterBlok" :key="b.id" :value="b.nama">{{ b.nama }}</option>
            </select>
          </div>
          
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label">STOK AWAL</label>
              <input type="number" step="any" class="form-control custom-input" v-model="form.stokAwal">
            </div>
            <div class="col-6">
              <label class="form-label text-success">STOK AKTIF</label>
              <input type="number" step="any" class="form-control custom-input border-success fw-bold" v-model="form.stok">
            </div>
          </div>

          <button type="button" class="btn btn-lg w-100 mt-4 fw-bold shadow-sm submit-btn btn-in-submit"
                  :disabled="saving" @click="simpan">
            <i v-if="saving" class="fas fa-circle-notch fa-spin me-2"></i>
            <i v-else class="fas fa-save me-2"></i>
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
    
    let bloksObj = null
    if (blokTerpilih && qtyStok > 0) {
      bloksObj = {}
      bloksObj[blokTerpilih] = qtyStok
    }

    await push(dbRef(db, 'stok_benang'), {
      ...form.value,
      kodeErp: form.value.kodeErp.toUpperCase(),
      jenis: form.value.jenis.toUpperCase(),
      lokasi: '', 
      bloks: bloksObj,
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

<style scoped>
.modern-modal { border-radius: 24px; background: var(--bg-card); }
.backdrop-blur { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); }
.icon-circle { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
.bg-success-subtle { background: rgba(16, 185, 129, 0.1); }
.text-success { color: #10b981 !important; }

.custom-input {
  background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-main);
  padding: 10px 14px; border-radius: 10px;
}
.custom-input:focus { background: var(--bg-card); border-color: #818cf8; outline: none; }
.bg-main-dim { background: var(--border-color) !important; opacity: 0.7; }

.btn-close-custom { opacity: 0.5; }
.submit-btn { border-radius: 14px; padding: 14px; color: #fff; border: none; }
.btn-in-submit { background: linear-gradient(135deg, #10b981, #059669); }
</style>
