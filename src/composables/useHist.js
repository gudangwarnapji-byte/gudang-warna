import { ref } from 'vue'

export const activeHistId = ref('')

export function useHist() {
  const bukaRiwayat = (id) => {
    console.log('bukaRiwayat dipanggil:', id)
    activeHistId.value = id
  }

  const tutupRiwayat = () => {
    activeHistId.value = ''
  }

  return { bukaRiwayat, tutupRiwayat }
}
