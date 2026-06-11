/**
 * JSON 语法高亮 — 将 JSON 字符串转为带 class 的 HTML
 * 颜色通过 CSS 变量控制，支持浅色/深色模式
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 对已格式化的 JSON 进行语法高亮
 * 返回带 <span class="json-xxx"> 的 HTML 字符串
 */
export function highlightJson(json: string): string {
  // 对整段 JSON 做 token 化处理
  let result = ''

  // 正则匹配 JSON 的各个 token
  const tokenRegex = /("(?:[^"\\]|\\.)*")\s*(:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(\btrue\b|\bfalse\b)|(\bnull\b)|([{}[\],:]|\s+)/g

  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = tokenRegex.exec(json)) !== null) {
    // 添加未匹配的文本
    if (match.index > lastIndex) {
      result += escapeHtml(json.substring(lastIndex, match.index))
    }

    if (match[1]) {
      // 字符串 key 或 value
      if (match[2]) {
        // 后面跟冒号 = key
        result += `<span class="json-key">${escapeHtml(match[1])}</span>${escapeHtml(match[2])}`
      } else {
        // 值是字符串
        result += `<span class="json-string">${escapeHtml(match[1])}</span>`
      }
    } else if (match[3]) {
      // 数字
      result += `<span class="json-number">${match[3]}</span>`
    } else if (match[4]) {
      // boolean
      result += `<span class="json-boolean">${match[4]}</span>`
    } else if (match[5]) {
      // null
      result += `<span class="json-null">${match[5]}</span>`
    } else if (match[6]) {
      // 括号、逗号、空白
      result += escapeHtml(match[6])
    }

    lastIndex = tokenRegex.lastIndex
  }

  // 剩余文本
  if (lastIndex < json.length) {
    result += escapeHtml(json.substring(lastIndex))
  }

  return result
}

/**
 * 简单高亮单行 JSON 值（用于树节点叶子值）
 */
export function highlightValue(value: unknown): { html: string; type: string } {
  if (value === null) {
    return { html: '<span class="json-null">null</span>', type: 'null' }
  }
  if (typeof value === 'string') {
    return { html: `<span class="json-string">"${escapeHtml(value)}"</span>`, type: 'string' }
  }
  if (typeof value === 'number') {
    return { html: `<span class="json-number">${value}</span>`, type: 'number' }
  }
  if (typeof value === 'boolean') {
    return { html: `<span class="json-boolean">${value}</span>`, type: 'boolean' }
  }
  return { html: '', type: 'unknown' }
}
