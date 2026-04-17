import { ref } from 'vue'

const message = ref('')
const visible = ref(false)
const isError = ref(false)
let timer = null

export function useNotification() {
  function show(msg, error = false) {
    message.value = msg
    isError.value = error
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => { visible.value = false }, 3000)
  }

  return { message, visible, isError, show }
}
