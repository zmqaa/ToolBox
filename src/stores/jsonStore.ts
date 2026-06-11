import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { JsonValue, JsonParseResult } from '@/types'
import { parseJson, formatJson, minifyJson } from '@/utils/jsonParser'

export const useJsonStore = defineStore('json', () => {
  const rawString = ref('')
  const error = ref<string | null>(null)
  const errorLine = ref(0)
  const errorColumn = ref(0)

  const parsedData = computed<JsonValue | null>(() => {
    if (!rawString.value.trim()) {
      return null
    }
    const result = parseJson(rawString.value)
    if (result.success) {
      error.value = null
      errorLine.value = 0
      errorColumn.value = 0
      return result.data
    } else {
      error.value = result.error
      errorLine.value = result.line
      errorColumn.value = result.column
      return null
    }
  })

  const formattedJson = computed(() => {
    if (!rawString.value.trim()) return ''
    return formatJson(rawString.value)
  })

  const isValid = computed(() => parsedData.value !== null && rawString.value.trim() !== '')
  const hasContent = computed(() => rawString.value.trim().length > 0)

  const lineCount = computed(() => {
    if (!rawString.value.trim()) return 0
    const formatted = formatJson(rawString.value)
    return formatted ? formatted.split('\n').length : 0
  })

  const byteSize = computed(() => {
    return new Blob([rawString.value]).size
  })

  const parseResult = computed<JsonParseResult>(() => {
    if (!rawString.value.trim()) {
      return { success: false, error: 'No input', line: 0, column: 0 }
    }
    return parseJson(rawString.value)
  })

  function setRawString(value: string) {
    rawString.value = value
  }

  function doFormat() {
    const formatted = formatJson(rawString.value)
    if (formatted) {
      rawString.value = formatted
    }
  }

  function doMinify() {
    const minified = minifyJson(rawString.value)
    if (minified) {
      rawString.value = minified
    }
  }

  function clear() {
    rawString.value = ''
  }

  function copyFormatted() {
    const text = formatJson(rawString.value) || rawString.value
    navigator.clipboard.writeText(text)
  }

  return {
    rawString,
    error,
    errorLine,
    errorColumn,
    parsedData,
    formattedJson,
    isValid,
    hasContent,
    lineCount,
    byteSize,
    parseResult,
    setRawString,
    doFormat,
    doMinify,
    clear,
    copyFormatted,
  }
})
