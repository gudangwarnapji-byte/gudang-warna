<template>
  <nav class="navbar modern-navbar sticky-top mx-2 mt-2 px-3 py-2">
    <div class="container-fluid d-flex flex-nowrap align-items-center justify-content-between" style="gap: 15px;">

      <a class="navbar-brand d-flex align-items-center gap-2 m-0 flex-shrink-0" href="#" style="padding:0;">
        <div class="logo-box">
          <img src="https://cdn-icons-png.flaticon.com/512/17167/17167932.png" alt="Logo">
        </div>
        <div class="d-flex flex-column justify-content-center">
          <div class="brand-title">GUDANG <span class="brand-accent">WARNA</span></div>
          <div class="brand-subtitle">{{ isAdmin ? 'Administrator Panel' : 'Monitoring Sistem' }}</div>
        </div>
      </a>

      <div class="d-flex align-items-center gap-2 overflow-x-auto flex-nowrap py-1 swipe-menu w-100 justify-content-md-end">

        <template v-if="isAdmin">
          <button class="btn btn-action-nav btn-add flex-shrink-0" @click="bukaAddModal">
            <i class="fas fa-plus-circle me-1"></i> Barang
          </button>
          
          <div class="divider-vertical"></div>

          <button class="btn btn-icon-nav flex-shrink-0" @click="bukaBatch" title="Input Massal Excel">
            <i class="fas fa-paste text-primary"></i>
          </button>
          <button class="btn btn-icon-nav flex-shrink-0" @click="konfirmasiAudit" title="Audit Ulang Total Stok">
            <i class="fas fa-wrench text-warning"></i>
          </button>
          <button class="btn btn-icon-nav flex-shrink-0" @click="konfirmasiAutoFix" title="Auto-Fix Kategori">
            <i class="fas fa-magic text-info"></i>
          </button>
          <button class="btn btn-icon-nav flex-shrink-0" @click="exportStok" title="Export Master Stok">
            <i class="fas fa-file-excel text-success"></i>
          </button>
          <button class="btn btn-icon-nav flex-shrink-0" @click="bukaSelisih" title="Cek Selisih vs ERP">
            <i class="fas fa-balance-scale text-primary"></i>
          </button>
        </template>

        <div class="divider-vertical"></div>

        <button class="btn btn-action-nav btn-report flex-shrink-0" @click="showLaporan = true">
          <i class="fas fa-folder-open me-1 text-info"></i> Laporan
        </button>

        <button class="btn btn-icon-nav theme-toggle-btn flex-shrink-0 ms-1" @click="toggleTheme" title="Ganti Tema">
          <i :class="isDarkMode ? 'fas fa-sun text-warning' : 'fas fa-moon text-primary'"></i>
        </button>

        <img v-if="user?.photoURL" :src="user.photoURL" class="user-avatar flex-shrink-0 ms-1">
        <button class="btn btn-logout flex-shrink-0" @click="doLogout" title="Logout">
          <i class="fas fa-power-off"></i>
        </button>
      </div>

    </div>

    <div v-if="showLaporan">
      <div class="position-fixed top-0 start-0 w-100 h-100 backdrop-blur" @click="showLaporan = false"></div>
      
      <div class="modern-dropdown show">
        <div class="dropdown-header-custom">Menu Laporan</div>
        <div class="dropdown-body">
          <a class="dropdown-item-custom" href="#" @click.prevent="bukaLaporan(bukaDaily)">
            <div class="icon-box bg-info-subtle text-info"><i class="fas fa-calendar-day"></i></div>
            <div class="item-text">Rekap Harian</div>
          </a>
          <a class="dropdown-item-custom" href="#" @click.prevent="bukaLaporan(bukaMutasi)">
            <div class="icon-box bg-success-subtle text-success"><i class="fas fa-exchange-alt"></i></div>
            <div class="item-text">Laporan Mutasi</div>
          </a>
          <a class="dropdown-item-custom" href="#" @click.prevent="bukaLaporan(bukaBulanan)">
            <div class="icon-box bg-primary-subtle text-primary"><i class="fas fa-calendar-alt"></i></div>
            <div class="item-text">Arus Bulanan</div>
          </a>
          <div class="dropdown-divider-custom"></div>
          <a class="dropdown-item-custom" href="#" @click.prevent="bukaLaporan(bukaSuratJalan)">
            <div class="icon-box bg-danger-subtle text-danger"><i class="fas fa-file-pdf"></i></div>
            <div class="item-text">Surat Jalan PDF</div>
          </a>
          <div class="dropdown-divider-custom"></div>
          <a class="dropdown-item-custom" href="#" @click.prevent="bukaLaporan(bukaBlok)">
            <div class="icon-box bg-warning-subtle text-warning"><i class="fas fa-th-large"></i></div>
            <div class="item-text">Peta Blok Visual</div>
          </a>
        </div>
      </div>
    </div>

  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'
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
import { useTheme } from '../composables/useTheme'

