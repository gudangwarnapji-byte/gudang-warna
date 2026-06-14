<template>
  <div class="sticky-search px-3">
    <div class="search-container shadow-sm mb-3">
      <div class="search-icon">
        <i class="fas fa-search"></i>
      </div>
      <input
        type="text"
        class="search-input"
        placeholder="Cari Kode, Nama, Lokasi, atau Warna..."
        autocomplete="off"
        v-model="searchQuery"
      >
      <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <div class="px-1 mb-0">
      <button
        :class="['filter-toggle-btn', hasFilter ? 'has-filter' : '', filterPanelOpen ? 'open' : '']"
        @click="togglePanel"
      >
        <span class="d-flex align-items-center">
          <i class="fas fa-filter me-2 text-primary" style="font-size:0.9rem"></i>
          <span class="fw-medium">Filter Data:</span> 
          <b class="ms-1" style="font-weight:700">{{ filterSummary }}</b>
        </span>
        <i class="fas fa-chevron-down chevron"></i>
      </button>
    </div>

    <div :class="['filter-collapse', filterPanelOpen ? 'open' : '']">
      <div class="filter-inner">
        <div class="filter-label">Kategori Benang</div>
        <div class="chip-row">
          <span
            v-for="j in jenisOptions"
            :key="j"
            :class="['f-chip', getJenisClass(j)]"
            @click="toggleJenis(j)"
          >
            <i v-if="j === 'Semua'" class="fas fa-layer-group me-1 opacity-50"></i>
            {{ j }}
          </span>
        </div>

        <div class="filter-label mt-3">Quality Grade</div>
        <div class="chip-row">
          <span
            v-for="g in gradeOptions"
            :key="g"
            :class="['f-chip', getGradeClass(g)]"
            @click="toggleGrade(g)"
          >
            <i v-if="g === 'Semua'" class="fas fa-layer-group me-1 opacity-50"></i>
            {{ g === 'Semua' ? 'Semua Grade' : 'Grade ' + g }}
          </span>
        </div>

        <div class="filter-label mt-3">Status Fisik</div>
        <div class="chip-row">
          <span
            :class="['f-chip', filterStokKritis ? 'chip-critical-active' : 'chip-critical-inactive']"
            @click="toggleStokKritis"
          >
            <i class="fas fa-exclamation-triangle me-1"></i>
            Stok Kritis (&lt; 5 Kg)
            <span v-if="filterStokKritis" class="ms-2 badge rounded-pill bg-white text-danger fw-bold shadow-sm">
              {{ kritisList.length }}
            </span>
          </span>
        </div>

        <div class="filter-footer mt-3 pt-3">
          <small class="text-muted fw-medium">{{ filterActiveLabel }}</small>
          <button
            v-if="hasFilter"
            class="btn btn-sm btn-reset text-danger fw-bold"
            @click="resetFilter"
          >
            <i class="fas fa-sync-alt me-1"></i> Reset
          </button>
        </div>
      </div>
    </div>

    <div class="d-flex justify-content-between mt-3 px-2 align-items-center flex-wrap gap-2 pb-2">
      <div class="d-flex align-items-center gap-2">
        <div class="stat-badge">
          <i class="fas fa-cubes text-primary me-1"></i> {{ filteredItems.length }} Item Ditampilkan
        </div>
      </div>
      <div v-if="kritisList.length > 0 && !filterStokKritis" 
           class="badge-soft-danger cursor-pointer px-2 py-1 rounded shadow-sm"
           style="font-size:0.75rem; font-weight:700; cursor:pointer;"
           @click="toggleStokKritis">
        <i class="fas fa-exclamation-triangle me-1"></i> {{ kritisList.length }} Kritis
      </div>
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
  if (!hasFilter.value) return 'Semua Tipe'
  const parts = []
  if (!activeJenis.value.has('Semua')) parts.push([...activeJenis.value].join(', '))
  if (!activeGrade.value.has('Semua')) parts.push('Gr ' + [...activeGrade.value].join('/'))
  if (filterStokKritis.value) parts.push('Kritis')
  return parts.join(' • ')
})

