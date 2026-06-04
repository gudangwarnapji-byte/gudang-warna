import { ref } from 'vue'

export const showBatchModal = ref(false)

export function useBatch() {
  const bukaBatch = () => { showBatchModal.value = true }
  return { bukaBatch }
}
