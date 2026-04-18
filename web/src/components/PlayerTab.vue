<template>
  <div class="player-wrap">
    <!-- NSFW warning -->
    <div class="nsfw-bar">{{ t.nsfw }}</div>

    <!-- Video -->
    <div class="video-shell">
      <video
        ref="videoEl"
        class="video-el"
        controls
        playsinline
        preload="metadata"
      />
      <!-- Loading overlay -->
      <Transition name="fade">
        <div v-if="buffering" class="video-overlay">
          <div class="buffer-spinner"/>
        </div>
      </Transition>
    </div>

    <!-- Controls -->
    <div class="ctrl-bar">
      <button class="toggle-btn" :class="{ active: autoplay }" @click="toggleAutoplay">
        <span class="toggle-track">
          <span class="toggle-thumb"/>
        </span>
        <span class="ctrl-label">{{ t.autoplay }}</span>
      </button>

      <button class="toggle-btn" :class="{ active: autoNext }" @click="toggleAutoNext">
        <span class="toggle-track">
          <span class="toggle-thumb"/>
        </span>
        <span class="ctrl-label">{{ t.autoNext }}</span>
      </button>

      <button class="next-btn" @click="loadNext">
        <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4">
          <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z"/>
        </svg>
        {{ t.next }}
      </button>
    </div>

    <!-- Source bar -->
    <div class="source-bar">
      <div class="source-info">
        <span class="source-dot"/>
        <span class="source-url">{{ currentUrl || '—' }}</span>
      </div>
      <button class="copy-btn" @click="copyUrl" :class="{ copied: justCopied }">
        <svg v-if="!justCopied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <rect x="9" y="9" width="13" height="13" rx="2"/>
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {{ justCopied ? t.copied : t.copy }}
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
const buffering = ref(false)
const justCopied = ref(false)
const autoplay = ref(localStorage.getItem('autoplay') === 'true')
const autoNext = ref(localStorage.getItem('autoNext') === 'true')
let hlsInstance = null
let loading = false

function saveAutoplay() { localStorage.setItem('autoplay', autoplay.value) }
function saveAutoNext() { localStorage.setItem('autoNext', autoNext.value) }
function toggleAutoplay() { autoplay.value = !autoplay.value; saveAutoplay() }
function toggleAutoNext() { autoNext.value = !autoNext.value; saveAutoNext() }

async function loadVideo() {
  if (loading) return
  loading = true
  buffering.value = true
  try {
    const res = await apiFetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEO}`)
    const data = await res.json()
    if (data?.url) {
      currentUrl.value = data.url
      playUrl(data.url, data.img_url)
    }
  } catch {
    show(t.value.videoError, true)
    buffering.value = false
  } finally {
    loading = false
  }
}

function playUrl(url, poster) {
  const video = videoEl.value
  if (!video) return

  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  video.onended = null

  if (poster) video.poster = poster

  const onReady = () => {
    buffering.value = false
    if (autoplay.value) video.play().catch(() => {})
  }

  if (url.includes('.m3u8')) {
    if (Hls.isSupported()) {
      hlsInstance = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 })
      hlsInstance.loadSource(url)
      hlsInstance.attachMedia(video)
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, onReady)
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url
      video.addEventListener('loadedmetadata', onReady, { once: true })
    } else {
      show(t.value.browserNotSupported, true)
      buffering.value = false
    }
  } else {
    video.src = url
    video.addEventListener('loadedmetadata', onReady, { once: true })
  }

  video.onended = () => { if (autoNext.value) loadNext() }
}

function loadNext() {
  currentUrl.value = ''
  buffering.value = true
  if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null }
  const video = videoEl.value
  if (video) { video.src = ''; video.poster = ''; video.onended = null }
  loadVideo()
}

function copyUrl() {
  if (!currentUrl.value) return
  copyText(currentUrl.value).then(() => {
    justCopied.value = true
    setTimeout(() => { justCopied.value = false }, 2000)
  }).catch(() => show(t.value.copyError, true))
}

watch(() => props.active, (val) => {
  if (val && !currentUrl.value) loadVideo()
})

onMounted(() => { if (props.active) loadVideo() })
onUnmounted(() => { if (hlsInstance) { hlsInstance.destroy(); hlsInstance = null } })
</script>

<style scoped>
.player-wrap {
  max-width: 56rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* NSFW */
.nsfw-bar {
  font-size: 0.75rem;
  color: #ef4444;
  font-weight: 700;
  text-align: center;
  padding: 6px 12px;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 8px;
}

/* Video shell */
.video-shell {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  border: 1px solid var(--border-color);
}

.video-el {
  width: 100%;
  height: calc(100vh - 380px);
  min-height: 240px;
  max-height: 560px;
  display: block;
  object-fit: contain;
}

/* Loading overlay */
.video-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.buffer-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Controls bar */
.ctrl-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--card-dark);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  flex-wrap: wrap;
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex: 1;
  min-width: 100px;
  padding: 7px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  transition: background 0.2s, border-color 0.2s, color 0.2s;
  text-align: left;
}

.toggle-btn:hover {
  background: rgba(var(--primary-color-rgb), 0.06);
  border-color: rgba(var(--primary-color-rgb), 0.3);
}

.toggle-btn.active {
  background: rgba(var(--primary-color-rgb), 0.12);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

/* Custom toggle track */
.toggle-track {
  position: relative;
  width: 36px;
  height: 20px;
  border-radius: 10px;
  background: var(--border-color);
  flex-shrink: 0;
  transition: background 0.25s;
}

.toggle-btn.active .toggle-track {
  background: var(--primary-color);
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.25s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.toggle-btn.active .toggle-thumb {
  transform: translateX(16px);
}

.ctrl-label {
  font-size: 0.85rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.next-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 8px;
  background: var(--primary-color);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  white-space: nowrap;
  margin-left: auto;
}

.next-btn:hover { opacity: 0.88; }
.next-btn:active { transform: scale(0.96); }

/* Source bar */
.source-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--card-dark);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  min-width: 0;
}

.source-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.source-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--primary-color);
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(var(--primary-color-rgb), 0.6);
}

.source-url {
  font-size: 0.78rem;
  font-family: ui-monospace, monospace;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 7px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.copy-btn.copied {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.1);
}

/* Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
