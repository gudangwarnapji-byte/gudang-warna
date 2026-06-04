<template>
  <div class="modal fade show d-block" tabindex="-1" style="background:rgba(0,0,0,.5)">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow">
        <div class="modal-header bg-warning text-dark">
          <h5 class="modal-title fw-bold">Revisi Transaksi</h5>
          <button type="button" class="btn-close" @click="$emit('close')"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <label class="small fw-bold">Waktu Transaksi</label>
            <input type="datetime-local" class="form-control" v-model="tanggal">
          </div>
          <div class="row g-2 mb-2">
            <div class="col-6">
              <label class="small fw-bold">Tipe</label>
              <select class="form-select fw-bold" v-model="tipe">
                <option value="MASUK">MASUK</option>
                <option value="KELUAR">KELUAR</option>
                <option value="OPNAME">OPNAME</option>
              </select>
            </div>
            <div class="col-6">
              <label class="small fw-bold">Qty (Kg)</label>
              <input type="number" step="any" class="form-control fw-bold" v-model="qty">
            </div>
          </div>
          <div class="mb-3">
            <label class="small fw-bold">Keterangan</label>
            <input type="text" class="form-control text-uppercase" v-model="keterangan">
          </div>
          <div class="d-grid gap-2">
            <button type="button" class="btn btn-warning fw-bold text-dark shadow"
                    :disabled="saving" @click="simpan">
              {{ saving ? 'Menyimpan...' : 'UPDATE DATA' }}
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm fw-bold"
                    @click="hapus">
              HAPUS TRANSAKSI
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ref as dbRef, update, remove } from 'firebase/database'
import { db } from '../../firebase'
import { activeEditTrans, useEditTrans } from '../../composables/useEditTrans'
import { useStok } from '../../composables/useStok'

const emit = defineEmits(['close', 'saved'])
const { tutupEdit } = useEditTrans()
const { refreshData } = useStok()

const tanggal    = ref('')
const tipe       = ref('')
const qty        = ref(0)
const keterangan = ref('')
const saving     = ref(false)

onMounted(() => {
  const trx = activeEditTrans.value
  if (!trx) return
  const d = new Date(trx.tanggal)
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  tanggal.value    = d.toISOString().slice(0, 16)
  tipe.value       = trx.tipe
  qty.value        = trx.qty
  keterangan.value = trx.keterangan || ''
})

const simpan = async () => {
  const trx = activeEditTrans.value
  if (!trx) return
  saving.value = true
  try {
    const path = `riwayat_transaksi/${trx.parentId}/${trx.trxId}`
    await update(dbRef(db, path), {
      tanggal:     new Date(tanggal.value).toISOString(),
      tipe:        tipe.value,
      qty:         parseFloat(qty.value),
      keterangan:  keterangan.value.toUpperCase()
    })
    await jalankanAuditSatu(trx.parentId)
    emit('saved')
    emit('close')
  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  } finally {
    saving.value = false
  }
}

const hapus = async () => {
  const trx = activeEditTrans.value
  if (!trx) return
  const result = await window.Swal.fire({
    title: 'Hapus?',
    text: 'Data dihapus dan stok akan dihitung ulang.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc3545'
  })
  if (!result.isConfirmed) return
  try {
    await remove(dbRef(db, `riwayat_transaksi/${trx.parentId}/${trx.trxId}`))
    await jalankanAuditSatu(trx.parentId)
    emit('saved')
    emit('close')
  } catch(e) {
    window.Swal.fire('Error', e.message, 'error')
  }
}

const jalankanAuditSatu = async (parentId) => {
  const { get } = await import('firebase/database')
  const [snapM, snapH] = await Promise.all([
    get(dbRef(db, `stok_benang/${parentId}`)),
    get(dbRef(db, `riwayat_transaksi/${parentId}`))
  ])
  const master = snapM.val()
  if (!master) return
  let run = Number(master.stokAwal) || 0
  const logs = snapH.val()
  const updates = {}
  if (logs) {
    Object.values(logs)
      .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))
      .forEach(l => {
        const q = Number(l.qty)
        if (l.tipe === 'MASUK') run += q
        else if (l.tipe === 'KELUAR') run -= q
        else if (l.tipe === 'OPNAME') run = q
        run = parseFloat(run.toFixed(2))
        updates[`riwayat_transaksi/${parentId}/${l.trxId}/stokAkhir`] = run
      })
  }
  updates[`stok_benang/${parentId}/stok`] = run
  await update(dbRef(db), updates)
  refreshData()
}
</script>
