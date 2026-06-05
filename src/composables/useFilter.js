import { ref, computed } from 'vue'
import { dbStok } from './useStok'

export const searchQuery = ref('')
export const activeJenis = ref(new Set(['Semua']))
export const activeGrade = ref(new Set(['Semua']))
export const filterPanelOpen = ref(false)
export const filterStokKritis = ref(false)

export const kritisList = computed(() =>
  dbStok.value.filter(i => {
    const s = parseFloat(i.stok) || 0
    return s < 5 && (s <= -0.01 || s >= 0.01)
  })
)

export const filteredItems = computed(() => {
  if (filterStokKritis.value) return kritisList.value
  const q = searchQuery.value.toLowerCase()
  const allJ = activeJenis.value.has('Semua')
  const allG = activeGrade.value.has('Semua')
  return dbStok.value.filter(i => {
    const matchText =
      (i.nama    || '').toLowerCase().includes(q) ||
      (i.kodeErp || '').toLowerCase().includes(q) ||
      (i.warna   || '').toLowerCase().includes(q) ||
      (i.lokasi  || '').toLowerCase().includes(q)
    const matchJenis = allJ || activeJenis.value.has((i.jenis || '').toUpperCase())
    const matchGrade = allG || activeGrade.value.has((i.grade || '').toUpperCase())
    return matchText && matchJenis && matchGrade
  })
})

export const jenisOptions = computed(() => [
  'Semua',
  ...new Set(
    dbStok.value.map(i => (i.jenis || '').toUpperCase()).filter(Boolean).sort()
  )
])

export const gradeOptions = computed(() => [
  'Semua',
  ...new Set(
    dbStok.value.map(i => (i.grade || '').toUpperCase()).filter(Boolean).sort()
  )
])

export function useFilter() {
  const toggleJenis = j => {
    const s = new Set(activeJenis.value)
    if (j === 'Semua') { activeJenis.value = new Set(['Semua']); return }
    s.delete('Semua')
    s.has(j) ? s.delete(j) : s.add(j)
    activeJenis.value = s.size ? s : new Set(['Semua'])
  }

  const toggleGrade = g => {
    const s = new Set(activeGrade.value)
    if (g === 'Semua') { activeGrade.value = new Set(['Semua']); return }
    s.delete('Semua')
    s.has(g) ? s.delete(g) : s.add(g)
    activeGrade.value = s.size ? s : new Set(['Semua'])
  }

  const toggleStokKritis = () => {
    filterStokKritis.value = !filterStokKritis.value
  }

  const resetFilter = () => {
    activeJenis.value = new Set(['Semua'])
    activeGrade.value = new Set(['Semua'])
    searchQuery.value = ''
    filterStokKritis.value = false
  }

  const togglePanel = () => {
    filterPanelOpen.value = !filterPanelOpen.value
  }

  return { toggleJenis, toggleGrade, toggleStokKritis, resetFilter, togglePanel }
}
