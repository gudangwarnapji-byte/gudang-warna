import { ref } from 'vue'

export const showSuratJalanModal = ref(false)

export function useSuratJalan() {
  const bukaSuratJalan = () => { showSuratJalanModal.value = true }
  return { bukaSuratJalan }
}
