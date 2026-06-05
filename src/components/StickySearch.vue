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

        <!-- STOK KRITIS FILTER -->
        <div class="filter-label mt-2">Stok</div>
        <div class="chip-row">
          <span
            :class="['f-chip', filterStokKritis ? 'bg-danger text-white' : 'bg-light text-dark']"
            @click="toggleStokKritis"
          >
            <i class="fas fa-exclamation-triangle me-1" style="font-size:.65rem"></i>
            Kritis (&lt; 5 Kg)
            <span v-if="filterStokKritis" class="ms-1 badge bg-white text-danger">{{ kritisList.length }}</span>
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
      <small v-if="kritisList.length > 0" class="badge bg-danger">⚠️ {{ kritisList.length }} Kritis</small>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import {
  searchQuery, activeJenis, activeGrade,
  filterStokKritis, kritisList,
  filterPanelOpen, filteredItems,
  jenisOptions, gradeOptions,
  useFilter
} from '../composables/useFilter'

const { toggleJenis, toggleGrade, toggleStokKritis, resetFilter, togglePanel } = useFilter()

const hasFilter = computed(() =>
  !activeJenis.value.has('Semua') || !activeGrade.value.has('Semua') || filterStokKritis.value
)

const filterSummary = computed(() => {
  if (!hasFilter.value) return 'Semua Jenis & Grade'
  const parts = []
  if (!activeJenis.value.has('Semua')) parts.push([...activeJenis.value].join(', '))
  if (!activeGrade.value.has('Semua')) parts.push('Grade ' + [...activeGrade.value].join('/'))
  if (filterStokKritis.value) parts.push('Kritis < 5kg')
  return parts.join(' · ')
})

const filterActiveLabel = computed(() => {
  if (!hasFilter.value) return ''
  const parts = []
  if (!activeJenis.value.has('Semua')) parts.push([...activeJenis.value].join(', '))
  if (!activeGrade.value.has('Semua')) parts.push('Grade ' + [...activeGrade.value].join('/'))
  if (filterStokKritis.value) parts.push('Stok Kritis < 5kg')
  return parts.join(' · ')
})

const getJenisClass = j => {
  if (j === 'Semua') return activeJenis.value.has('Semua') ? 'active' : ''
  return activeJenis.value.has(j) ? 'active' : ''
}

const getGradeClass = g => {
  if (g === 'Semua') return activeGrade.value.has('Semua') ? 'active' : ''
  return activeGrade.value.has(g) ? 'active' : ''
}
</script>

<style scoped>
.sticky-search {
  position: sticky;
  top: 0;
  background: #fff;
  padding: 12px 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0,0,0,.05);
}

.filter-toggle-btn {
  width: 100%;
  padding: 10px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  cursor: pointer;
  font-size: .85rem;
  font-weight: 600;
  color: #495057;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
}

.filter-toggle-btn:hover {
  background: #e9ecef;
  border-color: #dee2e6;
}

.filter-toggle-btn.has-filter {
  background: #e7f1ff;
  border-color: #0d6efd;
  color: #0d6efd;
}

.filter-toggle-btn.open {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.filter-toggle-btn .chevron {
  transition: transform 0.3s ease;
  font-size: .65rem;
}

.filter-toggle-btn.open .chevron {
  transform: rotate(180deg);
}

.filter-collapse {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.filter-collapse.open {
  max-height: 500px;
}

.filter-inner {
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-top: none;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
}

.filter-label {
  font-size: .75rem;
  font-weight: 700;
  color: #6c757d;
  text-transform: uppercase;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.f-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 20px;
  cursor: pointer;
  font-size: .8rem;
  font-weight: 600;
  color: #495057;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.f-chip:hover {
  background: #e9ecef;
  border-color: #adb5bd;
}

.f-chip.active {
  background: #0d6efd;
  color: #fff;
  border-color: #0d6efd;
}

.f-chip.bg-danger {
  background: #dc3545;
  color: #fff;
  border-color: #dc3545;
}

.f-chip.bg-danger:hover {
  background: #c82333;
  border-color: #c82333;
}

.f-chip.bg-light {
  background: #f8f9fa;
  border-color: #dee2e6;
}

.badge {
  font-size: .7rem;
  padding: 2px 6px;
}
</style>
