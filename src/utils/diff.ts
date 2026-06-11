// ============================================================
//  Line diff (LCS-based) — fallback for plain text
// ============================================================

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged'
  content: string
  oldLineNumber?: number
  newLineNumber?: number
}

export interface DiffStats {
  added: number
  removed: number
  unchanged: number
  total: number
}

export function computeDiff(oldText: string, newText: string): DiffLine[] {
  const a = oldText ? oldText.split('\n') : []
  const b = newText ? newText.split('\n') : []

  const m = a.length
  const n = b.length
  const dp = buildLcsTable(a, b, m, n)

  const result: DiffLine[] = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.unshift({ type: 'unchanged', content: a[i - 1], oldLineNumber: i, newLineNumber: j })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ type: 'added', content: b[j - 1], newLineNumber: j })
      j--
    } else {
      result.unshift({ type: 'removed', content: a[i - 1], oldLineNumber: i })
      i--
    }
  }
  return result
}

function buildLcsTable(a: string[], b: string[], m: number, n: number): Uint16Array[] {
  const dp: Uint16Array[] = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1))
  for (let i = 1; i <= m; i++) {
    const prev = dp[i - 1]
    const curr = dp[i]
    const ai = a[i - 1]
    for (let j = 1; j <= n; j++) {
      if (ai === b[j - 1]) curr[j] = prev[j - 1] + 1
      else curr[j] = prev[j] >= curr[j - 1] ? prev[j] : curr[j - 1]
    }
  }
  return dp
}

export function getStats(lines: DiffLine[]): DiffStats {
  let added = 0, removed = 0, unchanged = 0
  for (const l of lines) {
    if (l.type === 'added') added++
    else if (l.type === 'removed') removed++
    else unchanged++
  }
  return { added, removed, unchanged, total: lines.length }
}

// ============================================================
//  JSON structured diff
// ============================================================

export type JsonDiffMode = 'line' | 'json-object' | 'json-array'

export interface JsonFieldDiff {
  key: string
  type: 'added' | 'removed' | 'changed' | 'unchanged'
  oldValue?: unknown
  newValue?: unknown
}

export interface JsonItemDiff {
  matchKey: string
  type: 'matched' | 'added' | 'removed'
  itemIndex: number  // index in the original array
  fields: JsonFieldDiff[]
}

export interface JsonDiffResult {
  mode: 'json-object' | 'json-array'
  fields?: JsonFieldDiff[]          // for object vs object
  items?: JsonItemDiff[]            // for array vs array
}

/** Try to parse a string as JSON. Returns null if not valid JSON object/array. */
export function tryParseJson(text: string): unknown | null {
  const t = text.trim()
  if (!t) return null
  if (t.startsWith('{') || t.startsWith('[')) {
    try { return JSON.parse(t) } catch { return null }
  }
  return null
}

/** Detect the appropriate diff mode for two text inputs. */
export function detectDiffMode(left: string, right: string): JsonDiffMode {
  const l = tryParseJson(left)
  const r = tryParseJson(right)
  if (l === null || r === null) return 'line'
  if (Array.isArray(l) && Array.isArray(r)) return 'json-array'
  if (isPlainObject(l) && isPlainObject(r)) return 'json-object'
  return 'line'
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

/** Compare two JSON objects field by field. */
export function computeObjectDiff(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
): JsonFieldDiff[] {
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)])
  const fields: JsonFieldDiff[] = []

  for (const key of allKeys) {
    const inOld = key in oldObj
    const inNew = key in newObj

    if (!inOld) {
      fields.push({ key, type: 'added', newValue: newObj[key] })
    } else if (!inNew) {
      fields.push({ key, type: 'removed', oldValue: oldObj[key] })
    } else if (!jsonValueEqual(oldObj[key], newObj[key])) {
      fields.push({ key, type: 'changed', oldValue: oldObj[key], newValue: newObj[key] })
    } else {
      fields.push({ key, type: 'unchanged', oldValue: oldObj[key], newValue: newObj[key] })
    }
  }

  // Sort: changed/added/removed first, then unchanged
  return fields.sort((a, b) => {
    const rank = (t: string) => t === 'unchanged' ? 2 : t === 'changed' ? 0 : 1
    return rank(a.type) - rank(b.type)
  })
}

/** Compare two JSON arrays with smart item matching. */
export function computeArrayDiff(
  oldArr: unknown[],
  newArr: unknown[],
): JsonItemDiff[] {
  const oldObjs = oldArr.filter(isPlainObject) as Record<string, unknown>[]
  const newObjs = newArr.filter(isPlainObject) as Record<string, unknown>[]

  // If all items are plain objects, try matching by a key
  if (oldObjs.length === oldArr.length && newObjs.length === newArr.length) {
    const matchKey = findMatchKey(oldObjs, newObjs)
    if (matchKey) {
      return computeMatchedArrayDiff(oldObjs, newObjs, matchKey)
    }
  }

  // Fallback: index-based comparison
  return computeIndexBasedArrayDiff(oldArr, newArr)
}

