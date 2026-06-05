<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-danger text-white">
          <h5 class="modal-title fw-bold">
            <i class="fas fa-file-pdf me-2"></i>Cetak Surat Jalan
          </h5>
          <button type="button" class="btn-close btn-close-white" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">

          <!-- STEP 1: Pilih Tanggal -->
          <div class="mb-3">
            <label class="small fw-bold">TANGGAL</label>
            <input type="date" class="form-control fw-bold"
                   v-model="tglPilih" @change="loadKeterangan">
          </div>

          <!-- STEP 2: Pilih Keterangan -->
          <div class="mb-3">
            <label class="small fw-bold">KETERANGAN TRANSAKSI</label>
            <select class="form-select fw-bold" v-model="ketPilih"
                    :disabled="!daftarKet.length">
              <option value="">-- Pilih Keterangan --</option>
              <option v-for="k in daftarKet" :key="k" :value="k">{{ k }}</option>
            </select>
            <div v-if="loadingKet" class="small text-muted mt-1">
              <i class="fas fa-spinner fa-spin me-1"></i>Memuat...
            </div>
            <div v-else-if="!daftarKet.length && tglPilih" class="small text-danger mt-1">
              Tidak ada transaksi KELUAR pada tanggal ini.
            </div>
          </div>

          <!-- STEP 3: Tujuan -->
          <div class="mb-3">
            <label class="small fw-bold">TUJUAN PENGIRIMAN</label>
            <input type="text" class="form-control text-uppercase fw-bold"
                   v-model="tujuan" placeholder="Ketik tujuan...">
          </div>

          <button class="btn btn-danger fw-bold w-100 shadow"
                  :disabled="!ketPilih || !tujuan || generating"
                  @click="generatePDF">
            <i class="fas fa-file-pdf me-2"></i>
            {{ generating ? 'Membuat PDF...' : 'CETAK SURAT JALAN' }}
          </button>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ref as dbRef, get } from 'firebase/database'
import { db } from '../../firebase'
import { dbStok } from '../../composables/useStok'

const emit = defineEmits(['close'])

const tglPilih    = ref(new Date().toISOString().slice(0, 10))
const ketPilih    = ref('')
const tujuan      = ref('')
const daftarKet   = ref([])
const loadingKet  = ref(false)
const generating  = ref(false)

const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu']
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

const loadKeterangan = async () => {
  if (!tglPilih.value) return
  loadingKet.value = true
  daftarKet.value  = []
  ketPilih.value   = ''
  try {
    const snap = await get(dbRef(db, 'riwayat_transaksi'))
    const all  = snap.val() || {}
    const set  = new Set()
    Object.values(all).forEach(trxs => {
      Object.values(trxs || {}).forEach(trx => {
        if (trx.tipe === 'KELUAR' && trx.tanggal?.startsWith(tglPilih.value)) {
          set.add((trx.keterangan || 'LAIN-LAIN').toUpperCase())
        }
      })
    })
    daftarKet.value = [...set].sort()
  } finally {
    loadingKet.value = false
  }
}

const generatePDF = async () => {
  generating.value = true
  try {
    const snap = await get(dbRef(db, 'riwayat_transaksi'))
    const all  = snap.val() || {}
    const raw  = []

    Object.keys(all).forEach(pId => {
      Object.values(all[pId] || {}).forEach(trx => {
        if (
          trx.tipe === 'KELUAR' &&
          trx.tanggal?.startsWith(tglPilih.value) &&
          (trx.keterangan || 'LAIN-LAIN').toUpperCase() === ketPilih.value
        ) {
          const m = dbStok.value.find(x => x.idUnik === pId)
          raw.push({
            kode: m?.kodeErp || trx.kodeErp || '-',
            nama: m?.nama || '-',
            warna: m?.warna || '-',
            qty: parseFloat(trx.qty) || 0
          })
        }
      })
    })

    if (!raw.length) {
      window.Swal.fire('Kosong', 'Tidak ada data untuk dicetak.', 'info')
      return
    }

    raw.sort((a, b) => a.kode.localeCompare(b.kode))

    // Generate PDF
    const dObj   = new Date(tglPilih.value)
    const dd     = String(dObj.getDate()).padStart(2, '0')
    const mm     = String(dObj.getMonth() + 1).padStart(2, '0')
    const yyyy   = dObj.getFullYear()
    const rand   = String.fromCharCode(65 + Math.floor(Math.random() * 26))
    const noSurat = `SJ-CWH${dd}${mm}${yyyy}${rand}`
    const strTgl  = `${DAYS[dObj.getDay()]}, ${dd} ${MONTHS[dObj.getMonth()]} ${yyyy}`

    const { jsPDF } = window.jspdf
    const doc = new jsPDF({ format: [210, 330] })

    // Header
    doc.setFontSize(16).setFont('helvetica', 'bold')
    doc.text('GUDANG WARNA - SURAT JALAN', 14, 18)
    doc.setFontSize(10).setFont('helvetica', 'normal')
    doc.text(`No. Surat  : ${noSurat}`, 14, 26)
    doc.text(`Tanggal    : ${strTgl}`, 14, 31)
    doc.text(`Tujuan     : ${tujuan.value.toUpperCase()}`, 14, 36)
    doc.text(`Keterangan : ${ketPilih.value}`, 14, 41)
    doc.setLineWidth(0.5).line(14, 44, 196, 44)

    // TTD
    const yTTD = 290
    ;['Mengetahui,', 'Pengirim,', 'Penerima,'].forEach((lbl, i) =>
      doc.text(lbl, [30, 95, 160][i], yTTD)
    )
    ;['(..................)', '(..................)', '(..................)'].forEach((lbl, i) =>
      doc.text(lbl, [25, 90, 155][i], yTTD + 20)
    )

    // Table
    let totalQty = 0
    const body = raw.map((item, idx) => {
      totalQty += item.qty
      return [idx + 1, item.kode, item.nama, item.warna, Number(item.qty).toLocaleString('id-ID', { minimumFractionDigits: 2 })]
    })
    body.push(['', '', '', 'TOTAL BERAT', Number(totalQty).toLocaleString('id-ID', { minimumFractionDigits: 2 })])

    const n = body.length
    const fontSize = n > 50 ? 6 : n > 40 ? 7 : n > 30 ? 8 : 9
    const padding  = n > 50 ? 0.5 : n > 40 ? 0.8 : n > 30 ? 1 : 2.5

    doc.autoTable({
      startY: 48,
      head: [['No', 'Kode ERP', 'Nama Barang / Lot', 'Warna', 'Qty (Kg)']],
      body,
      theme: 'grid',
      headStyles: { fillColor: [255,255,255], textColor: [0,0,0], lineColor: [0,0,0], lineWidth: 0.1, halign: 'center', cellPadding: padding + 0.5 },
      styles: { fontSize, cellPadding: padding, textColor: [0,0,0], lineColor: [0,0,0], lineWidth: 0.1 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { halign: 'center' },
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { bottom: 50 }
    })

    doc.save(`${noSurat}_${ketPilih.value}.pdf`)
    window.Swal.fire({ icon: 'success', title: 'PDF Diunduh!', timer: 1500, showConfirmButton: false })
    emit('close')

  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  } finally {
    generating.value = false
  }
}

// Load keterangan saat mount
loadKeterangan()
</script>
