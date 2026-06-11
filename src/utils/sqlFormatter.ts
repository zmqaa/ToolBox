/**
 * SQL 格式化工具 — 支持 MySQL
 * 功能：关键词大小写、子句换行缩进、字段分行可选、保留函数调用格式
 */

// 全部关键词（用于大小写转换）
const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'ALTER',
  'DROP', 'TABLE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA', 'TRIGGER',
  'PROCEDURE', 'FUNCTION', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
  'CROSS', 'FULL', 'ON', 'AS', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
  'OFFSET', 'UNION', 'ALL', 'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE',
  'END', 'ASC', 'DESC', 'BETWEEN', 'LIKE', 'EXISTS', 'IF', 'COUNT',
  'SUM', 'AVG', 'MAX', 'MIN', 'COALESCE', 'CAST', 'CONVERT', 'USING',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'CASCADE', 'DEFAULT',
  'CHECK', 'UNIQUE', 'AUTO_INCREMENT', 'ENGINE', 'CHARSET', 'COLLATE',
  'COMMENT', 'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'START',
  'GRANT', 'REVOKE', 'WITH', 'TRUNCATE', 'RENAME', 'EXPLAIN', 'ANALYZE',
  'DESCRIBE', 'SHOW', 'USE', 'REPLACE', 'LOAD', 'DATA', 'INFILE',
  'TEMPORARY', 'IFNULL', 'NULLIF', 'GREATEST', 'LEAST', 'CONCAT',
  'SUBSTRING', 'TRIM', 'LENGTH', 'NOW', 'CURDATE', 'CURTIME',
  'DATE_FORMAT', 'DATEDIFF', 'TIMESTAMPDIFF', 'EXTRACT', 'YEAR',
  'MONTH', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'INTERVAL',
  'OVER', 'PARTITION', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD',
  'INT', 'VARCHAR', 'TEXT', 'BOOLEAN', 'TINYINT', 'SMALLINT', 'MEDIUMINT',
  'BIGINT', 'DECIMAL', 'FLOAT', 'DOUBLE', 'DATE', 'DATETIME', 'TIMESTAMP',
  'TIME', 'CHAR', 'ENUM', 'JSON', 'BLOB', 'LONGTEXT', 'MEDIUMTEXT',
])

// 需要换行的子句起始关键词
const CLAUSE_START = new Set([
  'SELECT', 'FROM', 'WHERE', 'ORDER', 'GROUP', 'HAVING',
  'LIMIT', 'OFFSET', 'UNION', 'INSERT', 'VALUES', 'UPDATE',
  'SET', 'DELETE', 'CREATE', 'ALTER', 'DROP', 'WITH', 'BEGIN',
])

// JOIN 类（比 SELECT 缩进多一级）
const JOIN_KEYWORDS = new Set([
  'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'CROSS', 'FULL',
])

// 连续关键词对（不拆行），second 不触发新行
const CONTINUATION: Record<string, string[]> = {
  'INSERT': ['INTO'],
  'LEFT': ['JOIN', 'OUTER'],
  'RIGHT': ['JOIN', 'OUTER'],
  'INNER': ['JOIN'],
  'OUTER': ['JOIN'],
  'CROSS': ['JOIN'],
  'FULL': ['JOIN'],
  'ORDER': ['BY'],
  'GROUP': ['BY'],
  'AUTO': ['INCREMENT'],
  'PRIMARY': ['KEY'],
  'FOREIGN': ['KEY'],
  'IF': ['NOT', 'NULL'],
  'ROW': ['NUMBER'],
  'DENSE': ['RANK'],
  'DATE': ['FORMAT'],
}

// 缩进后置：这些词之后的内容多缩进一级
const INDENT_AFTER = new Set([
  'SELECT', 'FROM', 'WHERE', 'ORDER', 'GROUP', 'HAVING',
  'SET', 'ON', 'WHEN', 'ELSE', 'THEN',
])

