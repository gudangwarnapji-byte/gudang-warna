import { ref, watch } from 'vue'

// Cek memori browser, apakah sebelumnya user milih dark mode?
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')

const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
}

// Bikin efek "Bunglon" untuk HTML dan Bootstrap 5.3
watch(isDarkMode, (newVal) => {
  if (newVal) {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.documentElement.setAttribute('data-bs-theme', 'dark') // Aktifkan dark mode Bootstrap 5.3
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    document.documentElement.setAttribute('data-bs-theme', 'light') // Aktifkan light mode Bootstrap 5.3
    localStorage.setItem('theme', 'light')
  }
}, { immediate: true })

export function useTheme() {
  return { isDarkMode, toggleTheme }
}
