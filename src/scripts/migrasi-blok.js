import admin from 'firebase-admin'

// Mengambil kunci rahasia dari Environment Variable GitHub Actions
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountKey) {
  console.error('Error: FIREBASE_SERVICE_ACCOUNT secret tidak ditemukan!');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://gudangwarna-9eec7-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database()

const migrasi = async () => {
  console.log('Mulai migrasi...')
  
  // Gunakan admin SDK
  const snap = await db.ref('stok_benang').once('value')
  const data = snap.val()
  
  if (!data) { 
    console.log('Tidak ada data'); 
    return 
  }

  const updates = {}
  let count = 0

  Object.keys(data).forEach(id => {
    const item = data[id]

    if (item.bloks) return

    if (item.lokasi && item.lokasi.trim() && item.stok > 0) {
      updates[`stok_benang/${id}/bloks`] = {
        [item.lokasi.toUpperCase()]: parseFloat(item.stok) || 0
      }
    } else {
      updates[`stok_benang/${id}/bloks`] = {}
    }
    count++
  })

  if (Object.keys(updates).length) {
    await db.ref().update(updates)
    console.log(`Migrasi selesai: ${count} item diupdate`)
  } else {
    console.log('Semua item sudah ter-migrasi')
  }

  process.exit(0)
}

migrasi().catch(e => { console.error(e); process.exit(1) })