// 不需要前导空格的符号
const NO_SPACE_BEFORE = new Set([')', ',', ';', '.'])
// 不需要后置空格的符号
const NO_SPACE_AFTER = new Set(['(', '.'])
// 函数类关键词（后面跟 ( 无空格）
const FUNC_KEYWORDS = new Set([
  'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'COALESCE', 'CAST', 'CONVERT',
  'NOW', 'CURDATE', 'CURTIME', 'DATE_FORMAT', 'DATEDIFF', 'TIMESTAMPDIFF',
  'EXTRACT', 'IFNULL', 'NULLIF', 'GREATEST', 'LEAST', 'CONCAT',
  'SUBSTRING', 'TRIM', 'LENGTH', 'YEAR', 'MONTH', 'DAY', 'HOUR',
  'MINUTE', 'SECOND', 'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'LAG', 'LEAD',
  'IF', 'GROUP_CONCAT', 'JSON_EXTRACT', 'JSON_UNQUOTE',
])

export type KeywordCase = 'upper' | 'lower'
export type ColumnWrap = 'line' | 'wrap'

export interface FormatOptions {
  keywordCase: KeywordCase
  indentSize: number
  columnWrap: ColumnWrap   // line=每行一个字段, wrap=满行换行
  maxLineWidth: number     // wrap 模式下的最大行宽
}

// ============ 入口 ============

export function formatSql(input: string, options: FormatOptions): { result: string; error: string | null } {
  try {
    const tokens = tokenize(input)
    const result = reconstruct(tokens, options)
    return { result, error: null }
  } catch (e) {
    return { result: '', error: (e as Error).message || '格式化失败' }
  }
}

// ============ 词法分析 ============

interface Token {
  type: 'word' | 'string' | 'number' | 'symbol' | 'comment' | 'ws'
  value: string
  raw: string
  upper: string   // 大写形式（用于匹配关键词）
}

function tokenize(sql: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < sql.length) {
    const ch = sql[i]

    // 空白
    if (/\s/.test(ch)) {
      let ws = ''
      while (i < sql.length && /\s/.test(sql[i])) { ws += sql[i]; i++ }
      tokens.push({ type: 'ws', value: ' ', raw: ws, upper: ' ' })
      continue
    }

    // 单行注释 --
    if (ch === '-' && sql[i + 1] === '-') {
      let c = '--'
      i += 2
      while (i < sql.length && sql[i] !== '\n') { c += sql[i]; i++ }
      tokens.push({ type: 'comment', value: c, raw: c, upper: c })
      continue
    }

    // 多行注释 /* */
    if (ch === '/' && sql[i + 1] === '*') {
      let c = '/*'
      i += 2
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) { c += sql[i]; i++ }
      if (i < sql.length) { c += '*/'; i += 2 }
      tokens.push({ type: 'comment', value: c, raw: c, upper: c })
      continue
    }

    // 字符串
    if (ch === "'" || ch === '"') {
      const quote = ch
      let s = quote; i++
      while (i < sql.length) {
        if (sql[i] === '\\') { s += sql[i] + (sql[i + 1] || ''); i += 2 }
        else if (sql[i] === quote) {
          s += sql[i]; i++
          if (sql[i] === quote) { s += sql[i]; i++; continue }
          break
        } else { s += sql[i]; i++ }
      }
      tokens.push({ type: 'string', value: s, raw: s, upper: s })
      continue
    }

    // 反引号标识符
    if (ch === '`') {
      let s = '`'; i++
      while (i < sql.length && sql[i] !== '`') { s += sql[i]; i++ }
      if (i < sql.length) { s += '`'; i++ }
      tokens.push({ type: 'string', value: s, raw: s, upper: s })
      continue
    }

    // 数字
    if (/\d/.test(ch) || (ch === '.' && i + 1 < sql.length && /\d/.test(sql[i + 1]))) {
      let n = ''
      while (i < sql.length && /[\d.eE+\-]/.test(sql[i])) { n += sql[i]; i++ }
      tokens.push({ type: 'number', value: n, raw: n, upper: n })
      continue
    }

    // 标点/运算符
    if (/[(),;.=<>!+\-*/%]/.test(ch)) {
      let op = ch; i++
      // 复合运算符
      if (i < sql.length) {
        const two = op + sql[i]
        if (['<=', '>=', '<>', '!=', '||', '::'].includes(two)) { op = two; i++ }
      }
      tokens.push({ type: 'symbol', value: op, raw: op, upper: op })
      continue
    }

    // 单词
    if (/[a-zA-Z_]/.test(ch)) {
      let w = ''
      while (i < sql.length && /[a-zA-Z0-9_]/.test(sql[i])) { w += sql[i]; i++ }
      tokens.push({ type: 'word', value: w, raw: w, upper: w.toUpperCase() })
      continue
    }

    // fallback
    tokens.push({ type: 'symbol', value: ch, raw: ch, upper: ch })
    i++
  }

  return tokens
}

