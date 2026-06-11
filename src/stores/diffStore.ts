import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  computeDiff,
  getStats,
  detectDiffMode,
  computeObjectDiff,
  computeArrayDiff,
  tryParseJson,
} from '@/utils/diff'
import type { DiffLine, DiffStats, JsonDiffMode, JsonFieldDiff, JsonItemDiff } from '@/utils/diff'

export const useDiffStore = defineStore('diff', () => {
  const leftText = ref('')
  const rightText = ref('')

  // ----- mode detection -----
  const diffMode = computed<JsonDiffMode>(() => detectDiffMode(leftText.value, rightText.value))

  // ----- line diff (fallback) -----
  const lineDiffResult = computed<DiffLine[]>(() => {
    if (diffMode.value !== 'line') return []
    return computeDiff(leftText.value, rightText.value)
  })

  const lineStats = computed<DiffStats>(() => getStats(lineDiffResult.value))

  // ----- JSON object diff -----
  const objectFields = computed<JsonFieldDiff[]>(() => {
    if (diffMode.value !== 'json-object') return []
    const l = tryParseJson(leftText.value) as Record<string, unknown>
    const r = tryParseJson(rightText.value) as Record<string, unknown>
    return computeObjectDiff(l, r)
  })

  // ----- JSON array diff -----
  const arrayItems = computed<JsonItemDiff[]>(() => {
    if (diffMode.value !== 'json-array') return []
    const l = tryParseJson(leftText.value) as unknown[]
    const r = tryParseJson(rightText.value) as unknown[]
    return computeArrayDiff(l, r)
  })

  // ----- aggregate stats -----
  const jsonStats = computed(() => {
    if (diffMode.value === 'json-object') {
      const fields = objectFields.value
      let added = 0, removed = 0, changed = 0, unchanged = 0
      for (const f of fields) {
        if (f.type === 'added') added++
        else if (f.type === 'removed') removed++
        else if (f.type === 'changed') changed++
        else unchanged++
      }
      return { added, removed, changed, unchanged }
    }
    if (diffMode.value === 'json-array') {
      const items = arrayItems.value
      let added = 0, removed = 0, matched = 0
      let fieldAdded = 0, fieldRemoved = 0, fieldChanged = 0, fieldUnchanged = 0
      for (const item of items) {
        if (item.type === 'added') added++
        else if (item.type === 'removed') removed++
        else matched++
        for (const f of item.fields) {
          if (f.type === 'added') fieldAdded++
          else if (f.type === 'removed') fieldRemoved++
          else if (f.type === 'changed') fieldChanged++
          else fieldUnchanged++
        }
      }
      return { added, removed, matched, fieldAdded, fieldRemoved, fieldChanged, fieldUnchanged }
    }
    const stats = lineStats.value
    return { added: stats.added, removed: stats.removed, unchanged: stats.unchanged, lineCount: stats.total }
  })

  // ----- helpers -----
  const hasInput = computed(() => leftText.value.trim().length > 0 || rightText.value.trim().length > 0)

  const modeLabel = computed(() => {
    if (diffMode.value === 'json-array') return 'JSON 数组'
    if (diffMode.value === 'json-object') return 'JSON 对象'
    return '纯文本'
  })

  function setLeft(v: string) { leftText.value = v }
  function setRight(v: string) { rightText.value = v }
  function swap() {
    const tmp = leftText.value; leftText.value = rightText.value; rightText.value = tmp
  }
  function clear() { leftText.value = ''; rightText.value = '' }

  return {
    leftText, rightText,
    diffMode, modeLabel,
    lineDiffResult, lineStats,
    objectFields, arrayItems,
    jsonStats,
    hasInput,
    setLeft, setRight, swap, clear,
  }
})
