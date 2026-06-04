import { ref } from 'vue'
import { ref as dbRef, onValue, update, push } from 'firebase/database'
import { db } from '../firebase'

export const dbStok = ref([])
export const itemVelocity = ref({})
export const loading = ref(false)

export function useStok() {
  const refreshData = () => {
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
    const sBaru = parseFloat(
      (tipe === 'MASUK' ? sLama + qty
      : tipe === 'KELUAR' ? sLama - qty
      : qty).toFixed(2)
    )
    const now = new Date()
    const trxId = 'TRX_' + now.getTime()
    const qLog = tipe === 'OPNAME' ? Math.abs(sBaru - sLama) : qty
    const updates = {}
    updates[`stok_benang/${idUnik}/stok`] = sBaru
    updates[`stok_benang/${idUnik}/lokasi`] = sBaru <= 0.01 ? '' : lokasiBaru
    updates[`stok_benang/${idUnik}/tglUpdate`] = now.toISOString()
    updates[`riwayat_transaksi/${idUnik}/${trxId}`] = {
      trxId,
      kodeErp: item.kodeErp || '-',
      qty: qLog,
      stokAkhir: sBaru,
      tanggal: now.toISOString(),
      tipe,
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
    await update(dbRef(db, `stok_benang/${id}`), {
      lokasi: lokasi.toUpperCase()
    })
  }

  return { refreshData, kirimTransaksi, saveNewItem, updateLokasi }
}
