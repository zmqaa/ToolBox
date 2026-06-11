/**
 * 密码生成器
 * 支持：
 * - 可调长度、字符集（大写/小写/数字/符号）
 * - 排除易混淆字符（0/O、1/l/I）
 * - 批量生成
 * - 强度指示
 */

export interface PasswordOptions {
  length: number
  upper: boolean
  lower: boolean
  digits: boolean
  symbols: boolean
  excludeAmbiguous: boolean
  count: number
}

export type Strength = 'weak' | 'fair' | 'good' | 'strong'

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const DIGITS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS = '0O1lI'

export function generatePasswords(opts: PasswordOptions): string[] {
  let pool = ''
  if (opts.upper) pool += UPPER
  if (opts.lower) pool += LOWER
  if (opts.digits) pool += DIGITS
  if (opts.symbols) pool += SYMBOLS

  // 排除易混淆字符
  if (opts.excludeAmbiguous) {
    pool = pool.split('').filter(c => !AMBIGUOUS.includes(c)).join('')
  }

  if (!pool) return []

  const results: string[] = []
  for (let n = 0; n < opts.count; n++) {
    let pw = ''
    // 确保每种选中的字符集至少出现一次
    const required: string[] = []
    if (opts.upper) required.push(...UPPER.split('').filter(c => pool.includes(c)))
    if (opts.lower) required.push(...LOWER.split('').filter(c => pool.includes(c)))
    if (opts.digits) required.push(...DIGITS.split('').filter(c => pool.includes(c)))
    if (opts.symbols) required.push(...SYMBOLS.split('').filter(c => pool.includes(c)))

    // 先用随机池填满
    for (let i = 0; i < opts.length; i++) {
      pw += pool[Math.floor(Math.random() * pool.length)]
    }

    // 保证每类至少一个：替换前面几个位置
    if (required.length > 0 && opts.length >= required.length) {
      const arr = pw.split('')
      for (let i = 0; i < required.length; i++) {
        arr[i] = required[i][Math.floor(Math.random() * required[i].length)]
      }
      // 打乱
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
      pw = arr.join('')
    }

    results.push(pw)
  }

  return results
}

/** 评估密码强度 */
export function evaluateStrength(password: string): { level: Strength; score: number } {
  let score = 0
  if (!password) return { level: 'weak', score: 0 }

  score += Math.min(password.length * 4, 40)          // 长度贡献
  if (/[A-Z]/.test(password)) score += 10
  if (/[a-z]/.test(password)) score += 10
  if (/\d/.test(password)) score += 10
  if (/[^A-Za-z0-9]/.test(password)) score += 15
  // 混合度奖励
  const types = [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length
  score += types * 5

  let level: Strength
  if (score >= 80) level = 'strong'
  else if (score >= 55) level = 'good'
  else if (score >= 30) level = 'fair'
  else level = 'weak'

  return { level, score: Math.min(100, score) }
}

export const STRENGTH_COLORS: Record<Strength, string> = {
  weak: '#dc2626',
  fair: '#f59e0b',
  good: '#10b981',
  strong: '#047857',
}

export const STRENGTH_LABELS: Record<Strength, string> = {
  weak: '弱',
  fair: '一般',
  good: '好',
  strong: '强',
}
