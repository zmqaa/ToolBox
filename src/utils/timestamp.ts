/**
 * 时间戳转换工具
 * 支持：
 * - Unix 时间戳（秒/毫秒） → 可读日期
 * - 日期字符串 / 紧凑数字日期 → Unix 时间戳
 * - 输出精度控制（秒/分/时/日/月）
 */

export type TimestampUnit = 'second' | 'millisecond'

/** 输出精度 */
export type Precision = 'second' | 'minute' | 'hour' | 'day' | 'month'

export const PRECISION_LABELS: Record<Precision, string> = {
  second: '秒',
  minute: '分',
  hour:   '时',
  day:    '日',
  month:  '月',
}

export interface TimestampResult {
  success: boolean
  /** Unix 时间戳（秒） */
  unixSeconds: number
  /** Unix 时间戳（毫秒） */
  unixMilliseconds: number
  /** ISO 8601 格式（受精度影响） */
  iso8601: string
  /** 本地时间字符串 */
  localString: string
  /** UTC 时间字符串 */
  utcString: string
  /** 相对时间描述 */
  relative: string
  /** 用于识别的类型标签 */
  sourceType: string
  error: string | null
}

/**
 * 自动检测时间戳是秒还是毫秒
 * 以 1_000_000_000_000（2001-09-09）为分界
 */
export function detectUnit(ts: number): TimestampUnit {
  return ts > 1_000_000_000_000 ? 'millisecond' : 'second'
}

function toMilliseconds(ts: number, unit?: TimestampUnit): number {
  const u = unit ?? detectUnit(ts)
  return u === 'second' ? ts * 1000 : ts
}

/** 获取当前时间戳信息 */
export function getCurrentTimestamp(): TimestampResult {
  return parseTimestamp(Date.now(), 'millisecond')
}

// ============ 智能输入识别 ============

/**
 * 判断纯数字字符串是否更可能是日期而非时间戳
 *
 * 规则：
 * - 8 位，以 19/20 开头        → YYYYMMDD
 * - 14 位，以 19/20 开头       → YYYYMMDDHHMMSS
 * - 10 位（10^9 ~ 2^31-1）     → Unix 秒时间戳
 * - 13 位（10^12 ~ 2^41-1）    → Unix 毫秒时间戳
 * - 其余纯数字                 → 尝试日期解析，失败则作时间戳
 */
function looksLikeDateNumber(s: string): boolean {
  // 8 位：YYYYMMDD
  if (s.length === 8 && /^(19|20)\d{6}$/.test(s)) return true
  // 14 位：YYYYMMDDHHMMSS
  if (s.length === 14 && /^(19|20)\d{12}$/.test(s)) return true
  // 6 位：YYYYMM（不常见但合理）
  if (s.length === 6 && /^(19|20)\d{4}$/.test(s)) return true
  return false
}

/**
 * 将紧凑数字日期字符串（如 "20260501"）转为 ISO 格式
 */
