import { ref } from 'vue'

export const activeEditTrans = ref(null)

export function useEditTrans() {
  const bukaEdit = (trx, parentId) => {
    activeEditTrans.value = { ...trx, parentId }
  }
  const tutupEdit = () => {
    activeEditTrans.value = null
  }
  return { bukaEdit, tutupEdit }
}
