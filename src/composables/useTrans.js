import { ref } from 'vue'

export const activeTrans = ref(null)

export function useTrans() {
  const bukaTransaksi = (tipe, item) => {
    activeTrans.value = { tipe, item }
  }
  const tutupTransaksi = () => {
    activeTrans.value = null
  }
  return { bukaTransaksi, tutupTransaksi }
}
