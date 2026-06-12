import { ref } from 'vue'
import { ref as dbRef, onValue, update, push, get } from 'firebase/database'
import { db } from '../firebase'

export const dbStok = ref([])
export const itemVelocity = ref({})
export const loading = ref(false)

let isListening = false 
let isAuditing = false // KUNCI PENGAMAN BARU

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
      kalkulasiFastSlow()
    })
  }

  const kalkulasiFastSlow = () => {
    const tglBatas = new Date()
    tglBatas.setDate(tglBatas.getDate() - 30)
    // Gunakan get() agar tidak memicu listener berulang
    get(dbRef(db, 'riwayat_transaksi')).then(snap => {
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
    })
  }

  // AUDIT GLOBAL DENGAN KUNCI PENGAMAN
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

        Object.values(logs)
          .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
          .forEach(l => {
            const q = Number(l.qty) || 0
            const blokNama = l.blok || ''

            if (l.tipe === 'MASUK') {
              run += q
              if (blokNama) bloksAudit[blokNama] = (parseFloat(bloksAudit[blokNama]) || 0) + q
            } else if (l.tipe === 'KELUAR') {
              run -= q
              if (blokNama) bloksAudit[blokNama] = (parseFloat(bloksAudit[blokNama]) || 0) - q
            } else if (l.tipe === 'OPNAME') {
              if (blokNama) {
                const stokBlokLama = parseFloat(bloksAudit[blokNama]) || 0
                run += (q - stokBlokLama)
                bloksAudit[blokNama] = q
              } else {
                run = q
                for (let key in bloksAudit) delete bloksAudit[key]
              }
            }
            run = parseFloat(run.toFixed(2))
            updates[`riwayat_transaksi/${parentId}/${l.trxId}/stokAkhir`] = run
          })

        Object.keys(bloksAudit).forEach(b => {
          bloksAudit[b] = parseFloat(bloksAudit[b].toFixed(2))
          if (bloksAudit[b] <= 0) delete bloksAudit[b]
        })

        updates[`stok_benang/${parentId}/stok`] = run
        updates[`stok_benang/${parentId}/bloks`] = Object.keys(bloksAudit).length ? bloksAudit : null
      })

      await update(dbRef(db), updates)
    } finally {
      isAuditing = false
    }
  }

  const kirimTransaksi = async (idUnik, tipe, qty, ket, lokasiBaru) => {
    const item = dbStok.value.find(x => x.idUnik === idUnik)
    if (!item) return
    
    const sLama = Number(item.stok) || 0
    let sBaru = tipe === 'MASUK' ? sLama + qty 
              : tipe === 'KELUAR' ? sLama - qty 
              : qty
    sBaru = parseFloat(sBaru.toFixed(2))

    const bloks = { ...(item.bloks || {}) }
    const blokNama = lokasiBaru || ''

    if (blokNama) {
      let stokBlok = parseFloat(bloks[blokNama] || 0)
      if (tipe === 'MASUK') stokBlok += qty
      else if (tipe === 'KELUAR') stokBlok -= qty
      else stokBlok = qty 

      stokBlok = parseFloat(stokBlok.toFixed(2))
      if (stokBlok <= 0.001) delete bloks[blokNama]
      else bloks[blokNama] = stokBlok
    }

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

  return { refreshData, kirimTransaksi, jalankanAudit }
}
