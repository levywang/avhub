import { ref } from 'vue'

const theme = ref(localStorage.getItem('theme') || 'dark')

function applyTheme(t) {
  theme.value = t
  document.body.setAttribute('data-theme', t)
  localStorage.setItem('theme', t)
}

// apply on load
applyTheme(theme.value)

export function useTheme() {
  return { theme, applyTheme }
}
