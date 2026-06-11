<template>
  <nav class="navbar navbar-dark mb-2">
    <div class="container d-flex flex-nowrap align-items-center" style="gap: 15px;">

      <a class="navbar-brand d-flex align-items-center gap-2 m-0 flex-shrink-0" href="#" style="padding:0;">
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

      <div class="d-flex align-items-center gap-2 overflow-x-auto flex-nowrap py-1 swipe-menu w-100 justify-content-md-end">

        <template v-if="isAdmin">
          <button class="btn btn-sm btn-success fw-bold rounded-pill px-3 shadow-sm flex-shrink-0"
                  @click="bukaAddModal">
            <i class="fas fa-plus-circle me-1"></i> Barang
          </button>
          <button class="btn btn-sm btn-primary fw-bold shadow-sm flex-shrink-0"
                  style="border-radius:8px" @click="bukaBatch" title="Input Massal Excel">
            <i class="fas fa-paste"></i>
          </button>
          <button class="btn btn-sm btn-warning text-dark fw-bold shadow-sm flex-shrink-0"
                  style="border-radius:8px" @click="konfirmasiAudit" title="Audit Ulang Total Stok">
            <i class="fas fa-wrench"></i>
          </button>
          <button class="btn btn-sm btn-light text-primary fw-bold shadow-sm flex-shrink-0"
                  style="border-radius:8px" @click="konfirmasiAutoFix" title="Auto-Fix Kategori">
            <i class="fas fa-magic"></i>
          </button>
          <button class="btn btn-sm btn-success shadow-sm flex-shrink-0"
                  style="border-radius:8px" @click="exportStok" title="Export Master Stok">
            <i class="fas fa-file-excel"></i>
          </button>
          <button class="btn btn-sm btn-dark fw-bold shadow-sm flex-shrink-0"
                  style="border-radius:8px" @click="bukaSelisih"
                  title="Cek Selisih vs ERP">
            <i class="fas fa-balance-scale"></i>
          </button>
        </template>

        <div class="dropdown flex-shrink-0">
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
            <li><a class="dropdown-item fw-bold py-2" href="#" @click.prevent="bukaSuratJalan">
              <i class="fas fa-file-pdf text-danger" style="width:24px;text-align:center"></i> Surat Jalan PDF
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item fw-bold py-2" href="#" @click.prevent="bukaBlok">
              <i class="fas fa-th-large text-primary" style="width:24px;text-align:center"></i> Peta Blok
            </a></li>
          </ul>
        </div>

        <img v-if="user?.photoURL" :src="user.photoURL" class="user-avatar flex-shrink-0 ms-1">
        <button class="btn btn-sm btn-danger rounded-circle flex-shrink-0"
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
import { ref as dbRef, get, update } from 'firebase/database'
import { db } from '../firebase'
import { useAuth, user, currentRole } from '../composables/useAuth'
import { useStok, dbStok } from '../composables/useStok'
import { useDaily } from '../composables/useDaily'
import { useMutasi } from '../composables/useMutasi'
import { useBulanan } from '../composables/useBulanan'
import { useAdd } from '../composables/useAdd'
import { useBatch } from '../composables/useBatch'
import { useSelisih } from '../composables/useSelisih'
import { useSuratJalan } from '../composables/useSuratJalan'
import { useBlok } from '../composables/useBlok'

const { doLogout }     = useAuth()
const { refreshData }  = useStok()
const { bukaDaily }    = useDaily()
const { bukaMutasi }   = useMutasi()
const { bukaBulanan }  = useBulanan()
const { bukaAddModal } = useAdd()
const { bukaBatch }    = useBatch()
const { bukaSelisih }  = useSelisih()
const { bukaSuratJalan } = useSuratJalan()
const { bukaBlok }     = useBlok()

const isAdmin = computed(() => currentRole.value === 'admin')

const getTipeGrade = kode => {
  const k    = (kode || '').toUpperCase()
  const tipe = k.includes('BBO') ? 'OVERAN' : k.includes('BBG') ? 'DESTEX' : 'PAJITEX'
  const last = k.slice(-1)
  const grade = last === 'B' ? 'B' : last === 'L' ? 'L' : 'A'
  return { tipe, grade }
}

const konfirmasiAudit = () => {
  window.Swal.fire({
    title: 'Audit Global?',
    html: 'Sistem akan menghitung ulang stok <b>SEMUA BARANG</b>.',
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#1e3c72'
  }).then(r => { if (r.isConfirmed) jalankanAudit() })
}

const jalankanAudit = async () => {
  window.Swal.fire({ title: 'Menghitung...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading() })
  try {
    const [snapM, snapH] = await Promise.all([
      get(dbRef(db, 'stok_benang')),
      get(dbRef(db, 'riwayat_transaksi'))
    ])
    const masters   = snapM.val() || {}
    const histories = snapH.val() || {}
    const updates   = {}

    Object.keys(masters).forEach(id => {
      let run = Number(masters[id].stokAwal) || 0

      // Kumpulkan pergerakan per blok
      const blokChanges = {}

      Object.values(histories[id] || {})
        .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
        .forEach(log => {
          const q    = Number(log.qty)
          const blok = log.blok || ''

          if (log.tipe === 'MASUK') {
            run += q
            if (blok) blokChanges[blok] = parseFloat(((blokChanges[blok] || 0) + q).toFixed(2))
          } else if (log.tipe === 'KELUAR') {
            run -= q
            if (blok) blokChanges[blok] = parseFloat(((blokChanges[blok] || 0) - q).toFixed(2))
          } else if (log.tipe === 'OPNAME') {
            run = q
            if (blok) blokChanges[blok] = q
          }

          run = parseFloat(run.toFixed(2))
          updates[`riwayat_transaksi/${id}/${log.trxId}/stokAkhir`] = run
        })

      updates[`stok_benang/${id}/stok`] = run

      // Update bloks — gabungkan dengan bloks yang sudah ada
      const bloksLama = masters[id].bloks || {}
      const bloksBaru = { ...bloksLama }

      Object.keys(blokChanges).forEach(blok => {
        bloksBaru[blok] = parseFloat(((bloksBaru[blok] || 0) + blokChanges[blok]).toFixed(2))
        if (bloksBaru[blok] <= 0) delete bloksBaru[blok]
      })

      updates[`stok_benang/${id}/bloks`] = bloksBaru
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
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#1e3c72'
  }).then(r => { if (r.isConfirmed) jalankanAutoFix() })
}

const jalankanAutoFix = async () => {
  window.Swal.fire({ title: 'Proses...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading() })
  try {
    const snap = await get(dbRef(db, 'stok_benang'))
    const data = snap.val()
    if (!data) return
    const updates = {}
    Object.keys(data).forEach(key => {
      const { tipe, grade } = getTipeGrade(data[key].kodeErp)
      updates[`stok_benang/${key}/tipe`]  = tipe
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

/* CSS Khusus Swipeable Menu HP */
.swipe-menu {
  -webkit-overflow-scrolling: touch; /* Biar scroll smooth di iPhone */
  scrollbar-width: none; /* Sembunyikan scrollbar di Firefox */
}
.swipe-menu::-webkit-scrollbar {
  display: none; /* Sembunyikan scrollbar di Chrome/Safari */
}
</style>
