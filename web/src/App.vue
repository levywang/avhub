<template>
  <div class="min-h-screen flex flex-col">
    <Logo />
    <SettingsBar />

    <main class="container mx-auto px-4 pt-20 pb-8 flex-1">
      <!-- Tab Nav -->
      <div class="flex justify-center mb-8">
        <div class="tab-container">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-button"
            :class="{ active: currentTab === tab.key }"
            @click="currentTab = tab.key"
          >{{ t[tab.labelKey] }}</button>
        </div>
      </div>

      <SearchTab v-show="currentTab === 'search'" />
      <CollectionsTab v-show="currentTab === 'collections'" />
      <PlayerTab v-show="currentTab === 'player'" :active="currentTab === 'player'" />
    </main>

    <BackToTop />
    <Notification />
    <ApiKeyDialog />

    <footer class="text-center py-4 text-gray-400 text-xs mt-8">
      <p>{{ t.copyright }} © {{ currentYear }} <a href="#" class="text-primary hover:opacity-80">AvHub</a></p>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useLang } from './composables/useLang.js'
import Logo from './components/Logo.vue'
import SettingsBar from './components/SettingsBar.vue'
import SearchTab from './components/SearchTab.vue'
import CollectionsTab from './components/CollectionsTab.vue'
import PlayerTab from './components/PlayerTab.vue'
import BackToTop from './components/BackToTop.vue'
import Notification from './components/Notification.vue'
import ApiKeyDialog from './components/ApiKeyDialog.vue'

const { t } = useLang()
const currentTab = ref('search')
const currentYear = computed(() => new Date().getFullYear())

const tabs = [
  { key: 'search', labelKey: 'search' },
  { key: 'collections', labelKey: 'collections' },
  { key: 'player', labelKey: 'player' }
]
</script>
