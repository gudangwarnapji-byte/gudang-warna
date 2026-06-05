import { ref } from 'vue'

export const showSelisihModal = ref(false)

export function useSelisih() {
  const bukaSelisih = () => { showSelisihModal.value = true }
  return { bukaSelisih }
}
