import { ref } from 'vue'

export function useCopy() {
  const justCopied = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      justCopied.value = true
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        justCopied.value = false
      }, 1500)
    } catch {
      // 降级：fallback 不处理
    }
  }

  return { copy, justCopied }
}
