<template>
  <nav class="navbar navbar-dark mb-2">
    <div class="container d-flex justify-content-between align-items-center">

      <!-- LOGO -->
      <a class="navbar-brand d-flex align-items-center gap-2" href="#" style="padding:0">
        <img src="https://cdn-icons-png.flaticon.com/512/17167/17167932.png"
             alt="Logo" style="height:38px">
        <div class="d-flex flex-column justify-content-center">
          <div class="fw-bold" style="font-size:1.15rem;line-height:.9;letter-spacing:-.5px">
            GUDANG <span class="text-info">WARNA</span>
          </div>
          <div style="font-size:.65rem;opacity:.8">
            {{ isAdmin ? 'Administrator' : 'Monitoring Sistem' }}
          </div>
        </div>
      </a>

      <!-- BUTTONS -->
      <div class="d-flex align-items-center gap-2">

        <!-- ADMIN ONLY -->
        <template v-if="isAdmin">
          <button class="btn btn-sm btn-success fw-bold rounded-pill px-3 shadow-sm"
                  @click="bukaAddModal">
            <i class="fas fa-plus-circle me-1"></i> Barang
          </button>
          <button class="btn btn-sm btn-warning text-dark fw-bold shadow-sm"
                  style="border-radius:8px"
                  @click="konfirmasiAudit">
            <i class="fas fa-wrench"></i>
          </button>
          <button class="btn btn-sm btn-light text-primary fw-bold shadow-sm"
                  style="border-radius:8px"
                  @click="konfirmasiAutoFix">
            <i class="fas fa-magic"></i>
          </button>
          <button class="btn btn-sm btn-success shadow-sm"
                  style="border-radius:8px"
                  @click="exportStok">
            <i class="fas fa-file-excel"></i>
          </button>
        </template>

        <!-- LAPORAN -->
        <div class="dropdown">
          <button class="btn btn-sm btn-info text-white fw-bold rounded-pill px-3 shadow-sm dropdown-toggle"
                  type="button" data-bs-toggle="dropdown">
            <i class="fas fa-folder-open me-1"></i> Laporan
          </button>
          <ul class="dropdown-menu border-0 shadow-lg" style="border-radius:12px;font-size:.9rem">
            <li><h6 class="dropdown-header fw-bold text-primary">PILIH LAPORAN</h6></li>
            <li><a class="dropdown-item fw-bold py-2" href="#" @click.prevent="bukaDaily">
              <i class="fas fa-calendar-day text-info" style="width:24px;text-align:center"></i> Rekap Harian
            </a></li>
            <li><a class="dropdown-item fw-bold py-2" href="#" @click.prevent="bukaMutasi">
              <i class="fas fa-exchange-alt text-success" style="width:24px;text-align:center"></i> Laporan Mutasi
            </a></li>
            <li><a class="dropdown-item fw-bold py-2" href="#" @click.prevent="bukaBulanan">
              <i class="fas fa-calendar-alt" style="color:#6f42c1;width:24px;text-align:center"></i> Arus Bulanan
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item fw-bold py-2" href="#" @click.prevent="bukaRekapJenis">
              <i class="fas fa-layer-group text-warning" style="width:24px;text-align:center"></i> Total Per Jenis
            </a></li>
          </ul>
        </div>

        <img v-if="user?.photoURL" :src="user.photoURL" class="user-avatar">
        <button class="btn btn-sm btn-danger rounded-circle"
                style="width:32px;height:32px;padding:0"
                @click="doLogout">
          <i class="fas fa-power-off"></i>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useAuth, user, currentRole } from '../composables/useAuth'
import { useStok, dbStok } from '../composables/useStok'
import { useDaily } from '../composables/useDaily'

const { doLogout } = useAuth()
const { refreshData } = useStok()
const { bukaDaily } = useDaily()

const isAdmin = computed(() => currentRole.value === 'admin')

// Placeholder laporan lain — akan diisi nanti
const bukaMutasi    = () => window.Swal.fire('Info', 'Segera hadir!', 'info')
const bukaBulanan   = () => window.Swal.fire('Info', 'Segera hadir!', 'info')
const bukaRekapJenis = () => window.Swal.fire('Info', 'Segera hadir!', 'info')

