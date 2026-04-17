<template>
  <div class="notification" :class="{ show: visible, error: isError }">
    <svg v-if="!isError" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
    </svg>
    <svg v-else fill="none" stroke="currentColor" viewBox="0 0 24 24" class="w-5 h-5">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
    <span>{{ message }}</span>
  </div>
</template>

<script setup>
import { useNotification } from '../composables/useNotification.js'
const { message, visible, isError } = useNotification()
</script>
