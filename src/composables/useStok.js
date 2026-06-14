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
        
        if (totalStok !== 0) {
          bloksTemp["Tanpa Lokasi"] = totalStok
        }

        logs.forEach(l => {
          const q = Number(l.qty) || 0
          const rawBlok = (l.blok || "").trim().toUpperCase()
          let lokasi = (rawBlok === "" || rawBlok === "TANPA LOKASI") ? "Tanpa Lokasi" : rawBlok

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
          if (Math.abs(bloksTemp[b]) <= 0.001) delete bloksTemp[b]
          else bloksTemp[b] = parseFloat(bloksTemp[b].toFixed(2))
        })

        updates[`stok_benang/${parentId}/stok`] = parseFloat(totalStok.toFixed(2))
        updates[`stok_benang/${parentId}/bloks`] = Object.keys(bloksTemp).length > 0 ? bloksTemp : null
      })

      await update(dbRef(db), updates)
      console.log("Audit Pure Math Selesai.")
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
    let blokNama = (rawBlok === "" || rawBlok === "TANPA LOKASI") ? "Tanpa Lokasi" : rawBlok

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
      const selisih = qty - stokBlokLama
      sBaru = sLama + selisih
      bloks[blokNama] = qty
    }

    sBaru = parseFloat(sBaru.toFixed(2))
    
    Object.keys(bloks).forEach(b => {
      if (Math.abs(bloks[b]) <= 0.001) delete bloks[b]
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

  // === FITUR BARU: MUTASI (PINDAH LOKASI TANPA NAMBAH TOTAL STOK) ===
  const kirimMutasi = async (idUnik, qty, ket, blokAsal, blokTujuan) => {
    // Tarik data paling fresh langsung dari DB biar gak tabrakan (Race Condition)
    const snap = await get(dbRef(db, `stok_benang/${idUnik}`))
    const item = snap.val()
    if (!item) return

    const totalStok = Number(item.stok) || 0 // TOTAL STOK HARUS TETAP!
    const bloks = { ...(item.bloks || {}) }

    const asal = (blokAsal || "").trim().toUpperCase()
    const tujuan = (blokTujuan || "").trim().toUpperCase()
    const namaAsal = (asal === "" || asal === "TANPA LOKASI") ? "Tanpa Lokasi" : asal
    const namaTujuan = (tujuan === "" || tujuan === "TANPA LOKASI") ? "Tanpa Lokasi" : tujuan

    let stokAsal = parseFloat(bloks[namaAsal] || 0) - qty
    let stokTujuan = parseFloat(bloks[namaTujuan] || 0) + qty

    bloks[namaAsal] = parseFloat(stokAsal.toFixed(2))
    bloks[namaTujuan] = parseFloat(stokTujuan.toFixed(2))

    Object.keys(bloks).forEach(b => {
      if (Math.abs(bloks[b]) <= 0.001) delete bloks[b]
    })

    const now = new Date()
    const timeOut = new Date(now.getTime() - 1000) // Catat keluar 1 detik lebih awal
    const trxIdOut = 'TRX_' + timeOut.getTime() + '_OUT'
    const trxIdIn = 'TRX_' + now.getTime() + '_IN'

    const updates = {}
    updates[`stok_benang/${idUnik}/stok`] = totalStok // TOTAL TETAP SAMA KAYA AWAL
    updates[`stok_benang/${idUnik}/bloks`] = Object.keys(bloks).length > 0 ? bloks : null
    updates[`stok_benang/${idUnik}/tglUpdate`] = now.toISOString()

    // 1. Resi Keluar dari Lokasi Lama
    updates[`riwayat_transaksi/${idUnik}/${trxIdOut}`] = {
      trxId: trxIdOut,
      qty: qty,
      stokAkhir: parseFloat((totalStok - qty).toFixed(2)),
      tanggal: timeOut.toISOString(),
      tipe: 'KELUAR',
      blok: blokAsal || "",
      keterangan: ket ? `MUTASI KE ${namaTujuan} (${ket})` : `MUTASI KE ${namaTujuan}`
    }

    // 2. Resi Masuk ke Lokasi Baru
    updates[`riwayat_transaksi/${idUnik}/${trxIdIn}`] = {
      trxId: trxIdIn,
      qty: qty,
      stokAkhir: totalStok, // Total stok auto balik utuh!
      tanggal: now.toISOString(),
      tipe: 'MASUK',
      blok: blokTujuan || "",
      keterangan: ket ? `MUTASI DARI ${namaAsal} (${ket})` : `MUTASI DARI ${namaAsal}`
    }

    await update(dbRef(db), updates)
  }

  // JANGAN LUPA EXPORT kirimMutasi
  return { refreshData, jalankanAudit, kirimTransaksi, kirimMutasi } 
}
