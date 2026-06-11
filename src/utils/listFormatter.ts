/**
 * 列值拼接工具
 * 将一列数据（换行/逗号/空格分隔）按指定格式输出
 *
 * 场景：
 * - SQL IN 子句：'a', 'b', 'c'
 * - JSON 数组：["a", "b", "c"]
 * - 纯逗号拼接：a, b, c
 * - 自定义前缀/后缀
 */

export type WrapMode = 'single' | 'double' | 'backtick' | 'none' | 'custom'
export type JoinMode = 'comma-space' | 'comma' | 'newline' | 'semicolon' | 'space' | 'tab' | 'custom'
export type OutputPreset = 'sql-in' | 'json-array' | 'bare' | 'markdown'

export const PRESET_LABELS: Record<OutputPreset, string> = {
  'sql-in': 'SQL IN()',
  'json-array': 'JSON 数组',
  'bare': '纯拼接',
  'markdown': 'Markdown',
}

export interface ListFormatOptions {
  wrapMode: WrapMode
  customQuote: string
  joinMode: JoinMode
  customSep: string
  trim: boolean
  skipEmpty: boolean
  dedupe: boolean
  sort: 'none' | 'asc' | 'desc'
  prefix: string
  suffix: string
  /** 当 preset=json-array 时自动加 [] */
  preset: OutputPreset
}

export function getDefaultOptions(): ListFormatOptions {
  return {
    wrapMode: 'single',
    customQuote: '',
    joinMode: 'comma-space',
    customSep: '',
    trim: true,
    skipEmpty: true,
    dedupe: false,
    sort: 'none',
    prefix: '',
    suffix: '',
    preset: 'sql-in',
  }
}

const WRAP_CHARS: Record<WrapMode, string> = {
  single: "'",
  double: '"',
  backtick: '`',
  none: '',
  custom: '',
}

const JOIN_CHARS: Record<JoinMode, string> = {
  'comma-space': ', ',
  'comma': ',',
  'newline': '\n',
  'semicolon': '; ',
  'space': ' ',
  'tab': '\t',
  'custom': '',
}

/**
 * 智能分割输入字符串为值列表
 * 自动检测分隔符（换行 > 逗号 > 分号 > 空格 > tab）
 * 会清理每项末尾残留的逗号/分号（常见于 CSV 导出或 SQL 结果）
 */
export function splitValues(input: string): string[] {
  const trimmed = input.trim()
  if (!trimmed) return []

  // 检测主要分隔符
  const newlineCount = (trimmed.match(/\n/g) || []).length
  const commaCount = (trimmed.match(/,/g) || []).length
  const semicolonCount = (trimmed.match(/;/g) || []).length
  const tabCount = (trimmed.match(/\t/g) || []).length

  let values: string[]

  // 换行存在时优先按行分割（每行可能自带逗号）
  if (newlineCount > 0) {
    values = trimmed.split(/\n+/)
    // 清理每项：去掉首尾空格、末尾逗号和分号
    values = values.map(v => v.trim().replace(/[,;]+$/, '').trim())
  } else if (commaCount > 0) {
    // 逗号分隔
    values = trimmed.split(/,/).map(v => v.trim())
  } else if (semicolonCount > 0) {
    // 分号分隔
    values = trimmed.split(/;\s*/).map(v => v.trim())
  } else if (tabCount > 0) {
    values = trimmed.split(/\t+/)
  } else {
    // 空格
    values = trimmed.split(/\s+/)
  }

  return values
}

/**
 * 应用格式化选项
 */
export function formatList(input: string, opts: ListFormatOptions): string {
  let values = splitValues(input)

  if (opts.trim) values = values.map(v => v.trim())
  if (opts.skipEmpty) values = values.filter(v => v.length > 0)
  if (opts.dedupe) values = [...new Set(values)]
  if (opts.sort === 'asc') values.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  if (opts.sort === 'desc') values.sort((a, b) => b.localeCompare(a, 'zh-CN'))

  const wrapChar = opts.wrapMode === 'custom' ? opts.customQuote : WRAP_CHARS[opts.wrapMode]
  const joinChar = opts.joinMode === 'custom' ? opts.customSep : JOIN_CHARS[opts.joinMode]

  let wrapped = values.map(v => {
    let result = v
    if (opts.prefix) result = opts.prefix + result
    if (opts.suffix) result = result + opts.suffix
    if (wrapChar) result = wrapChar + result + wrapChar
    return result
  })

  let output = wrapped.join(joinChar)

  // JSON 数组模式：加括号
  if (opts.preset === 'json-array') {
    output = `[${output}]`
  }

  return output
}

/**
 * 应用预设
 */
export function applyPreset(preset: OutputPreset): Partial<ListFormatOptions> {
  switch (preset) {
    case 'sql-in':
      return { wrapMode: 'single', joinMode: 'comma-space', preset: 'sql-in', prefix: '', suffix: '' }
    case 'json-array':
      return { wrapMode: 'double', joinMode: 'comma-space', preset: 'json-array', prefix: '', suffix: '' }
    case 'bare':
      return { wrapMode: 'none', joinMode: 'comma-space', preset: 'bare', prefix: '', suffix: '' }
    case 'markdown':
      return { wrapMode: 'none', joinMode: 'newline', preset: 'markdown', prefix: '- ', suffix: '' }
  }
}
