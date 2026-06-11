import type { JsonValue, JsonParseResult } from '@/types'

/**
 * 解析 JSON 字符串，返回带行号列号的错误信息
 */
export function parseJson(input: string): JsonParseResult {
  try {
    const data = JSON.parse(input)
    const formatted = JSON.stringify(data, null, 2)
    return {
      success: true,
      data: data as JsonValue,
      formatted,
      lineCount: formatted.split('\n').length,
      size: new Blob([input]).size,
    }
  } catch (e) {
    if (e instanceof SyntaxError) {
      const match = e.message.match(/position\s+(\d+)/)
      const pos = match ? parseInt(match[1], 10) : 0
      const { line, column } = getLineColumn(input, pos)
      return {
        success: false,
        error: e.message.replace(/^JSON\.parse:\s*/, ''),
        line,
        column,
      }
    }
    return {
      success: false,
      error: 'Unknown parse error',
      line: 0,
      column: 0,
    }
  }
}

/**
 * 根据字符位置计算行号和列号
 */
function getLineColumn(input: string, pos: number): { line: number; column: number } {
  const lines = input.substring(0, pos).split('\n')
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  }
}

/**
 * 格式化 JSON（美化输出）
 */
export function formatJson(input: string): string {
  try {
    const data = JSON.parse(input)
    return JSON.stringify(data, null, 2)
  } catch {
    return ''
  }
}

/**
 * 压缩 JSON（去掉空白）
 */
export function minifyJson(input: string): string {
  try {
    const data = JSON.parse(input)
    return JSON.stringify(data)
  } catch {
    return ''
  }
}

/**
 * 获取 JSON 节点的类型标签
 */
export function getJsonType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

/**
 * 判断是否为对象或数组（可展开节点）
 */
export function isExpandable(value: unknown): boolean {
  if (value === null) return false
  return typeof value === 'object'
}

/**
 * 获取对象/数组的子节点数量
 */
export function getChildCount(value: unknown): number {
  if (Array.isArray(value)) return value.length
  if (value && typeof value === 'object') return Object.keys(value).length
  return 0
}
