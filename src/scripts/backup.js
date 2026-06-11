// File: scripts/backup.js
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// 1. Ambil Kunci Rahasia dari Environment GitHub
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

// 2. Koneksi ke Firebase dari Jalur Belakang (Admin SDK)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DB_URL
});

const db = admin.database();

async function jalankanBackup() {
  try {
    console.log('⏳ Sedang menarik data dari Firebase...');
    const snap = await db.ref('/').once('value');
    const data = snap.val();
    
    // 3. Siapkan nama file berdasarkan tanggal
    const dateStr = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
    const dir = path.join(__dirname, '../database-backups');
    
    // 4. Buat folder jika belum ada
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // 5. Simpan sebagai file JSON yang rapi
    const filePath = path.join(dir, `backup_${dateStr}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    console.log(`✅ Backup berhasil disimpan di: ${filePath}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Gagal melakukan backup:', error);
    process.exit(1);
  }
}

jalankanBackup();