// ============ 格式化重建 ============

function reconstruct(tokens: Token[], opts: FormatOptions): string {
  const indent = ' '.repeat(opts.indentSize)
  let out = ''
  let level = 0           // 当前缩进级别
  let needNewline = true  // 下一个内容是否需要先换行
  let needSpace = false   // 下一个内容前是否需要空格
  let prevNonWs: Token | null = null

  // 辅助：输出文本
  function emit(s: string) {
    out += s
  }

  // 辅助：换行 + 缩进
  function newline(lvl?: number) {
    const l = lvl ?? level
    out += '\n' + indent.repeat(Math.max(0, l))
    needNewline = false
    needSpace = false
  }

  // 辅助：输出空格（如果需要）
  function space() {
    if (!needSpace) return
    if (prevNonWs && NO_SPACE_AFTER.has(prevNonWs.value)) return
    out += ' '
    needSpace = false
  }

  // 辅助：获取当前行长度（从最后一次换行算起）
  function currentLineLen(): number {
    const idx = out.lastIndexOf('\n')
    return idx === -1 ? out.length : out.length - idx - 1
  }

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]

    // === 空白 ===
    if (tok.type === 'ws') {
      needSpace = true
      continue
    }

    // === 注释 ===
    if (tok.type === 'comment') {
      if (out.length > 0 && !out.endsWith('\n')) {
        out += '\n' + indent.repeat(Math.max(0, level))
      }
      out += tok.value
      newline(level)
      continue
    }

    // === 判断关键词属性 ===
    const isKw = tok.type === 'word' && KEYWORDS.has(tok.upper)
    const isClauseStart = isKw && CLAUSE_START.has(tok.upper)
    const isJoin = isKw && JOIN_KEYWORDS.has(tok.upper)

    // 检查是否复合关键词的第二部分（不换行）
    const isContinuation = prevNonWs?.type === 'word' &&
      CONTINUATION[prevNonWs.upper]?.includes(tok.upper)

    // === 标点：左括号 ===
    if (tok.value === '(') {
      // 函数关键词后直接跟 ( 无空格；表名/其他标识符保留空格
      if (prevNonWs?.type === 'word' && FUNC_KEYWORDS.has(prevNonWs.upper)) {
        needSpace = false
      }
      space()
      emit('(')
      level++
      needNewline = false
      needSpace = false
      prevNonWs = tok
      continue
    }

    // === 标点：右括号 ===
    if (tok.value === ')') {
      level = Math.max(0, level - 1)
      // 去掉前导空格
      needSpace = false
      // 如果刚刚换行了，回退缩进一级再输出 )
      if (out.endsWith('\n' + indent.repeat(level + 1))) {
        out = out.slice(0, -(indent.length)) // 回退一级缩进
      }
      emit(')')
      needNewline = false
      needSpace = true // 后面可能需要空格（如 WHERE）
      prevNonWs = tok
      continue
    }

    // === 标点：逗号 ===
    if (tok.value === ',') {
      needSpace = false
      emit(',')
      if (opts.columnWrap === 'line') {
        newline(level)
      } else {
        // wrap: 当前行超宽时换行，否则逗号后空格继续
        if (currentLineLen() >= opts.maxLineWidth) {
          newline(level)
        } else {
          needSpace = true
          needNewline = false
        }
      }
      prevNonWs = tok
      continue
    }

    // === 标点：分号 ===
    if (tok.value === ';') {
      needSpace = false
      emit(';')
      emit('\n')
      level = 0
      needNewline = true
      needSpace = false
      prevNonWs = tok
      continue
    }

    // === 标点：点号（表名.字段名） ===
    if (tok.value === '.') {
      needSpace = false
      emit('.')
      needSpace = false
      prevNonWs = tok
      continue
    }

    // === 其他标点/运算符 ===
    if (tok.type === 'symbol') {
      // 消除前导空格
      if (NO_SPACE_BEFORE.has(tok.value)) {
        needSpace = false
      }
      space()
      emit(tok.value)
      needNewline = false
      needSpace = !NO_SPACE_AFTER.has(tok.value)
      prevNonWs = tok
      continue
    }

    // === 子句起始关键词 ===
    if (isClauseStart && !isContinuation) {
      // 在第一个 SELECT 之前不加空行
      if (tok.upper === 'SELECT' || tok.upper === 'INSERT' || tok.upper === 'UPDATE' ||
          tok.upper === 'DELETE' || tok.upper === 'CREATE' || tok.upper === 'ALTER' ||
          tok.upper === 'DROP' || tok.upper === 'WITH' || tok.upper === 'BEGIN' ||
          tok.upper === 'VALUES') {
        if (out.length > 0) out += '\n'
        level = 0
        newline(0)
      } else if (isJoin) {
        // JOIN 类：在当前缩进的基础上换行
        if (!out.endsWith('\n')) out += '\n'
        newline(Math.max(0, level))
      } else {
        // WHERE, ORDER, GROUP, HAVING, LIMIT, OFFSET, UNION, SET
        if (!out.endsWith('\n')) out += '\n'
        level = 0
        newline(0)
      }

      emit(applyCase(tok.value, opts.keywordCase, isKw))
      needNewline = false
      needSpace = true

      // 缩进后置
      if (INDENT_AFTER.has(tok.upper) && tok.upper !== 'ON') {
        level++
      }
      // JOIN 的 ON 需要缩进
      if (isJoin) {
        level++
      }
      prevNonWs = tok
      continue
    }

    // === 单词（非子句起始关键词 或 continuation） ===
    if (tok.type === 'word') {
      // 检查是否需要换行
      if (needNewline) {
        newline(level)
      } else {
        space()
      }

      emit(applyCase(tok.value, opts.keywordCase, isKw))

      // ON 之后缩进（用于 JOIN ... ON 模式）
      if (tok.upper === 'ON' && isKw) {
        level++
      }
      // AND/OR 在 WHERE 后换行
      if ((tok.upper === 'AND' || tok.upper === 'OR') && isKw && opts.columnWrap === 'line') {
        newline(level)
      }

      needNewline = false
      needSpace = true
      prevNonWs = tok
      continue
    }

    // === 数字 ===
    if (tok.type === 'number') {
      if (needNewline) { newline(level) } else { space() }
      emit(tok.value)
      needNewline = false
      needSpace = true
      prevNonWs = tok
      continue
    }

    // === 字符串 ===
    if (tok.type === 'string') {
      if (needNewline) { newline(level) } else { space() }
      emit(tok.value)
      needNewline = false
      needSpace = true
      prevNonWs = tok
      continue
    }
  }

  return out.trim()
}

function applyCase(value: string, kc: KeywordCase, isKw: boolean): string {
  if (!isKw) return value
  return kc === 'upper' ? value.toUpperCase() : value.toLowerCase()
}
