import { ref } from 'vue'

export const showDailyModal = ref(false)

export function useDaily() {
  const bukaDaily = () => { showDailyModal.value = true }
  return { bukaDaily }
}