function expandCompactDate(s: string): string | null {
  if (s.length === 8 && /^(19|20)\d{6}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
  }
  if (s.length === 14 && /^(19|20)\d{12}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}`
  }
  if (s.length === 6 && /^(19|20)\d{4}$/.test(s)) {
    return `${s.slice(0, 4)}-${s.slice(4, 6)}`
  }
  return null
}

/**
 * 智能解析输入
 */
export function parseInput(input: string): TimestampResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { ...emptyResult(), error: null }
  }

  // 纯数字
  if (/^-?\d+$/.test(trimmed)) {
    // 优先判断是否为紧凑日期格式
    if (looksLikeDateNumber(trimmed)) {
      const iso = expandCompactDate(trimmed)
      if (iso) return parseDateString(iso, `紧凑日期 · ${trimmed}`)
    }

    // 当作时间戳
    const ts = parseInt(trimmed, 10)
    return parseTimestamp(ts)
  }

  // 非纯数字 → 日期字符串
  return parseDateString(trimmed, '日期字符串')
}

// ============ 解析 & 格式化 ============

export function parseTimestamp(ts: number, unit?: TimestampUnit): TimestampResult {
  try {
    const ms = toMilliseconds(ts, unit)
    const date = new Date(ms)

    if (isNaN(date.getTime())) {
      return { ...emptyResult(), error: '无效的时间戳' }
    }

    const u = unit ?? detectUnit(ts)
    return buildResult(date, u === 'second' ? 'Unix 秒时间戳' : 'Unix 毫秒时间戳')
  } catch {
    return { ...emptyResult(), error: '时间戳解析失败' }
  }
}

export function parseDateString(input: string, sourceLabel?: string): TimestampResult {
  try {
    const trimmed = input.trim()
    if (!trimmed) {
      return { ...emptyResult(), error: '请输入日期字符串' }
    }

    const date = new Date(trimmed)

    if (isNaN(date.getTime())) {
      return { ...emptyResult(), error: '无法解析该日期，支持 ISO 8601、"2026-05-01"、"2026/05/01 12:00" 等格式' }
    }

    return buildResult(date, sourceLabel ?? '日期字符串')
  } catch {
    return { ...emptyResult(), error: '日期解析失败' }
  }
}

// ============ 格式化辅助 ============

function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

/**
 * 根据精度格式化本地时间字符串
 */
export function formatLocal(date: Date, precision: Precision): string {
  const y = date.getFullYear()
  const mo = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const mi = pad(date.getMinutes())
  const s = pad(date.getSeconds())

  switch (precision) {
    case 'month':  return `${y}-${mo}`
    case 'day':    return `${y}-${mo}-${d}`
    case 'hour':   return `${y}-${mo}-${d} ${h}:00`
    case 'minute': return `${y}-${mo}-${d} ${h}:${mi}`
    case 'second':
    default:       return `${y}-${mo}-${d} ${h}:${mi}:${s}`
  }
}

/**
 * 根据精度格式化 ISO 8601
 */
export function formatISO(date: Date, precision: Precision): string {
  const y = date.getFullYear()
  const mo = pad(date.getMonth() + 1)
  const d = pad(date.getDate())
  const h = pad(date.getHours())
  const mi = pad(date.getMinutes())
  switch (precision) {
    case 'month':  return `${y}-${mo}`
    case 'day':    return `${y}-${mo}-${d}`
    case 'hour':   return `${y}-${mo}-${d}T${h}:00:00Z`
    case 'minute': return `${y}-${mo}-${d}T${h}:${mi}:00Z`
    case 'second':
    default:       return date.toISOString()
  }
}

function buildResult(date: Date, sourceType: string): TimestampResult {
  const ms = date.getTime()
  return {
    success: true,
    unixSeconds: Math.floor(ms / 1000),
    unixMilliseconds: ms,
    iso8601: date.toISOString(),
    localString: formatLocal(date, 'second'),
    utcString: date.toUTCString(),
    relative: formatRelative(ms),
    sourceType,
    error: null,
  }
}

// ============ 相对时间 ============

function formatRelative(ms: number): string {
  const now = Date.now()
  const diff = now - ms
  const abs = Math.abs(diff)
  const isPast = diff >= 0

  const seconds = Math.floor(abs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  let relative: string
  if (seconds < 5) {
    relative = '刚刚'
  } else if (seconds < 60) {
    relative = `${seconds} 秒`
  } else if (minutes < 60) {
    relative = `${minutes} 分钟`
  } else if (hours < 24) {
    relative = `${hours} 小时`
  } else if (days < 30) {
    relative = `${days} 天`
  } else if (days < 365) {
    relative = `${Math.floor(days / 30)} 个月`
  } else {
    relative = `${Math.floor(days / 365)} 年`
  }

  return isPast ? `${relative}前` : `${relative}后`
}

function emptyResult(): TimestampResult {
  return {
    success: false,
    unixSeconds: 0,
    unixMilliseconds: 0,
    iso8601: '',
    localString: '',
    utcString: '',
    relative: '',
    sourceType: '',
    error: null,
  }
}
