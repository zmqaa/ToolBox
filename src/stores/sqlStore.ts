import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { KeywordCase, ColumnWrap } from '@/utils/sqlFormatter'
import { formatSql } from '@/utils/sqlFormatter'

export const useSqlStore = defineStore('sql', () => {
  const rawString = ref('')
  const keywordCase = ref<KeywordCase>('upper')
  const indentSize = ref(2)
  const columnWrap = ref<ColumnWrap>('wrap')
  const maxLineWidth = ref(80)

  function makeOpts() {
    return {
      keywordCase: keywordCase.value,
      indentSize: indentSize.value,
      columnWrap: columnWrap.value,
      maxLineWidth: maxLineWidth.value,
    }
  }

  const formattedSql = computed(() => {
    if (!rawString.value.trim()) return ''
    const { result, error } = formatSql(rawString.value, makeOpts())
    return error ? '' : result
  })

  const error = computed(() => {
    if (!rawString.value.trim()) return null
    const { error: err } = formatSql(rawString.value, makeOpts())
    return err
  })

  const hasContent = computed(() => rawString.value.trim().length > 0)
  const isValid = computed(() => hasContent.value && error.value === null)

  const columnWrapLabel = computed(() => {
    return columnWrap.value === 'line' ? '每行一个' : '自然换行'
  })

  function setRawString(value: string) {
    rawString.value = value
  }

  function setKeywordCase(kc: KeywordCase) {
    keywordCase.value = kc
  }

  function toggleColumnWrap() {
    columnWrap.value = columnWrap.value === 'wrap' ? 'line' : 'wrap'
  }

  function copyFormatted() {
    if (formattedSql.value) {
      navigator.clipboard.writeText(formattedSql.value)
    }
  }

  function clear() {
    rawString.value = ''
  }

  return {
    rawString,
    keywordCase,
    indentSize,
    columnWrap,
    maxLineWidth,
    columnWrapLabel,
    formattedSql,
    error,
    hasContent,
    isValid,
    setRawString,
    setKeywordCase,
    toggleColumnWrap,
    copyFormatted,
    clear,
  }
})
