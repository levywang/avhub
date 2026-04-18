<template>
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="visible" class="api-dialog-overlay" @click.self="close">
        <div class="api-dialog">
          <!-- Icon -->
          <div class="api-dialog-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="7.5" cy="15.5" r="3.5"/>
              <path d="M11 12l9-9"/>
              <path d="M17 6l2 2"/>
              <path d="M20 3l1 1"/>
            </svg>
          </div>

          <!-- Title & desc -->
          <h3 class="api-dialog-title">
            {{ lang === 'zh' ? '需要 API Key' : 'API Key Required' }}
          </h3>
          <p class="api-dialog-desc">
            {{ lang === 'zh'
              ? '此服务已启用访问保护，请输入 API Key 继续访问。'
              : 'This service is protected. Enter your API Key to continue.' }}
          </p>

          <!-- Input -->
          <input
            ref="inputRef"
            v-model="keyInput"
            type="password"
            class="api-dialog-input"
            :placeholder="lang === 'zh' ? '输入 API Key...' : 'Enter API Key...'"
            @keypress.enter="confirm"
          />

          <!-- Actions -->
          <div class="api-dialog-actions">
            <button class="api-dialog-btn-cancel" @click="close">
              {{ lang === 'zh' ? '取消' : 'Cancel' }}
            </button>
            <button class="api-dialog-btn-confirm" @click="confirm">
              {{ lang === 'zh' ? '确认' : 'Confirm' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted } from 'vue'
import { setApiKey } from '../config.js'
import { useLang } from '../composables/useLang.js'

const { lang } = useLang()
const visible = ref(false)
const keyInput = ref('')
const inputRef = ref(null)

function open() {
  keyInput.value = ''
  visible.value = true
  nextTick(() => inputRef.value?.focus())
}

function confirm() {
  const key = keyInput.value.trim()
  if (!key) return
  setApiKey(key)
  visible.value = false
  window.location.reload()
}

function close() {
  visible.value = false
}

function onUnauthorized() {
  if (!visible.value) open()
}

onMounted(() => window.addEventListener('api-unauthorized', onUnauthorized))
onUnmounted(() => window.removeEventListener('api-unauthorized', onUnauthorized))
</script>

<style scoped>
.api-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 16px;
}

.api-dialog {
  background: var(--card-dark);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 36px 32px 28px;
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.4);
}

.api-dialog-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(var(--primary-color-rgb), 0.15);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.api-dialog-icon svg {
  width: 28px;
  height: 28px;
}

.api-dialog-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  text-align: center;
}

.api-dialog-desc {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-align: center;
  line-height: 1.6;
  margin-bottom: 24px;
}

.api-dialog-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--background-dark);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
  margin-bottom: 20px;
  box-sizing: border-box;
}

.api-dialog-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.15);
}

.api-dialog-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.api-dialog-btn-cancel,
.api-dialog-btn-confirm {
  flex: 1;
  padding: 11px 0;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: opacity 0.2s, transform 0.1s;
}

.api-dialog-btn-cancel {
  background: var(--background-dark);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
}

.api-dialog-btn-confirm {
  background: var(--primary-color);
  color: #fff;
}

.api-dialog-btn-cancel:hover { opacity: 0.8; }
.api-dialog-btn-confirm:hover { opacity: 0.9; }
.api-dialog-btn-confirm:active { transform: scale(0.97); }

/* Transition */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.25s ease;
}
.dialog-fade-enter-active .api-dialog,
.dialog-fade-leave-active .api-dialog {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}
.dialog-fade-enter-from .api-dialog {
  transform: scale(0.92) translateY(12px);
}
.dialog-fade-leave-to .api-dialog {
  transform: scale(0.95);
  opacity: 0;
}
</style>
