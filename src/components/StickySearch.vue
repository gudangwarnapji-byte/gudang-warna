<template>
  <div class="sticky-search">
    <!-- SEARCH BAR -->
    <div class="input-group input-group-lg shadow-sm mb-2">
      <span class="input-group-text bg-white border-0">
        <i class="fas fa-search text-muted"></i>
      </span>
      <input
        type="text"
        class="form-control border-0"
        placeholder="Cari Kode, Nama, Lokasi..."
        autocomplete="off"
        v-model="searchQuery"
      >
    </div>

    <!-- FILTER TOGGLE -->
    <div class="px-1 mb-0">
      <button
        :class="['filter-toggle-btn', hasFilter ? 'has-filter' : '', filterPanelOpen ? 'open' : '']"
        @click="togglePanel"
      >
        <span>
          <i class="fas fa-filter me-2" style="font-size:.75rem"></i>
          Filter: <b>{{ filterSummary }}</b>
        </span>
        <i class="fas fa-chevron-down chevron"></i>
      </button>
    </div>

    <!-- FILTER PANEL -->
    <div :class="['filter-collapse', filterPanelOpen ? 'open' : '']">
      <div class="filter-inner">
        <div class="filter-label">Jenis Benang</div>
        <div class="chip-row">
          <span
            v-for="j in jenisOptions"
            :key="j"
            :class="['f-chip', getJenisClass(j)]"
            @click="toggleJenis(j)"
          >
            <i v-if="j === 'Semua'" class="fas fa-layer-group me-1" style="font-size:.65rem"></i>
            {{ j }}
          </span>
        </div>

        <div class="filter-label mt-2">Grade</div>
        <div class="chip-row">
          <span
            v-for="g in gradeOptions"
            :key="g"
            :class="['f-chip', getGradeClass(g)]"
            @click="toggleGrade(g)"
          >
            <i v-if="g === 'Semua'" class="fas fa-layer-group me-1" style="font-size:.65rem"></i>
            {{ g === 'Semua' ? 'Semua' : 'Grade ' + g }}
          </span>
        </div>

        <div class="d-flex justify-content-between align-items-center mt-2 pt-2"
             style="border-top:1px solid #f0f0f0">
          <small class="text-muted">{{ filterActiveLabel }}</small>
          <button
            v-if="hasFilter"
            class="btn btn-sm btn-link text-danger p-0 fw-bold"
            style="font-size:.72rem"
            @click="resetFilter"
          >Reset Filter</button>
        </div>
      </div>
    </div>

    <!-- STATS -->
    <div class="d-flex justify-content-between mt-2 px-1 align-items-center flex-wrap gap-2">
      <small class="text-muted fw-bold">{{ filteredItems.length }} Item</small>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  searchQuery, activeJenis, activeGrade,
  filterPanelOpen, filteredItems,
  jenisOptions, gradeOptions,
  useFilter
} from '../composables/useFilter'

const { toggleJenis, toggleGrade, resetFilter, togglePanel } = useFilter()

const hasFilter = computed(() =>
  !activeJenis.value.has('Semua') || !activeGrade.value.has('Semua')
)

const filterSummary = computed(() => {
  if (!hasFilter.value) return 'Semua Jenis & Grade'
  const parts = []
  if (!activeJenis.value.has('Semua')) parts.push([...activeJenis.value].join(', '))
  if (!activeGrade.value.has('Semua')) parts.push('Grade ' + [...activeGrade.value].join('/'))
  return parts.join(' · ')
})

const filterActiveLabel = computed(() => {
  if (!hasFilter.value) return ''
  const parts = []
  if (!activeJenis.value.has('Semua')) parts.push([...activeJenis.value].join(', '))
  if (!activeGrade.value.has('Semua')) parts.push('Grade ' + [...activeGrade.value].join('/'))
  return parts.join(' · ')
})

const getJenisClass = (j) => {
  if (j === 'Semua') return activeJenis.value.has('Semua') ? 'active-all' : ''
  return activeJenis.value.has(j) ? 'active-jenis' : ''
}

const getGradeClass = (g) => {
  if (g === 'Semua') return activeGrade.value.has('Semua') ? 'active-all' : ''
  if (g === 'A') return activeGrade.value.has('A') ? 'active-ga' : ''
  if (g === 'B') return activeGrade.value.has('B') ? 'active-gb' : ''
  if (g === 'L') return activeGrade.value.has('L') ? 'active-gl' : ''
  return ''
}
</script>

<style scoped>
.sticky-search {
  position: sticky; top: 0; z-index: 900;
  background: #f4f6f9; padding: 10px 0 6px;
  box-shadow: 0 4px 6px -4px rgba(0,0,0,.05);
}
.filter-toggle-btn {
  display: flex; align-items: center; justify-content: space-between;
  width: 100%; padding: 7px 12px; font-size: .8rem; font-weight: 600;
  border-radius: 10px; cursor: pointer; border: 1.5px solid #dee2e6;
  background: #fff; color: #495057; transition: all .2s;
  box-shadow: 0 1px 4px rgba(0,0,0,.04);
}
.filter-toggle-btn.has-filter { border-color: #1e3c72; background: #eef2fa; color: #1e3c72; }
.chevron { transition: transform .25s; font-size: .75rem; opacity: .6; }
.filter-toggle-btn.open .chevron { transform: rotate(180deg); }
.filter-collapse { overflow: hidden; max-height: 0; transition: max-height .3s, opacity .25s; opacity: 0; }
.filter-collapse.open { max-height: 300px; opacity: 1; }
.filter-inner {
  background: #fff; border: 1.5px solid #dee2e6;
  border-top: none; border-radius: 0 0 10px 10px;
  padding: 10px 12px 12px;
}
.filter-label {
  font-size: .62rem; color: #6c757d; text-transform: uppercase;
  letter-spacing: .5px; font-weight: 700; margin-bottom: 4px;
}
.chip-row {
  display: flex; gap: 5px; overflow-x: auto;
  white-space: nowrap; padding-bottom: 4px;
  -webkit-overflow-scrolling: touch;
}
.chip-row::-webkit-scrollbar { display: none; }
.f-chip {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 4px 11px; border-radius: 20px; font-size: .72rem;
  font-weight: 600; cursor: pointer; border: 1px solid #dee2e6;
  background: #f8f9fa; color: #6c757d; transition: all .15s;
  user-select: none; white-space: nowrap; flex-shrink: 0;
}
.active-all  { background: #1e3c72 !important; color: #fff !important; border-color: #1e3c72 !important; }
.active-jenis{ background: #1e3c72 !important; color: #fff !important; border-color: #1e3c72 !important; }
.active-ga   { background: #d1e7dd !important; color: #0a3622 !important; border-color: #198754 !important; }
.active-gb   { background: #fff3cd !important; color: #664d03 !important; border-color: #ffc107 !important; }
.active-gl   { background: #f8d7da !important; color: #58151c !important; border-color: #dc3545 !important; }
</style>
