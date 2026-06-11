/** JSON 值类型 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray

/** JSON 对象 */
export interface JsonObject {
  [key: string]: JsonValue
}

/** JSON 数组 */
export type JsonArray = JsonValue[]

/** JSON 节点类型 */
export type JsonNodeType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

/** JSON 解析结果 */
export type JsonParseResult =
  | {
      success: true
      data: JsonValue
      formatted: string
      lineCount: number
      size: number
    }
  | {
      success: false
      error: string
      line: number
      column: number
    }

/** 侧边栏导航项 */
export interface NavItem {
  path: string
  label: string
  icon: string
  available: boolean
}

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'auto'
