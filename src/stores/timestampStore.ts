import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { parseInput, getCurrentTimestamp, formatLocal, formatISO } from '@/utils/timestamp'
import type { TimestampResult, Precision } from '@/utils/timestamp'

export const useTimestampStore = defineStore('timestamp', () => {
  const inputText = ref('')
  const result = ref<TimestampResult | null>(null)
  const precision = ref<Precision>('second')

  const hasInput = computed(() => inputText.value.trim().length > 0)
  const hasResult = computed(() => result.value !== null && result.value.success)

  /** 按当前精度格式化后的本地时间 */
  const formattedLocal = computed(() => {
    if (!result.value?.success) return ''
    const ms = result.value.unixMilliseconds
    return formatLocal(new Date(ms), precision.value)
  })

  /** 按当前精度格式化后的 ISO */
  const formattedISO = computed(() => {
    if (!result.value?.success) return ''
    const ms = result.value.unixMilliseconds
    return formatISO(new Date(ms), precision.value)
  })

  function setInput(value: string) {
    inputText.value = value
    result.value = parseInput(value)
  }

  function setPrecision(p: Precision) {
    precision.value = p
  }

  function setNow() {
    result.value = getCurrentTimestamp()
    inputText.value = String(result.value.unixSeconds)
  }

  function clear() {
    inputText.value = ''
    result.value = null
    precision.value = 'second'
  }

  function copy(value: string | number) {
    navigator.clipboard.writeText(String(value))
  }

  return {
    inputText,
    result,
    precision,
    hasInput,
    hasResult,
    formattedLocal,
    formattedISO,
    setInput,
    setPrecision,
    setNow,
    clear,
    copy,
  }
})
