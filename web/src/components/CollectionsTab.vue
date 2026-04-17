<template>
  <div>
    <div class="flex items-center justify-between max-w-6xl mx-auto mb-4">
      <div class="collection-description">{{ t.linksUpdating }}</div>
      <button
        class="search-button px-4 py-2 text-sm"
        :disabled="refreshing"
        @click="refresh"
      >
        {{ refreshing ? t.refreshing : t.refreshCollections }}
      </button>
    </div>
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"/>
      <div class="loading-text">{{ t.loading }}</div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
      <div
        v-for="item in collections"
        :key="item.link"
        class="magnet-item p-6 rounded-xl"
      >
        <div class="flex flex-col gap-4">
          <h3 class="font-medium break-all">
            <a rel="nofollow" href="#" @click.prevent>{{ item.title }}</a>
          </h3>
          <button class="copy-button w-full px-4 py-2 rounded-lg text-sm font-medium" @click="copy(item.link)">
            {{ t.copyButton }}
          </button>
        </div>
      </div>
      <p v-if="!loading && collections.length === 0" class="text-center opacity-75 col-span-3">{{ t.noResults }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useLang } from '../composables/useLang.js'
import { useNotification } from '../composables/useNotification.js'
import API_CONFIG from '../config.js'

const { t } = useLang()
const { show } = useNotification()
const collections = ref([])
const loading = ref(false)
const refreshing = ref(false)

async function refresh() {
  refreshing.value = true
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/hacg/refresh`)
    const data = await res.json()
    if (data.status === 'succeed') {
      show(t.value.refreshSuccess)
      await load()
    } else {
      show(t.value.refreshError, true)
    }
  } catch {
    show(t.value.refreshError, true)
  } finally {
    refreshing.value = false
  }
}

async function load() {
  loading.value = true
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COLLECTIONS}`)
    const data = await res.json()
    const raw = data.data || data
    if (Array.isArray(raw)) {
      collections.value = raw
    } else if (typeof raw === 'object') {
      collections.value = Object.entries(raw).map(([title, link]) => ({ title, link }))
    }
  } catch {
    show(t.value.searchError, true)
  } finally {
    loading.value = false
  }
}

function copy(text) {
  navigator.clipboard.writeText(text)
    .then(() => show(t.value.copySuccess))
    .catch(() => show(t.value.copyError, true))
}

onMounted(load)
</script>
