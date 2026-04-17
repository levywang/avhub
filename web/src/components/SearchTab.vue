<template>
  <div>
    <!-- Hot searches -->
    <div class="max-w-2xl mx-auto mb-4">
      <div class="hot-searches flex items-center gap-2 text-sm flex-wrap">
        <span class="label-text opacity-70">{{ t.hotSearches }}</span>
        <button
          v-for="term in hotSearches"
          :key="term"
          class="hot-tag"
          @click="searchWithTerm(term)"
        >{{ term }}</button>
      </div>
    </div>

    <!-- Search box -->
    <div class="max-w-2xl mx-auto mb-8">
      <div class="flex gap-2">
        <input
          v-model="searchInput"
          type="text"
          class="flex-1 px-4 py-2"
          :placeholder="t.searchPlaceholder"
          @keypress.enter="doSearch"
        />
        <button class="search-button px-6 py-2 min-w-[100px]" @click="doSearch">
          {{ t.searchButton }}
        </button>
      </div>
    </div>

    <!-- Sort + cover toggle -->
    <div class="max-w-4xl mx-auto mb-4 flex justify-between items-center">
      <div class="cover-toggle flex items-center">
        <input type="checkbox" id="coverToggle" class="hidden" v-model="showCover" @change="onCoverToggle"/>
        <label for="coverToggle" class="cursor-pointer flex items-center">
          <span class="toggle-switch"/>
          <span class="ml-2">{{ t.showCover }}</span>
        </label>
      </div>
      <div class="relative" ref="sortRef">
        <button class="settings-button theme-toggle" @click="sortOpen = !sortOpen">
          <span v-html="SORT_OPTIONS[sortType].icon"/>
          <span class="ml-2">{{ SORT_OPTIONS[sortType].label[lang] }}</span>
        </button>
        <div v-if="sortOpen" class="sort-menu">
          <button
            v-for="(opt, key) in SORT_OPTIONS"
            :key="key"
            class="theme-menu-item"
            :data-active="sortType === key"
            @click="selectSort(key)"
          >
            <span v-html="opt.icon"/>
            <span class="ml-1">{{ opt.label[lang] }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Cover image -->
    <div
      v-if="coverUrl && showCover"
      class="cover-image-container card-3d"
      ref="coverRef"
      @click="openModal"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
      @mouseenter="onMouseEnter"
    >
      <img :src="coverUrl" class="cover-image" :class="{ loaded: coverLoaded }" alt="封面图片" @load="coverLoaded = true" @error="coverUrl = ''"/>
    </div>

    <!-- Results -->
    <div class="max-w-4xl mx-auto space-y-3">
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"/>
        <div class="loading-text">{{ t.loading }}</div>
      </div>
      <p v-else-if="searched && sortedResults.length === 0" class="text-center opacity-75">{{ t.noResults }}</p>
      <div
        v-for="item in sortedResults"
        :key="item.magnet"
        class="magnet-item p-6 rounded-xl"
      >
        <div class="flex flex-col gap-4">
          <h3 class="font-medium break-all">
            <a rel="nofollow" href="#" @click.prevent>{{ item.title }}</a>
          </h3>
          <div class="flex flex-wrap gap-2">
            <div v-for="tag in item.tags" :key="tag.type" class="tag" :data-type="tag.type">
              {{ getTagLabel(tag.type) }}
            </div>
          </div>
          <p class="text-sm opacity-75">{{ t.size }}: {{ item.size }} | {{ t.date }}: {{ item.date }}</p>
          <button class="copy-button w-full px-4 py-2 rounded-lg text-sm font-medium" @click="copy(item.magnet)">
            {{ t.copyButton }}
          </button>
        </div>
      </div>
    </div>

    <!-- Image modal -->
    <div v-if="modalOpen" class="image-modal" :class="{ active: modalActive }" @click="closeModal">
      <div class="modal-content" @click.stop>
        <img :src="coverUrl" class="modal-image fullwidth-preview" alt="大图预览"/>
        <button class="modal-close" @click="closeModal">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useLang } from '../composables/useLang.js'
