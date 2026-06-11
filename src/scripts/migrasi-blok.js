import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, update } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyB8kLF4Enf-Tbt4Meqco0LI25pavGDoz_I",
  authDomain: "gudangwarna-9eec7.firebaseapp.com",
  databaseURL: "https://gudangwarna-9eec7-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gudangwarna-9eec7",
  storageBucket: "gudangwarna-9eec7.firebasestorage.app",
  messagingSenderId: "467676948459",
  appId: "1:467676948459:web:7fda08ea40c0daae471bae"
}

const app = initializeApp(firebaseConfig)
const db  = getDatabase(app)

const migrasi = async () => {
  console.log('Mulai migrasi...')
  const snap = await get(ref(db, 'stok_benang'))
  const data = snap.val()
  if (!data) { console.log('Tidak ada data'); return }

  const updates = {}
  let count = 0

  Object.keys(data).forEach(id => {
    const item = data[id]

    // Skip kalau sudah punya field bloks
    if (item.bloks) return

    // Kalau ada lokasi → jadikan blok awal
    if (item.lokasi && item.lokasi.trim() && item.stok > 0) {
      updates[`stok_benang/${id}/bloks`] = {
        [item.lokasi.toUpperCase()]: parseFloat(item.stok) || 0
      }
    } else {
      // Tidak ada lokasi → bloks kosong
      updates[`stok_benang/${id}/bloks`] = {}
    }
    count++
  })

  if (Object.keys(updates).length) {
    await update(ref(db), updates)
    console.log(`Migrasi selesai: ${count} item diupdate`)
  } else {
    console.log('Semua item sudah ter-migrasi')
  }

  process.exit(0)
}

migrasi().catch(e => { console.error(e); process.exit(1) })
