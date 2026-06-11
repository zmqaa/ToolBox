/**
 * 颜色转换工具
 * 支持 Hex ↔ RGB ↔ HSL 实时互转 + 色块预览
 */

export interface RGB {
  r: number; g: number; b: number
}

export interface HSL {
  h: number; s: number; l: number
}

export interface ColorResult {
  hex: string
  rgb: string        // rgb(255, 128, 0)
  rgba: string       // rgba(255, 128, 0, 1)
  hsl: string        // hsl(30, 100%, 50%)
  hslValues: HSL
  rgbValues: RGB
}

/** 解析任意颜色输入 */
export function parseColor(input: string): ColorResult | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Hex
  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3,8})$/)
  if (hexMatch) {
    const hex = hexMatch[1]
    const expanded = expandHex(hex)
    const rgb = hexToRgb(expanded)
    if (!rgb) return null
    const hsl = rgbToHsl(rgb)
    return buildResult(rgb, hsl, `#${expanded}`)
  }

  // rgb / rgba
  const rgbMatch = trimmed.match(/^rgba?\s*\(\s*(\d+)\s*[,/\s]\s*(\d+)\s*[,/\s]\s*(\d+)\s*(?:[,/\s]\s*([\d.]+)\s*)?\)$/i)
  if (rgbMatch) {
    const rgb: RGB = {
      r: clamp(parseInt(rgbMatch[1]), 0, 255),
      g: clamp(parseInt(rgbMatch[2]), 0, 255),
      b: clamp(parseInt(rgbMatch[3]), 0, 255),
    }
    const hsl = rgbToHsl(rgb)
    return buildResult(rgb, hsl, `#${rgbToHex(rgb.r, rgb.g, rgb.b)}`)
  }

  // hsl / hsla
  const hslMatch = trimmed.match(/^hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i)
  if (hslMatch) {
    const hsl: HSL = {
      h: parseInt(hslMatch[1]) % 360,
      s: clamp(parseInt(hslMatch[2]), 0, 100),
      l: clamp(parseInt(hslMatch[3]), 0, 100),
    }
    const rgb = hslToRgb(hsl)
    return buildResult(rgb, hsl, `#${rgbToHex(rgb.r, rgb.g, rgb.b)}`)
  }

  // CSS 颜色名（常用）
  const named = NAMED_COLORS[trimmed.toLowerCase()]
  if (named) {
    const rgb = hexToRgb(named)
    if (!rgb) return null
    const hsl = rgbToHsl(rgb)
    return buildResult(rgb, hsl, `#${named}`)
  }

  return null
}

function buildResult(rgb: RGB, hsl: HSL, hex: string): ColorResult {
  return {
    hex,
    rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    rgba: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1)`,
    hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    hslValues: hsl,
    rgbValues: rgb,
  }
}

// ============ 核心转换 ============

function expandHex(hex: string): string {
  if (hex.length === 3) return hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
  if (hex.length === 4) return hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]+hex[3]+hex[3]
  if (hex.length === 6) return hex
  if (hex.length === 8) return hex
  return hex
}

function hexToRgb(hex: string): RGB | null {
  if (hex.length < 6) return null
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  return [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min

  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
  }
  h = Math.round(h * 60)
  if (h < 0) h += 360

  const l = (max + min) / 2
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1))

  return {
    h,
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function hslToRgb(hsl: HSL): RGB {
  const s = hsl.s / 100
  const l = hsl.l / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((hsl.h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0, g = 0, b = 0
  if (hsl.h < 60) { r = c; g = x }
  else if (hsl.h < 120) { r = x; g = c }
  else if (hsl.h < 180) { g = c; b = x }
  else if (hsl.h < 240) { g = x; b = c }
  else if (hsl.h < 300) { r = x; b = c }
  else { r = c; b = x }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

// ============ CSS 常用颜色名 ============

const NAMED_COLORS: Record<string, string> = {
  red: 'ff0000', green: '008000', blue: '0000ff', white: 'ffffff', black: '000000',
  gray: '808080', grey: '808080', silver: 'c0c0c0', maroon: '800000', purple: '800080',
  fuchsia: 'ff00ff', lime: '00ff00', olive: '808000', yellow: 'ffff00', navy: '000080',
  teal: '008080', aqua: '00ffff', orange: 'ffa500', pink: 'ffc0cb', coral: 'ff7f50',
  cyan: '00ffff', magenta: 'ff00ff', indigo: '4b0082', violet: 'ee82ee', tomato: 'ff6347',
  gold: 'ffd700', salmon: 'fa8072', khaki: 'f0e68c', plum: 'dda0dd', wheat: 'f5deb3',
  mint: '98fb98', lavender: 'e6e6fa', beige: 'f5f5dc', ivory: 'fffff0',
}

/** 判断背景色适合用深色还是浅色文字 */
export function contrastText(hex: string): '#000' | '#fff' {
  const rgb = hexToRgb(hex.replace('#', ''))
  if (!rgb) return '#000'
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255
  return luminance > 0.5 ? '#000' : '#fff'
}
