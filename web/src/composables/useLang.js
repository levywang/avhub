import { ref, computed } from 'vue'
import { translations } from '../i18n.js'

const lang = ref(localStorage.getItem('language') || 'zh')

function setLang(l) {
  lang.value = l
  localStorage.setItem('language', l)
}

const t = computed(() => translations[lang.value])

export function useLang() {
  return { lang, setLang, t }
}
