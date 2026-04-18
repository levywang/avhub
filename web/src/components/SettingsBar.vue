<template>
  <div class="settings-container">
    <!-- API Key -->
    <div class="relative" ref="keyRef">
      <button class="settings-button" @click="keyOpen = !keyOpen" aria-label="API Key">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="7.5" cy="15.5" r="3.5"/>
          <path d="M11 12l9-9"/>
          <path d="M17 6l2 2"/>
          <path d="M20 3l1 1"/>
        </svg>
      </button>
      <div v-if="keyOpen" class="theme-menu" style="min-width:220px; padding: 12px;">
        <div class="text-xs opacity-60 mb-2">API Key</div>
        <input
          v-model="apiKeyInput"
          type="password"
          class="w-full px-3 py-1.5 rounded text-sm mb-2"
          placeholder="输入 API Key"
          @keypress.enter="saveApiKey"
        />
        <button class="search-button w-full py-1.5 text-sm" @click="saveApiKey">保存</button>
      </div>
    </div>

    <!-- Language -->
    <div class="relative" ref="langRef">
      <button class="settings-button" @click="langOpen = !langOpen" aria-label="Language">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0014.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/>
        </svg>
      </button>
      <div v-if="langOpen" class="theme-menu language-menu">
        <button
          v-for="(label, key) in { zh: '中文', en: 'English' }"
          :key="key"
          class="theme-menu-item"
          :data-active="lang === key"
          @click="selectLang(key)"
        >
          <svg v-if="lang === key" class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span v-else class="w-4 h-4 flex-shrink-0 inline-block"/>
          <span>{{ label }}</span>
        </button>
      </div>
    </div>

    <!-- Theme -->
    <div class="relative" ref="themeRef">
      <button class="settings-button theme-toggle" @click="themeOpen = !themeOpen" aria-label="Theme">
        <span v-html="THEMES[theme]?.icon" class="flex items-center"/>
      </button>
      <div v-if="themeOpen" class="theme-menu">
        <button
          v-for="(info, key) in THEMES"
          :key="key"
          class="theme-menu-item"
          :data-active="theme === key"
          @click="selectTheme(key)"
        >
          <span v-html="info.icon" class="flex-shrink-0" :style="{ color: themeColors[key] }"/>
          <span class="theme-label">{{ info.label[lang] }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useTheme } from '../composables/useTheme.js'
import { useLang } from '../composables/useLang.js'
import { THEMES } from '../i18n.js'
import { getApiKey, setApiKey } from '../config.js'

const { theme, applyTheme } = useTheme()
const { lang, setLang } = useLang()

const langOpen = ref(false)
const themeOpen = ref(false)
const keyOpen = ref(false)
const langRef = ref(null)
const themeRef = ref(null)
const keyRef = ref(null)
const apiKeyInput = ref(getApiKey())

function saveApiKey() {
  setApiKey(apiKeyInput.value.trim())
  keyOpen.value = false
}

const themeColors = {
  dark: '#94a3b8',
  light: '#fbbf24',
  emerald: '#10b981',
  ocean: '#3b82f6',
  amethyst: '#8b5cf6'
}

function selectLang(l) { setLang(l); langOpen.value = false }
function selectTheme(t) { applyTheme(t); themeOpen.value = false }

function onClickOutside(e) {
  if (langRef.value && !langRef.value.contains(e.target)) langOpen.value = false
  if (themeRef.value && !themeRef.value.contains(e.target)) themeOpen.value = false
  if (keyRef.value && !keyRef.value.contains(e.target)) keyOpen.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>
