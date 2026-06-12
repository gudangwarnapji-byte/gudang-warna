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

  // === ENGINE AUDIT: KIAMAT GLOBAL ===
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
          
          // DETEKSI GLOBAL: Kalau kosong ATAU tertulis "Tanpa Lokasi", itu artinya GLOBAL!
          const rawBlok = (l.blok || "").trim().toUpperCase()
          const isGlobal = (rawBlok === "" || rawBlok === "TANPA LOKASI")
          let lokasi = isGlobal ? "Tanpa Lokasi" : rawBlok

          if (l.tipe === 'MASUK') {
            totalStok += q
            bloksTemp[lokasi] = (bloksTemp[lokasi] || 0) + q
          } 
          else if (l.tipe === 'KELUAR') {
            totalStok -= q
            bloksTemp[lokasi] = (bloksTemp[lokasi] || 0) - q
          } 
          else if (l.tipe === 'OPNAME') {
            if (isGlobal) {
              // KIAMAT GLOBAL: RESET TOTAL STOK & HAPUS SEMUA BLOK
              totalStok = q
              for (let key in bloksTemp) delete bloksTemp[key] 
              if (q > 0) bloksTemp["Tanpa Lokasi"] = q
            } else {
              // OPNAME SPESIFIK RAK TERTENTU
              const stokBlokLama = parseFloat(bloksTemp[lokasi] || 0)
              const selisih = q - stokBlokLama
              totalStok += selisih
              bloksTemp[lokasi] = q
            }
          }
          
          updates[`riwayat_transaksi/${parentId}/${l.trxId}/stokAkhir`] = parseFloat(totalStok.toFixed(2))
        })

        // Sapu bersih pecahan debu desimal
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
      console.log("Audit Selesai. Opname Global dieksekusi penuh.")
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
    const bloks = { ...(item.bloks || {}) }
    
    const rawBlok = (lokasiBaru || "").trim().toUpperCase()
    const isGlobal = (rawBlok === "" || rawBlok === "TANPA LOKASI")
    let blokNama = isGlobal ? "Tanpa Lokasi" : rawBlok

    let stokBlokLama = parseFloat(bloks[blokNama] || 0)
    let sBaru = sLama

    if (tipe === 'MASUK') {
      sBaru = sLama + qty
      bloks[blokNama] = stokBlokLama + qty
    } 
    else if (tipe === 'KELUAR') {
      sBaru = sLama - qty
      bloks[blokNama] = stokBlokLama - qty
    } 
    else if (tipe === 'OPNAME') {
      if (isGlobal) {
        sBaru = qty
        for (let key in bloks) delete bloks[key]
        if (qty > 0) bloks["Tanpa Lokasi"] = qty
      } else {
        const selisih = qty - stokBlokLama
        sBaru = sLama + selisih
        bloks[blokNama] = qty
      }
    }

    sBaru = parseFloat(sBaru.toFixed(2))
    
    Object.keys(bloks).forEach(b => {
      if (bloks[b] <= 0.001) delete bloks[b]
      else bloks[b] = parseFloat(bloks[b].toFixed(2))
    })

    const now = new Date()
    const trxId = 'TRX_' + now.getTime()
    const updates = {}
    
    updates[`stok_benang/${idUnik}/stok`] = sBaru
    updates[`stok_benang/${idUnik}/bloks`] = Object.keys(bloks).length > 0 ? bloks : null
    updates[`stok_benang/${idUnik}/tglUpdate`] = now.toISOString()
    
    updates[`riwayat_transaksi/${idUnik}/${trxId}`] = {
      trxId,
      qty: qty, 
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