/** Find the best key to use for matching array items. */
function findMatchKey(
  oldItems: Record<string, unknown>[],
  newItems: Record<string, unknown>[],
): string | null {
  if (oldItems.length === 0 || newItems.length === 0) return null

  // Candidate keys: present in first item of both arrays, string type
  const cands = Object.keys(oldItems[0]).filter(k => {
    if (!(k in (newItems[0] || {}))) return false
    // Check that values are mostly strings (for matching)
    const allOld = oldItems.every(it => typeof it[k] === 'string' || typeof it[k] === 'number')
    const allNew = newItems.every(it => typeof it[k] === 'string' || typeof it[k] === 'number')
    return allOld && allNew
  })

  // Prefer named keys
  const preferred = ['id', 'specs', 'name', 'code', 'key', 'sku', 'product', '型号', '产品']
  for (const pk of preferred) {
    if (cands.includes(pk)) {
      const vals = new Set(oldItems.map(it => String(it[pk])))
      if (vals.size === oldItems.length) return pk // unique values = good match key
    }
  }

  // Try any candidate with unique values
  for (const k of cands) {
    const vals = new Set(oldItems.map(it => String(it[k])))
    if (vals.size === oldItems.length) return k
  }

  return null
}

/** Match array items by a common key, then diff each matched pair. */
function computeMatchedArrayDiff(
  oldItems: Record<string, unknown>[],
  newItems: Record<string, unknown>[],
  matchKey: string,
): JsonItemDiff[] {
  const result: JsonItemDiff[] = []
  const oldMap = new Map<string, { idx: number; item: Record<string, unknown> }>()
  oldItems.forEach((item, i) => oldMap.set(String(item[matchKey]), { idx: i, item }))

  const newMap = new Map<string, { idx: number; item: Record<string, unknown> }>()
  newItems.forEach((item, i) => newMap.set(String(item[matchKey]), { idx: i, item }))

  const matchedKeys = new Set<string>()

  // Find matches
  for (const [key, newEntry] of newMap) {
    if (oldMap.has(key)) {
      matchedKeys.add(key)
      const oldEntry = oldMap.get(key)!
      result.push({
        matchKey: `${matchKey}=${key}`,
        type: 'matched',
        itemIndex: newEntry.idx,
        fields: computeObjectDiff(oldEntry.item, newEntry.item),
      })
    } else {
      result.push({
        matchKey: `${matchKey}=${key}`,
        type: 'added',
        itemIndex: newEntry.idx,
        fields: Object.keys(newEntry.item).map(k => ({
          key: k,
          type: 'added' as const,
          newValue: newEntry.item[k],
        })),
      })
    }
  }

  // Removed items
  for (const [key, oldEntry] of oldMap) {
    if (!matchedKeys.has(key)) {
      result.push({
        matchKey: `${matchKey}=${key}`,
        type: 'removed',
        itemIndex: oldEntry.idx,
        fields: Object.keys(oldEntry.item).map(k => ({
          key: k,
          type: 'removed' as const,
          oldValue: oldEntry.item[k],
        })),
      })
    }
  }

  return result
}

/** Fallback: compare arrays index-by-index. */
function computeIndexBasedArrayDiff(
  oldArr: unknown[],
  newArr: unknown[],
): JsonItemDiff[] {
  const result: JsonItemDiff[] = []
  const maxLen = Math.max(oldArr.length, newArr.length)

  for (let i = 0; i < maxLen; i++) {
    if (i >= oldArr.length) {
      result.push({
        matchKey: `[${i}]`,
        type: 'added',
        itemIndex: i,
        fields: [{ key: `[${i}]`, type: 'added', newValue: newArr[i] }],
      })
    } else if (i >= newArr.length) {
      result.push({
        matchKey: `[${i}]`,
        type: 'removed',
        itemIndex: i,
        fields: [{ key: `[${i}]`, type: 'removed', oldValue: oldArr[i] }],
      })
    } else if (isPlainObject(oldArr[i]) && isPlainObject(newArr[i])) {
      const fields = computeObjectDiff(
        oldArr[i] as Record<string, unknown>,
        newArr[i] as Record<string, unknown>,
      )
      const hasChanges = fields.some(f => f.type !== 'unchanged')
      result.push({
        matchKey: `[${i}]`,
        type: hasChanges ? 'matched' : 'matched',
        itemIndex: i,
        fields,
      })
    } else if (!jsonValueEqual(oldArr[i], newArr[i])) {
      result.push({
        matchKey: `[${i}]`,
        type: 'matched',
        itemIndex: i,
        fields: [{ key: `[${i}]`, type: 'changed', oldValue: oldArr[i], newValue: newArr[i] }],
      })
    }
  }

  return result
}

/** Deep-equal for JSON values. */
function jsonValueEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (typeof a === 'object') return JSON.stringify(a) === JSON.stringify(b)
  return String(a) === String(b)
}

/** Format a JSON value for display. */
export function formatJsonValue(v: unknown): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (v === '') return '""'
  if (typeof v === 'string') return `"${v}"`
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
