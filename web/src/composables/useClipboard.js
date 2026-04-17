/**
 * 复制文本到剪贴板
 * 优先使用 navigator.clipboard（需要 HTTPS 或 localhost）
 * 降级使用 document.execCommand('copy')（兼容 HTTP 环境）
 */
export function useClipboard() {
  function copyText(text) {
    // 现代方式：HTTPS / localhost 下可用
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text)
    }

    // 降级方式：创建临时 textarea 执行 execCommand
    return new Promise((resolve, reject) => {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0'
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
      try {
        const ok = document.execCommand('copy')
        document.body.removeChild(textarea)
        ok ? resolve() : reject(new Error('execCommand failed'))
      } catch (e) {
        document.body.removeChild(textarea)
        reject(e)
      }
    })
  }

  return { copyText }
}
