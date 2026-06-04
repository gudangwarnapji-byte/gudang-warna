import { ref } from 'vue'

export const showAddModal = ref(false)

export function useAdd() {
  const bukaAddModal = () => { showAddModal.value = true }
  return { bukaAddModal }
}
