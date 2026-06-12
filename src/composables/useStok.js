import { ref } from 'vue'
import { ref as dbRef, onValue, update, get } from 'firebase/database'
import { db } from '../firebase'

export const dbStok = ref([])
export const itemVelocity = ref({})
export const loading = ref(false)

let isListening = false 
let isAuditing = false 

export function useStok() {
  const refreshData = () => {
    if (isListening) return
    isListening = true
    
    loading.value = true
    onValue(dbRef(db, 'stok_benang'), snap => {
      const data = snap.val()
      const arr = []
      if (data) {
        Object.keys(data).forEach(k => {
          if (data[k]) arr.push({ ...data[k], idUnik: k })
        })
        arr.sort((a, b) => (b.stok || 0) - (a.stok || 0))
      }
      dbStok.value = arr
      loading.value = false
    })
  }

  // === ENGINE AUDIT DEEP RESET ===
  const jalankanAudit = async () => {
    if (isAuditing) return
    isAuditing = true
    
    try {
      const [snapM, snapH] = await Promise.all([
        get(dbRef(db, 'stok_benang')),
        get(dbRef(db, 'riwayat_transaksi'))
      ])
      
      const masters = snapM.val() || {}
      const histories = snapH.val() || {}
      const updates = {}

      Object.keys(masters).forEach(parentId => {
        let totalStok = Number(masters[parentId].stokAwal) || 0
        
        const logs = histories[parentId] ? Object.values(histories[parentId]) : []
        logs.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))

        const bloksTemp = {}

        logs.forEach(l => {
          const q = Number(l.qty) || 0
          
          // AMBIL NAMA BLOK, JADIKAN UPPERCASE DULU BIAR SERAGAM
          let lokasi = (l.blok && l.blok.trim() !== "") ? l.blok.trim().toUpperCase() : "Tanpa Lokasi"
          
          // INTERCEPT: KALAU HASILNYA "TANPA LOKASI" (huruf besar), KITA UBAH JADI "Tanpa Lokasi" (Title Case)
          if (lokasi === "TANPA LOKASI") {
            lokasi = "Tanpa Lokasi"
          }

          if (l.tipe === 'MASUK') {
            totalStok += q
            bloksTemp[lokasi] = (bloksTemp[lokasi] || 0) + q
          } 
          else if (l.tipe === 'KELUAR') {
            totalStok -= q
            bloksTemp[lokasi] = (bloksTemp[lokasi] || 0) - q
          } 
          else if (l.tipe === 'OPNAME') {
            const stokBlokLama = parseFloat(bloksTemp[lokasi] || 0)
            const selisih = q - stokBlokLama
            totalStok += selisih
            bloksTemp[lokasi] = q
          }
          
          updates[`riwayat_transaksi/${parentId}/${l.trxId}/stokAkhir`] = parseFloat(totalStok.toFixed(2))
        })

        Object.keys(bloksTemp).forEach(b => {
          if (bloksTemp[b] <= 0.001) {
            delete bloksTemp[b]
          } else {
            bloksTemp[b] = parseFloat(bloksTemp[b].toFixed(2))
          }
        })

        updates[`stok_benang/${parentId}/stok`] = parseFloat(totalStok.toFixed(2))
        updates[`stok_benang/${parentId}/bloks`] = Object.keys(bloksTemp).length > 0 ? bloksTemp : null
      })

      await update(dbRef(db), updates)
      console.log("Audit Deep Reset Selesai. Penggabungan 'Tanpa Lokasi' Berhasil.")
    } catch (e) {
      console.error("Audit Gagal:", e)
    } finally {
      isAuditing = false
    }
  }

  const kirimTransaksi = async (idUnik, tipe, qty, ket, lokasiBaru) => {
    const item = dbStok.value.find(x => x.idUnik === idUnik)
    if (!item) return
    
    const sLama = Number(item.stok) || 0
    let sBaru = tipe === 'MASUK' ? sLama + qty : tipe === 'KELUAR' ? sLama - qty : qty
    sBaru = parseFloat(sBaru.toFixed(2))

    const bloks = { ...(item.bloks || {}) }
    
    // FORMAT LOKASI TRANSAKSI BARU
    let blokNama = (lokasiBaru && lokasiBaru.trim() !== "") ? lokasiBaru.trim().toUpperCase() : "Tanpa Lokasi"
    if (blokNama === "TANPA LOKASI") {
      blokNama = "Tanpa Lokasi"
    }

    let stokBlok = parseFloat(bloks[blokNama] || 0)
    if (tipe === 'MASUK') stokBlok += qty
    else if (tipe === 'KELUAR') stokBlok -= qty
    else stokBlok = qty 

    stokBlok = parseFloat(stokBlok.toFixed(2))
    if (stokBlok <= 0.001) delete bloks[blokNama]
    else bloks[blokNama] = stokBlok

    const now = new Date()
    const trxId = 'TRX_' + now.getTime()
    const updates = {}
    
    updates[`stok_benang/${idUnik}/stok`] = sBaru
    updates[`stok_benang/${idUnik}/bloks`] = Object.keys(bloks).length > 0 ? bloks : null
    updates[`stok_benang/${idUnik}/tglUpdate`] = now.toISOString()
    
    updates[`riwayat_transaksi/${idUnik}/${trxId}`] = {
      trxId,
      qty: tipe === 'OPNAME' ? Math.abs(sBaru - sLama) : qty,
      stokAkhir: sBaru,
      tanggal: now.toISOString(),
      tipe,
      blok: lokasiBaru || "", 
      keterangan: ket
    }
    
    await update(dbRef(db), updates)
  }

  return { refreshData, jalankanAudit, kirimTransaksi }
}
