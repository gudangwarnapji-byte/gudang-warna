import { ref } from 'vue'

export const activeHistId = ref('')

export function useHist() {
  const bukaRiwayat = (id) => {
    console.log('bukaRiwayat dipanggil:', id)  // ← tambah ini
    activeHistId.value = id
  }
  return { bukaRiwayat, tutupRiwayat }
}
