import { ref } from 'vue'

export const showMutasiModal = ref(false)

export function useMutasi() {
  const bukaMutasi = () => { showMutasiModal.value = true }
  return { bukaMutasi }
}