// Admin tools
const bukaAddModal = () => window.Swal.fire('Info', 'Segera hadir!', 'info')

const konfirmasiAudit = () => {
  window.Swal.fire({
    title: 'Audit Global?',
    html: 'Sistem akan menghitung ulang stok <b>SEMUA BARANG</b>.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e3c72'
  }).then(r => { if (r.isConfirmed) jalankanAudit() })
}

const jalankanAudit = async () => {
  window.Swal.fire({ title: 'Menghitung...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading() })
  try {
    const { ref as dbRef, get, update } = await import('firebase/database')
    const { db } = await import('../firebase')
    const [snapM, snapH] = await Promise.all([
      get(dbRef(db, 'stok_benang')),
      get(dbRef(db, 'riwayat_transaksi'))
    ])
    const masters = snapM.val() || {}, histories = snapH.val() || {}, updates = {}
    Object.keys(masters).forEach(id => {
      let run = Number(masters[id].stokAwal) || 0
      Object.values(histories[id] || {})
        .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
        .forEach(log => {
          const q = Number(log.qty)
          if (log.tipe === 'MASUK') run += q
          else if (log.tipe === 'KELUAR') run -= q
          else if (log.tipe === 'OPNAME') run = q
          run = parseFloat(run.toFixed(2))
          updates[`riwayat_transaksi/${id}/${log.trxId}/stokAkhir`] = run
        })
      updates[`stok_benang/${id}/stok`] = run
    })
    if (Object.keys(updates).length) {
      await update(dbRef(db), updates)
      window.Swal.fire('Selesai!', `Audit ${Object.keys(masters).length} barang berhasil.`, 'success')
      refreshData()
    }
  } catch(e) { window.Swal.fire('Error', e.message, 'error') }
}

const konfirmasiAutoFix = () => {
  window.Swal.fire({
    title: 'Auto-Fix Data?',
    html: 'Update <b>TIPE</b> dan <b>GRADE</b> berdasarkan Kode ERP.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#1e3c72'
  }).then(r => { if (r.isConfirmed) jalankanAutoFix() })
}

const jalankanAutoFix = async () => {
  window.Swal.fire({ title: 'Proses...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading() })
  try {
    const { ref as dbRef, get, update } = await import('firebase/database')
    const { db } = await import('../firebase')
    const snap = await get(dbRef(db, 'stok_benang'))
    const data = snap.val()
    if (!data) return
    const updates = {}
    Object.keys(data).forEach(key => {
      const k = (data[key].kodeErp || '').toUpperCase()
      const tipe = k.includes('BBO') ? 'OVERAN' : k.includes('BBG') ? 'DESTEX' : 'PAJITEX'
      const last = k.slice(-1)
      const grade = last === 'B' ? 'B' : last === 'L' ? 'L' : 'A'
      updates[`stok_benang/${key}/tipe`] = tipe
      updates[`stok_benang/${key}/grade`] = grade
    })
    await update(dbRef(db), updates)
    window.Swal.fire('Sukses!', `${Object.keys(data).length} barang diperbarui.`, 'success')
    refreshData()
  } catch(e) { window.Swal.fire('Error', e.message, 'error') }
}

const exportStok = () => {
  if (!dbStok.value.length) return
  const rows = [
    ['KODE ERP', 'LOT/NAMA', 'WARNA', 'JENIS', 'GRADE', 'TIPE', 'LOKASI', 'STOK (KG)'],
    ...dbStok.value.map(i => [i.kodeErp, i.nama, i.warna, i.jenis, i.grade, i.tipe, i.lokasi || '', i.stok])
  ]
  const ws = window.XLSX.utils.aoa_to_sheet(rows)
  const wb = window.XLSX.utils.book_new()
  window.XLSX.utils.book_append_sheet(wb, ws, 'Stok')
  window.XLSX.writeFile(wb, 'DataStok_GudangWarna.xlsx')
}
</script>

<style scoped>
.navbar {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  box-shadow: 0 4px 12px rgba(0,0,0,.15);
  padding: .8rem 0;
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  border: 2px solid #fff;
}
</style>
