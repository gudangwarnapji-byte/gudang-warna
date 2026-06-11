import { ref } from 'vue'
import { ref as dbRef, onValue, update, push } from 'firebase/database'
import { db } from '../firebase'

export const dbStok = ref([])
export const itemVelocity = ref({})
export const loading = ref(false)

// Variabel penanda agar listener tidak diduplikat (Mencegah Memory Leak & Crash)
let isListening = false 

export function useStok() {
  const refreshData = () => {
    if (isListening) return // Kalau sudah memantau, jangan buat listener baru!
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
      kalkulasiFastSlow()
    })
  }

  const kalkulasiFastSlow = () => {
    const tglBatas = new Date()
    tglBatas.setDate(tglBatas.getDate() - 30)
    onValue(dbRef(db, 'riwayat_transaksi'), snap => {
      const hs = snap.val() || {}
      const vel = {}
      dbStok.value.forEach(i => {
        let outQty = 0
        Object.values(hs[i.idUnik] || {}).forEach(l => {
          if (l.tipe === 'KELUAR' && new Date(l.tanggal) >= tglBatas)
            outQty += parseFloat(l.qty) || 0
        })
        vel[i.idUnik] =
          outQty >= 3000 ? 'FAST'
          : outQty >= 1120 ? 'MEDIUM'
          : outQty > 0 ? 'SLOW'
          : 'DEAD'
      })
      itemVelocity.value = vel
    }, { onlyOnce: true })
  }

  const kirimTransaksi = async (idUnik, tipe, qty, ket, lokasiBaru) => {
    const item = dbStok.value.find(x => x.idUnik === idUnik)
    if (!item) return
    
    const sLama = Number(item.stok) || 0
    let sBaru = parseFloat(
      (tipe === 'MASUK' ? sLama + qty
      : tipe === 'KELUAR' ? sLama - qty
      : qty).toFixed(2)
    )

    // --- LOGIKA MULTI-BLOK BARU ---
    const bloks = { ...(item.bloks || {}) }
    const blokNama = lokasiBaru || ''

    if (blokNama) {
      let stokBlok = parseFloat(bloks[blokNama] || 0)
      if (tipe === 'MASUK') stokBlok += qty
      else if (tipe === 'KELUAR') stokBlok -= qty
      else stokBlok = qty

      stokBlok = parseFloat(stokBlok.toFixed(2))

      // Hapus blok jika stok habis
      if (stokBlok <= 0) delete bloks[blokNama]
      else bloks[blokNama] = stokBlok

      // Sinkronkan Total Stok dengan isi Blok
      sBaru = parseFloat(Object.values(bloks).reduce((s, v) => s + v, 0).toFixed(2))
    }
    // ------------------------------

    const now = new Date()
    const trxId = 'TRX_' + now.getTime()
    const qLog = tipe === 'OPNAME' ? Math.abs(sBaru - sLama) : qty
    const updates = {}
    
    updates[`stok_benang/${idUnik}/stok`] = sBaru
    updates[`stok_benang/${idUnik}/bloks`] = Object.keys(bloks).length ? bloks : null
    updates[`stok_benang/${idUnik}/tglUpdate`] = now.toISOString()
    
    updates[`riwayat_transaksi/${idUnik}/${trxId}`] = {
      trxId,
      kodeErp: item.kodeErp || '-',
      qty: qLog,
      stokAkhir: sBaru,
      tanggal: now.toISOString(),
      tipe,
      blok: blokNama,
      keterangan: ket
    }
    
    await update(dbRef(db), updates)
  }

  const saveNewItem = async (payload) => {
    await push(dbRef(db, 'stok_benang'), {
      ...payload,
      tglUpdate: new Date().toISOString()
    })
  }

  const updateLokasi = async (id, lokasi) => {
    // Sinkronisasi update manual ke format objek bloks
    const item = dbStok.value.find(x => x.idUnik === id)
    if (!item) return
    
    const bloks = {}
    if (lokasi && item.stok > 0) {
      bloks[lokasi.toUpperCase()] = parseFloat(item.stok)
    }
    
    await update(dbRef(db, `stok_benang/${id}`), {
      bloks: Object.keys(bloks).length ? bloks : null
    })
  }

  return { refreshData, kirimTransaksi, saveNewItem, updateLokasi }
}
