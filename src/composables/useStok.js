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
        let run = Number(masters[parentId].stokAwal) || 0
        const bloksAudit = {}
        const logs = histories[parentId] || {}

        // Urutkan transaksi dari yang paling lama
        const sortedLogs = Object.values(logs).sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
        
        sortedLogs.forEach(l => {
          const q = Number(l.qty) || 0
          // LOGIKA REKONSILIASI: Paksa blok kosong masuk ke "TANPA LOKASI"
          const blokNama = (l.blok && l.blok.trim() !== "") ? l.blok : "TANPA LOKASI"

          if (l.tipe === 'MASUK') {
            run += q
            bloksAudit[blokNama] = (parseFloat(bloksAudit[blokNama] || 0) + q)
          } 
          else if (l.tipe === 'KELUAR') {
            run -= q
            bloksAudit[blokNama] = (parseFloat(bloksAudit[blokNama] || 0) - q)
          } 
          else if (l.tipe === 'OPNAME') {
            const stokBlokLama = parseFloat(bloksAudit[blokNama] || 0)
            const selisih = q - stokBlokLama
            run += selisih
            bloksAudit[blokNama] = q
          }
          
          run = parseFloat(run.toFixed(2))
          updates[`riwayat_transaksi/${parentId}/${l.trxId}/stokAkhir`] = run
        })

        // Bersihkan data blok yang sudah habis (nol/negatif)
        Object.keys(bloksAudit).forEach(b => {
          bloksAudit[b] = parseFloat(bloksAudit[b].toFixed(2))
          if (bloksAudit[b] <= 0.001) delete bloksAudit[b]
        })

        updates[`stok_benang/${parentId}/stok`] = run
        updates[`stok_benang/${parentId}/bloks`] = Object.keys(bloksAudit).length > 0 ? bloksAudit : null
      })

      await update(dbRef(db), updates)
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
    // Jika tidak ada lokasi baru, masukkan ke TANPA LOKASI
    const blokNama = (lokasiBaru && lokasiBaru.trim() !== "") ? lokasiBaru : "TANPA LOKASI"

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
    updates[`stok_benang/${idUnik}/bloks`] = bloks
    updates[`stok_benang/${idUnik}/tglUpdate`] = now.toISOString()
    
    updates[`riwayat_transaksi/${idUnik}/${trxId}`] = {
      trxId,
      qty: tipe === 'OPNAME' ? Math.abs(sBaru - sLama) : qty,
      stokAkhir: sBaru,
      tanggal: now.toISOString(),
      tipe,
      blok: lokasiBaru || "", // Tetap simpan asli di riwayat
      keterangan: ket
    }
    
    await update(dbRef(db), updates)
  }

  return { refreshData, jalankanAudit, kirimTransaksi }
}