const filterActiveLabel = computed(() => {
  if (!hasFilter.value) return 'Tidak ada filter aktif.'
  const parts = []
  if (!activeJenis.value.has('Semua')) parts.push([...activeJenis.value].join(', '))
  if (!activeGrade.value.has('Semua')) parts.push('Grade ' + [...activeGrade.value].join('/'))
  if (filterStokKritis.value) parts.push('Stok Kritis < 5kg')
  return 'Memfilter: ' + parts.join(' + ')
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
/* PAKAI VARIABEL WARNA BUNGLON BIAR SINKRON DENGAN TEMA */
.sticky-search {
  position: sticky;
  top: 0;
  background: var(--nav-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding-top: 15px;
  z-index: 1010;
  border-bottom: 1px solid var(--border-color);
}

/* SEARCH BAR MODERN */
.search-container {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border-radius: 16px;
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  box-shadow: var(--glass-shadow);
  transition: all 0.3s ease;
}
.search-container:focus-within {
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.1);
  border-color: #818cf8;
}
.search-icon {
  font-size: 1.1rem;
  color: var(--text-muted);
  margin-right: 12px;
}
.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 0;
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-main);
  outline: none;
}
.search-input::placeholder { color: var(--text-muted); font-weight: 400; }
.clear-btn {
  background: transparent; border: none; color: var(--text-muted); font-size: 1.2rem; cursor: pointer; transition: color 0.2s;
}
.clear-btn:hover { color: #ef4444; }

/* FILTER TOGGLE MODERN */
.filter-toggle-btn {
  width: 100%; padding: 12px 16px; background: var(--bg-card);
  border: 1px solid var(--border-color); border-radius: 12px;
  cursor: pointer; font-size: 0.85rem; color: var(--text-main);
  display: flex; justify-content: space-between; align-items: center;
  transition: all 0.3s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.filter-toggle-btn:hover { background: var(--bg-main); border-color: var(--border-color); }
.filter-toggle-btn.has-filter {
  background: rgba(79, 70, 229, 0.1); border-color: #818cf8; color: #4f46e5;
}
.filter-toggle-btn.open {
  border-bottom-left-radius: 0; border-bottom-right-radius: 0; border-bottom-color: transparent;
}
.filter-toggle-btn .chevron { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); color: var(--text-muted); }
.filter-toggle-btn.open .chevron { transform: rotate(-180deg); color: #4f46e5; }

/* FILTER PANEL */
.filter-collapse { max-height: 0; overflow: hidden; transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.filter-collapse.open { max-height: 500px; }
.filter-inner {
  padding: 20px; background: var(--bg-card);
  border: 1px solid var(--border-color); border-top: none;
  border-bottom-left-radius: 12px; border-bottom-right-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
}

.filter-label {
  font-size: 0.72rem; font-weight: 800; color: var(--text-muted);
  text-transform: uppercase; margin-bottom: 10px; letter-spacing: 1px;
}

/* FILTER CHIPS */
.chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
.f-chip {
  display: inline-flex; align-items: center; padding: 6px 14px;
  background: var(--bg-main); border: 1px solid transparent; border-radius: 20px;
  cursor: pointer; font-size: 0.8rem; font-weight: 600; color: var(--text-main);
  transition: all 0.2s ease; white-space: nowrap;
}
.f-chip:hover { background: var(--border-color); }
.f-chip.active { background: #4f46e5; color: #ffffff; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2); }

.chip-critical-inactive { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
.chip-critical-inactive:hover { background: rgba(239, 68, 68, 0.2); }
.chip-critical-active { background: #dc2626; color: #ffffff; box-shadow: 0 4px 6px rgba(220, 38, 38, 0.2); }

/* FOOTER PANEL */
.filter-footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid var(--border-color);
}
.btn-reset { padding: 4px 8px; border-radius: 6px; }
.btn-reset:hover { background: rgba(239, 68, 68, 0.1); }

/* STATS BADGES */
.stat-badge {
  font-size: 0.8rem; font-weight: 700; color: var(--text-main);
  background: var(--bg-card); padding: 6px 12px; border-radius: 8px;
  border: 1px solid var(--border-color); box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.badge-soft-danger { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }
</style>