import { useNotification } from '../composables/useNotification.js'
import { SORT_OPTIONS } from '../i18n.js'
import API_CONFIG from '../config.js'

const { lang, t } = useLang()
const { show } = useNotification()

const searchInput = ref('')
const loading = ref(false)
const searched = ref(false)
const results = ref([])
const hotSearches = ref([])
const coverUrl = ref('')
const coverLoaded = ref(false)
const showCover = ref(localStorage.getItem('showCover') !== 'false')
const sortType = ref('tags-desc')
const sortOpen = ref(false)
const sortRef = ref(null)
const coverRef = ref(null)
const modalOpen = ref(false)
const modalActive = ref(false)

// Tag extraction - 按优先级定义顺序
const TAG_MAP = {
  'HD':          { type: 'hd',          priority: 1 },
  'FHD':         { type: 'hd',          priority: 1 },
  '高清':        { type: 'hd',          priority: 1 },
  '字幕':        { type: 'subtitle',    priority: 2 },
  '-C':          { type: 'subtitle',    priority: 2 },
  'sub':         { type: 'subtitle',    priority: 2 },
  'SUB':         { type: 'subtitle',    priority: 2 },
  '無修正':      { type: 'uncensored',  priority: 3 },
  '无码':        { type: 'uncensored',  priority: 3 },
  'uncensored':  { type: 'uncensored',  priority: 3 },
  '中文':        { type: 'chinese',     priority: 4 },
  'ch':          { type: 'chinese',     priority: 4 },
  'CH':          { type: 'chinese',     priority: 4 },
  'chinese':     { type: 'chinese',     priority: 4 },
  '破解':        { type: 'leak',        priority: 5 },
  'leak':        { type: 'leak',        priority: 5 },
  'LEAK':        { type: 'leak',        priority: 5 },
}

const TAG_LABELS = {
  hd:          { zh: '高清', en: 'HD' },
  subtitle:    { zh: '字幕', en: 'SUB' },
  uncensored:  { zh: '无码', en: 'Uncensored' },
  chinese:     { zh: '中文', en: 'Chinese' },
  leak:        { zh: '破解', en: 'Leaked' }
}

function extractTags(title) {
  const found = new Map()
  const lower = title.toLowerCase()
  for (const [kw, { type, priority }] of Object.entries(TAG_MAP)) {
    if (!found.has(type) && lower.includes(kw.toLowerCase())) {
      found.set(type, priority)
    }
  }
  return [...found.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([type]) => ({ type }))
}

function getTagLabel(type) {
  return TAG_LABELS[type]?.[lang.value] ?? type
}

function parseSize(s) {
  s = String(s).trim()
  const m = s.match(/^([\d.]+)\s*([KMGT]?B)$/i)
  if (!m) return 0
  const v = parseFloat(m[1])
  switch (m[2].toUpperCase()) {
    case 'KB': return v * 1024
    case 'MB': return v * 1024 ** 2
    case 'GB': return v * 1024 ** 3
    case 'TB': return v * 1024 ** 4
    default: return v
  }
}

const sortedResults = computed(() => {
  const arr = [...results.value]
  switch (sortType.value) {
    case 'tags-desc': return arr.sort((a, b) => b.tags.length - a.tags.length)
    case 'date-desc': return arr.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    case 'date-asc':  return arr.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0))
    case 'size-desc': return arr.sort((a, b) => parseSize(b.size) - parseSize(a.size))
    case 'size-asc':  return arr.sort((a, b) => parseSize(a.size) - parseSize(b.size))
    default: return arr
  }
})

