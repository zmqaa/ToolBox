import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'
import { formatList, applyPreset, getDefaultOptions } from '@/utils/listFormatter'
import type { ListFormatOptions, OutputPreset, WrapMode, JoinMode } from '@/utils/listFormatter'
import { PRESET_LABELS } from '@/utils/listFormatter'

export const useListStore = defineStore('list', () => {
  const inputText = ref('')
  const opts = reactive<ListFormatOptions>(getDefaultOptions())

  const outputText = computed(() => {
    if (!inputText.value.trim()) return ''
    return formatList(inputText.value, { ...opts })
  })

  const hasInput = computed(() => inputText.value.trim().length > 0)
  const hasOutput = computed(() => outputText.value.length > 0)

  function setInput(value: string) {
    inputText.value = value
  }

  function setPreset(preset: OutputPreset) {
    Object.assign(opts, applyPreset(preset))
  }

  function setWrapMode(mode: WrapMode) {
    opts.wrapMode = mode
  }

  function setJoinMode(mode: JoinMode) {
    opts.joinMode = mode
  }

  function toggle(key: 'trim' | 'skipEmpty' | 'dedupe') {
    opts[key] = !opts[key]
  }

  function setSort(dir: 'none' | 'asc' | 'desc') {
    opts.sort = dir
  }

  function copyOutput() {
    if (outputText.value) {
      navigator.clipboard.writeText(outputText.value)
    }
  }

  function clear() {
    inputText.value = ''
    Object.assign(opts, getDefaultOptions())
  }

  return {
    inputText,
    opts,
    outputText,
    hasInput,
    hasOutput,
    PRESET_LABELS,
    setInput,
    setPreset,
    setWrapMode,
    setJoinMode,
    toggle,
    setSort,
    copyOutput,
    clear,
  }
})
