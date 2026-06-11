import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { parseColor } from '@/utils/color'
import type { ColorResult } from '@/utils/color'

export const useColorStore = defineStore('color', () => {
  const inputText = ref('')
  const result = ref<ColorResult | null>(null)
  const error = ref<string | null>(null)

  const hasInput = computed(() => inputText.value.trim().length > 0)
  const hasResult = computed(() => result.value !== null)

  function setInput(value: string) {
    inputText.value = value
    const r = parseColor(value)
    if (r) {
      result.value = r
      error.value = null
    } else if (value.trim()) {
      result.value = null
      error.value = '无法识别该颜色格式，支持：#hex、rgb()、rgba()、hsl()、颜色名(red, blue...)'
    } else {
      result.value = null
      error.value = null
    }
  }

  function copy(value: string) {
    navigator.clipboard.writeText(value)
  }

  function clear() {
    inputText.value = ''
    result.value = null
    error.value = null
  }

  return {
    inputText,
    result,
    error,
    hasInput,
    hasResult,
    setInput,
    copy,
    clear,
  }
})
