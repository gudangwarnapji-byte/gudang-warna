import { ref } from 'vue'

export const showBulananModal = ref(false)

export function useBulanan() {
  const bukaBulanan = () => { showBulananModal.value = true }
  return { bukaBulanan }
}