async function fetchHotSearches() {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HOT_SEARCHES}`)
    const data = await res.json()
    hotSearches.value = Array.isArray(data) ? data : (data.data || [])
  } catch {}
}

function searchWithTerm(term) {
  searchInput.value = term
  doSearch()
}

async function doSearch() {
  const term = searchInput.value.replace(/\s+/g, '').trim()
  const regex = /^[A-Za-z][\w\s-]*\d$/
  if (!term || !regex.test(term)) {
    show(t.value.emptySearchWarning, true)
    return
  }
  loading.value = true
  searched.value = true
  results.value = []
  coverUrl.value = ''
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}/${term}`)
    const data = await res.json()
    if (Array.isArray(data.data) && data.data.length > 0) {
      const parsed = data.data.map(r => {
        if (Array.isArray(r)) return r
        try { return JSON.parse(r.replace(/'/g, '"')) } catch { return null }
      }).filter(Boolean)
      const seen = new Set()
      results.value = parsed.filter(r => {
        if (seen.has(r[0])) return false
        seen.add(r[0]); return true
      }).map(([magnet, title, size, date]) => ({
        magnet, title, size, date, tags: extractTags(title)
      }))
      setTimeout(() => loadCover(term), 300)
    }
  } catch {
    show(t.value.searchError, true)
  } finally {
    loading.value = false
  }
}

function loadCover(term) {
  if (!showCover.value) return
  const m = term.match(/([a-zA-Z]+)[-]?(\d+)/i)
  if (!m) return
  const prefix = m[1].toLowerCase()
  const number = m[2].padStart(3, '0')
  const imgUrl = `https://fourhoi.com/${prefix}-${number}/cover-n.jpg`
  coverUrl.value = `${API_CONFIG.BASE_URL}/img_proxy?url=${encodeURIComponent(imgUrl)}`
  coverLoaded.value = false
}

function onCoverToggle() {
  localStorage.setItem('showCover', showCover.value)
  if (!showCover.value) coverUrl.value = ''
  else if (searchInput.value) loadCover(searchInput.value)
}

function selectSort(key) { sortType.value = key; sortOpen.value = false }

function copy(text) {
  navigator.clipboard.writeText(text)
    .then(() => show(t.value.copySuccess))
    .catch(() => show(t.value.copyError, true))
}

// Modal
function openModal() {
  modalOpen.value = true
  setTimeout(() => { modalActive.value = true }, 10)
}
function closeModal() {
  modalActive.value = false
  setTimeout(() => { modalOpen.value = false }, 300)
}

// 3D card effect
function onMouseMove(e) {
  const card = coverRef.value
  if (!card) return
  const rect = card.getBoundingClientRect()
  const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
  const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
  const rotateX = dy * -12
  const rotateY = dx * 12
  card.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03,1.03,1.03)`
  // 图片视差偏移
  const img = card.querySelector('img')
  if (img) img.style.transform = `translateX(${dx * -8}px) translateY(${dy * -8}px) scale(1.05)`
  // 动态光晕跟随鼠标
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  card.style.setProperty('--shine-x', `${x}%`)
  card.style.setProperty('--shine-y', `${y}%`)
  card.classList.add('shining')
}
function onMouseLeave() {
  const card = coverRef.value
  if (!card) return
  card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease'
  card.style.transform = 'perspective(1500px) rotateX(0) rotateY(0) scale3d(1,1,1)'
  card.classList.remove('shining')
  const img = card.querySelector('img')
  if (img) {
    img.style.transition = 'transform 0.5s ease'
    img.style.transform = ''
  }
  setTimeout(() => { if (card) card.style.transition = '' }, 500)
}
function onMouseEnter() {
  const card = coverRef.value
  if (!card) return
  card.style.transition = 'transform 0.15s ease-out, box-shadow 0.3s ease'
  const img = card.querySelector('img')
  if (img) img.style.transition = 'transform 0.15s ease-out, opacity 0.3s ease'
}

// Close sort menu on outside click
function onClickOutside(e) {
  if (sortRef.value && !sortRef.value.contains(e.target)) sortOpen.value = false
}

// ESC close modal
function onKeydown(e) {
  if (e.key === 'Escape') closeModal()
}

onMounted(() => {
  fetchHotSearches()
  document.addEventListener('click', onClickOutside)
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
  document.removeEventListener('keydown', onKeydown)
})
</script>