const { doLogout }     = useAuth()
const { refreshData, jalankanAudit } = useStok() 
const { bukaDaily }    = useDaily()
const { bukaMutasi }   = useMutasi()
const { bukaBulanan }  = useBulanan()
const { bukaAddModal } = useAdd()
const { bukaBatch }    = useBatch()
const { bukaSelisih }  = useSelisih()
const { bukaSuratJalan } = useSuratJalan()
const { bukaBlok }     = useBlok()

const { isDarkMode, toggleTheme } = useTheme()

const isAdmin = computed(() => currentRole.value === 'admin')
const showLaporan = ref(false)

const bukaLaporan = (fungsiBuka) => {
  showLaporan.value = false 
  fungsiBuka() 
}

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
    html: 'Sistem akan menghitung ulang stok <b>SEMUA BARANG</b> dari nol.',
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#4f46e5'
  }).then(async r => { 
    if (r.isConfirmed) {
      window.Swal.fire({ title: 'Menghitung Ulang...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading() })
      await jalankanAudit() 
      window.Swal.fire('Selesai!', 'Audit berhasil. Data sudah bersih.', 'success')
      refreshData()
    } 
  })
}

const konfirmasiAutoFix = () => {
  window.Swal.fire({
    title: 'Auto-Fix Data?',
    html: 'Update <b>TIPE</b> dan <b>GRADE</b> berdasarkan Kode ERP.',
    icon: 'warning', showCancelButton: true, confirmButtonColor: '#4f46e5'
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
.modern-navbar {
  background: var(--nav-bg) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: var(--glass-shadow);
  border: 1px solid var(--nav-border);
  z-index: 1020;
  transition: all 0.3s ease;
}

.logo-box {
  width: 40px; height: 40px;
  background: var(--bg-main);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
}
.logo-box img { height: 26px; }
.brand-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem; font-weight: 800; color: var(--text-main); line-height: 1; letter-spacing: -0.5px;
}
.brand-accent { color: #4f46e5; }
.brand-subtitle {
  font-size: 0.65rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
}

.btn-action-nav {
  padding: 8px 16px; border-radius: 10px; font-weight: 600; font-size: 0.85rem; border: none; transition: all 0.2s;
}
.btn-add { background: #4f46e5; color: #fff; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2); }
.btn-add:hover { background: #4338ca; transform: translateY(-1px); }

.btn-report { background: var(--bg-main); color: var(--text-main); border: 1px solid var(--border-color); }
.btn-report:hover { background: var(--border-color); }

.btn-icon-nav {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid transparent;
  background: var(--bg-main); display: flex; align-items: center; justify-content: center;
  transition: all 0.2s; font-size: 0.9rem; padding: 0; color: var(--text-main);
}
.btn-icon-nav:hover { background: var(--bg-card); border-color: var(--border-color); box-shadow: 0 2px 5px rgba(0,0,0,0.05); transform: translateY(-1px); }

.theme-toggle-btn { background: var(--bg-main); border: 1px solid var(--border-color); }

.btn-logout {
  width: 36px; height: 36px; border-radius: 10px; border: none;
  background: #fef2f2; color: #dc2626; display: flex; align-items: center; justify-content: center; transition: all 0.2s;
}
.btn-logout:hover { background: #fee2e2; }

.divider-vertical { width: 1px; height: 24px; background-color: var(--border-color); margin: 0 4px; }
.user-avatar { width: 36px; height: 36px; border-radius: 10px; object-fit: cover; border: 2px solid var(--border-color); }

.swipe-menu { -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.swipe-menu::-webkit-scrollbar { display: none; }

.backdrop-blur { background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(2px); z-index: 1040; }
.modern-dropdown {
  position: fixed; top: 70px; right: 20px; z-index: 1050; width: 260px;
  background: var(--bg-card); border-radius: 16px; padding: 8px;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.2), 0 8px 10px -6px rgba(0,0,0,0.1);
  border: 1px solid var(--border-color); animation: slideDown 0.2s ease-out;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.dropdown-header-custom {
  font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;
  letter-spacing: 0.5px; padding: 10px 12px;
}
.dropdown-item-custom {
  display: flex; align-items: center; padding: 10px 12px; gap: 12px;
  border-radius: 10px; text-decoration: none; color: var(--text-main); transition: all 0.2s;
}
.dropdown-item-custom:hover { background: var(--bg-main); }
.icon-box {
  width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
}
.item-text { font-weight: 600; font-size: 0.9rem; }
.dropdown-divider-custom { height: 1px; background: var(--border-color); margin: 6px 12px; }

.bg-info-subtle { background-color: rgba(2, 132, 199, 0.1); }
.text-info { color: #38bdf8 !important; }
.bg-success-subtle { background-color: rgba(5, 150, 105, 0.1); }
.text-success { color: #34d399 !important; }
.bg-primary-subtle { background-color: rgba(79, 70, 229, 0.1); }
.text-primary { color: #818cf8 !important; }
.bg-danger-subtle { background-color: rgba(220, 38, 38, 0.1); }
.text-danger { color: #f87171 !important; }
.bg-warning-subtle { background-color: rgba(217, 119, 6, 0.1); }
.text-warning { color: #fbbf24 !important; }
</style>
