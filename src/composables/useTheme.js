import { ref, watch } from 'vue'

// Cek memori browser, apakah sebelumnya user milih dark mode?
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
}

// Bikin efek "Bunglon": kalau berubah, ganti atribut HTML dan simpan ke memori
watch(isDarkMode, (newVal) => {
  if (newVal) {
    document.documentElement.setAttribute('data-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
}, { immediate: true })

export function useTheme() {
  return { isDarkMode, toggleTheme }
}
