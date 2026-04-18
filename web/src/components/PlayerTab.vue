<template>
  <div class="max-w-4xl mx-auto">
    <div class="nsfw-warning mb-4 text-center">{{ t.nsfw }}</div>

    <div class="relative w-full">
      <video
        ref="videoEl"
        class="w-full h-auto"
        controls
        playsinline
        preload="metadata"
        :style="{ maxHeight: 'calc(100vh - 300px)', minHeight: '200px', background: '#000', objectFit: 'contain' }"
      />
    </div>

    <div class="video-controls flex justify-between items-center mt-4 mb-4">
      <div class="autoplay-toggle flex items-center">
        <input type="checkbox" id="autoplayToggle" class="hidden" v-model="autoplay" @change="saveAutoplay"/>
        <label for="autoplayToggle" class="cursor-pointer flex items-center">
          <span class="toggle-switch"/>
          <span class="ml-2">{{ t.autoplay }}</span>
        </label>
      </div>
      <div class="autoplay-toggle flex items-center">
        <input type="checkbox" id="autoNextToggle" class="hidden" v-model="autoNext" @change="saveAutoNext"/>
        <label for="autoNextToggle" class="cursor-pointer flex items-center">
          <span class="toggle-switch"/>
          <span class="ml-2">{{ t.autoNext }}</span>
        </label>
      </div>
      <button class="next-button px-6 py-2" @click="loadNext">{{ t.next }}</button>
    </div>

    <div class="video-source flex items-center rounded-lg p-3 text-sm">
      <div class="flex-grow overflow-hidden mr-2 min-w-0">
        <div class="source-label mb-1 opacity-70">{{ t.sourceUrl }}</div>
        <div class="source-url truncate font-mono">{{ currentUrl }}</div>
      </div>
      <button class="copy-button flex items-center px-3 py-1.5 rounded flex-shrink-0" @click="copyUrl">
        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/>
        </svg>
        {{ t.copy }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import Hls from 'hls.js'
import { useLang } from '../composables/useLang.js'
import { useNotification } from '../composables/useNotification.js'
import { useClipboard } from '../composables/useClipboard.js'
import API_CONFIG, { apiFetch } from '../config.js'

const props = defineProps({ active: Boolean })
const { t } = useLang()
const { show } = useNotification()
const { copyText } = useClipboard()

const videoEl = ref(null)
const currentUrl = ref('')
const autoplay = ref(localStorage.getItem('autoplay') === 'true')
const autoNext = ref(localStorage.getItem('autoNext') === 'true')
let hlsInstance = null
let loading = false

function saveAutoplay() { localStorage.setItem('autoplay', autoplay.value) }
function saveAutoNext() { localStorage.setItem('autoNext', autoNext.value) }

async function loadVideo() {
  if (loading) return
  loading = true
  show(t.value.loadingVideo)
  try {
    const res = await apiFetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEO}`)
    const data = await res.json()
    if (data?.url) {
      currentUrl.value = data.url
      playUrl(data.url, data.img_url)
    }
  } catch {
    show(t.value.videoError, true)
  } finally {
    loading = false
  }
}

function playUrl(url, poster) {
  const video = videoEl.value
  if (!video) return

  // cleanup
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  video.onended = null

  if (poster) video.poster = poster

  if (url.includes('.m3u8')) {
    if (Hls.isSupported()) {
      hlsInstance = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 })
      hlsInstance.loadSource(url)
      hlsInstance.attachMedia(video)
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoplay.value) video.play().catch(() => {})
      })
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      if (autoplay.value) video.play().catch(() => {})
    } else {
      show(t.value.browserNotSupported, true)
    }
  } else {
    video.src = url
    if (autoplay.value) video.play().catch(() => {})
  }

  video.onended = () => {
    if (autoNext.value) loadNext()
  }
}

function loadNext() {
  currentUrl.value = ''
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  const video = videoEl.value
  if (video) { video.src = ''; video.onended = null }
  loadVideo()
}

function copyUrl() {
  if (!currentUrl.value) return
  copyText(currentUrl.value)
    .then(() => show(t.value.copySuccess))
    .catch(() => show(t.value.copyError, true))
}

watch(() => props.active, (val) => {
  if (val && !currentUrl.value) loadVideo()
})

onMounted(() => {
  if (props.active) loadVideo()
})

onUnmounted(() => {
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
})
</script>
