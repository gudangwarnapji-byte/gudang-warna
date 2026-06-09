import { ref } from 'vue'
import { ref as dbRef, onValue } from 'firebase/database'
import { db } from '../firebase'

export const showBlokModal = ref(false)
export const masterBlok = ref([])

export const loadMasterBlok = () => {
  onValue(dbRef(db, 'master_blok'), snap => {
    const data = snap.val() || {}
    masterBlok.value = Object.entries(data)
      .map(([id, val]) => ({ id, nama: val.nama }))
      .sort((a, b) => a.nama.localeCompare(b.nama))
  })
}

export function useBlok() {
  const bukaBlok = () => { showBlokModal.value = true }
  return { bukaBlok }
}
