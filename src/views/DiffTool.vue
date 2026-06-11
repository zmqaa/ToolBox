<script setup lang="ts">
import { ref } from 'vue'
import { useDiffStore } from '@/stores/diffStore'
import { formatJsonValue } from '@/utils/diff'

const store = useDiffStore()

let leftTimer: ReturnType<typeof setTimeout>
let rightTimer: ReturnType<typeof setTimeout>

function onLeftInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  clearTimeout(leftTimer)
  leftTimer = setTimeout(() => store.setLeft(val), 150)
}

function onRightInput(e: Event) {
  const val = (e.target as HTMLTextAreaElement).value
  clearTimeout(rightTimer)
  rightTimer = setTimeout(() => store.setRight(val), 150)
}

/* ---- copy unified diff (line mode) ---- */
const justCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout>

function doCopy() {
  if (store.diffMode === 'line') {
    const lines: string[] = []
    for (const l of store.lineDiffResult) {
      const prefix = l.type === 'added' ? '+' : l.type === 'removed' ? '-' : ' '
      lines.push(`${prefix} ${l.content}`)
    }
    navigator.clipboard.writeText(lines.join('\n'))
  } else {
    // Copy JSON diff as text summary
    const lines: string[] = []
    if (store.diffMode === 'json-object') {
      for (const f of store.objectFields) {
        const mark = f.type === 'added' ? '+' : f.type === 'removed' ? '-' : f.type === 'changed' ? '~' : ' '
        lines.push(`${mark} ${f.key}: ${formatJsonValue(f.oldValue)} → ${formatJsonValue(f.newValue)}`)
      }
    } else if (store.diffMode === 'json-array') {
      for (const item of store.arrayItems) {
        const mark = item.type === 'added' ? '+' : item.type === 'removed' ? '-' : '='
        lines.push(`\n[${mark}] ${item.matchKey}`)
        for (const f of item.fields) {
          if (f.type === 'unchanged') continue
          const mark = f.type === 'added' ? '+' : f.type === 'removed' ? '-' : '~'
          lines.push(`  ${mark} ${f.key}: ${formatJsonValue(f.oldValue)} → ${formatJsonValue(f.newValue)}`)
        }
      }
    }
    navigator.clipboard.writeText(lines.join('\n'))
  }
  justCopied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { justCopied.value = false }, 1500)
}

/* ---- expand/collapse matched items with no changes ---- */
const showAll = ref(false)
</script>

<template>
  <div class="diff-tool">
    <div class="viewer-header">
      <h2>文本对比</h2>
      <span class="viewer-desc">
        自动识别 JSON 做结构化对比，字段级标注增/删/改。纯文本走逐行 diff
      </span>
    </div>

    <div class="viewer-body">
      <!-- 输入面板 -->
      <div class="panels-row inputs-row">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-label">原始</span>
            <button class="btn btn-ghost" @click="store.clear" :disabled="!store.hasInput">清空</button>
          </div>
          <textarea
            class="diff-textarea"
            placeholder="在此粘贴原始文本或 JSON..."
            :value="store.leftText"
            @input="onLeftInput"
            spellcheck="false"
          ></textarea>
        </div>

        <div class="panel-divider">
          <button class="btn-swap" @click="store.swap" title="交换两侧" :disabled="!store.hasInput">&harr;</button>
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-label">对比</span>
          </div>
          <textarea
            class="diff-textarea"
            placeholder="在此粘贴对比文本或 JSON..."
            :value="store.rightText"
            @input="onRightInput"
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <!-- 结果区 -->
      <div class="result-panel" v-if="store.hasInput">
        <div class="panel-header">
          <span class="panel-label">
            {{ store.diffMode === 'json-array' ? 'JSON 数组对比' : store.diffMode === 'json-object' ? 'JSON 对象对比' : '逐行对比' }}
          </span>
          <span class="stats-inline" v-if="store.diffMode === 'json-array'">
            <span class="stat added" v-if="store.jsonStats.added">+{{ store.jsonStats.added }} 对象</span>
            <span class="stat removed" v-if="store.jsonStats.removed">-{{ store.jsonStats.removed }} 对象</span>
            <span class="stat unchanged">{{ store.jsonStats.matched }} 匹配</span>
            <span class="stat changed" v-if="store.jsonStats.fieldChanged">~{{ store.jsonStats.fieldChanged }} 字段变更</span>
          </span>
          <span class="stats-inline" v-else-if="store.diffMode === 'json-object'">
            <span class="stat added" v-if="store.jsonStats.added">+{{ store.jsonStats.added }}</span>
            <span class="stat removed" v-if="store.jsonStats.removed">-{{ store.jsonStats.removed }}</span>
            <span class="stat changed" v-if="store.jsonStats.changed">~{{ store.jsonStats.changed }} 变更</span>
            <span class="stat unchanged">{{ store.jsonStats.unchanged }} 未变</span>
          </span>
          <span class="stats-inline" v-else>
            <span class="stat added">+{{ store.lineStats.added }}</span>
            <span class="stat removed">-{{ store.lineStats.removed }}</span>
            <span class="stat unchanged">{{ store.lineStats.unchanged }} 未变</span>
          </span>
          <div class="panel-actions">
            <label class="toggle-all" v-if="store.diffMode === 'json-array'">
              <input type="checkbox" v-model="showAll" /> 全部字段
            </label>
            <button
              :class="['btn btn-secondary btn-copy-sm', { 'btn-copied': justCopied }]"
              @click="doCopy"
            >{{ justCopied ? '已复制 ✓' : '复制' }}</button>
          </div>
        </div>

        <!-- ===== JSON 数组 diff ===== -->
        <div class="diff-output" v-if="store.diffMode === 'json-array' && store.arrayItems.length">
          <div
            v-for="(item, idx) in store.arrayItems"
            :key="idx"
            :class="['item-group', `item-${item.type}`]"
          >
            <div class="item-header">
              <span class="item-tag">{{ item.type === 'added' ? '+ 新增' : item.type === 'removed' ? '- 删除' : '= 匹配' }}</span>
              <span class="item-key">{{ item.matchKey }}</span>
            </div>
            <table class="field-table" v-if="item.fields.length">
              <tbody>
                <tr
                  v-for="f in item.fields"
                  :key="f.key"
                  :class="['field-row', `field-${f.type}`, { 'field-hidden': f.type === 'unchanged' && !showAll }]"
                >
                  <td class="field-key">{{ f.key }}</td>
                  <td class="field-old" v-if="f.type !== 'added'">{{ formatJsonValue(f.oldValue) }}</td>
                  <td class="field-old field-empty" v-else></td>
                  <td class="field-arrow">{{ f.type === 'changed' ? '→' : f.type === 'added' ? '←' : f.type === 'removed' ? '×' : '' }}</td>
                  <td class="field-new" :class="{ 'field-new-only': f.type === 'added' }">{{ formatJsonValue(f.newValue) }}</td>
                </tr>
              </tbody>
            </table>
            <div class="item-no-fields" v-else>无字段差异</div>
          </div>
        </div>

        <!-- ===== JSON 对象 diff ===== -->
        <div class="diff-output" v-else-if="store.diffMode === 'json-object' && store.objectFields.length">
          <table class="field-table field-table-flat">
            <tbody>
              <tr
                v-for="f in store.objectFields"
                :key="f.key"
                :class="['field-row', `field-${f.type}`]"
              >
                <td class="field-key">{{ f.key }}</td>
                <td class="field-old" v-if="f.type !== 'added'">{{ formatJsonValue(f.oldValue) }}</td>
                <td class="field-old field-empty" v-else></td>
                <td class="field-arrow">{{ f.type === 'changed' ? '→' : f.type === 'added' ? '←' : f.type === 'removed' ? '×' : '' }}</td>
                <td class="field-new" :class="{ 'field-new-only': f.type === 'added' }">{{ formatJsonValue(f.newValue) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ===== 纯文本逐行 diff ===== -->
        <div class="diff-output" v-else-if="store.diffMode === 'line' && store.lineDiffResult.length">
          <table class="diff-table">
            <tbody>
              <tr
                v-for="(line, idx) in store.lineDiffResult"
                :key="idx"
                :class="['diff-row', `diff-${line.type}`]"
              >
                <td class="diff-gutter diff-gutter-old">{{ line.type !== 'added' ? line.oldLineNumber : '' }}</td>
                <td class="diff-gutter diff-gutter-new">{{ line.type !== 'removed' ? line.newLineNumber : '' }}</td>
                <td class="diff-marker">{{ line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' ' }}</td>
                <td class="diff-content"><pre>{{ line.content }}</pre></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 无差异 -->
        <div v-else class="diff-empty">
          <p>两端数据完全一致</p>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <template v-if="!store.hasInput">
        <span class="status-dot idle"></span>
        <span>就绪 — 粘贴两段文本或 JSON，自动选择对比模式</span>
      </template>
      <template v-else>
        <span class="status-dot ok"></span>
        <span>模式：{{ store.modeLabel }}</span>
        <template v-if="store.diffMode === 'json-array'">
          <span class="status-sep">·</span>
          <span>{{ store.arrayItems.length }} 对象</span>
          <span class="status-sep">·</span>
          <span>+{{ store.jsonStats.added }} 增 -{{ store.jsonStats.removed }} 删 ={{ store.jsonStats.matched }} 匹配</span>
        </template>
        <template v-else-if="store.diffMode === 'json-object'">
          <span class="status-sep">·</span>
          <span>+{{ store.jsonStats.added }} 增 -{{ store.jsonStats.removed }} 删 ~{{ store.jsonStats.changed }} 改 {{ store.jsonStats.unchanged }} 未变</span>
        </template>
        <template v-else>
          <span class="status-sep">·</span>
          <span>{{ store.lineStats.total }} 行</span>
          <span class="status-sep">·</span>
          <span>+{{ store.lineStats.added }} 增 -{{ store.lineStats.removed }} 删</span>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ==============================
   整体容器
   ============================== */
.diff-tool {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.viewer-header {
  padding: 14px 28px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.viewer-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.viewer-desc {
  font-size: 14px;
  color: var(--text-muted);
}

.viewer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ==============================
   输入面板
   ============================== */
.inputs-row {
  display: flex;
  height: 38%;
  min-height: 140px;
}

.panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.panel-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  flex-shrink: 0;
  background: var(--bg-card);
  border-left: 1px solid var(--border-color);
  border-right: 1px solid var(--border-color);
}

.btn-swap {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-muted);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-swap:hover:not(:disabled) { color: var(--text-primary); border-color: var(--text-muted); }
.btn-swap:disabled { opacity: 0.3; cursor: not-allowed; }

.panel-header {
  padding: 8px 18px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
}

.panel-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 1.5px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  flex-shrink: 0;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.diff-textarea {
  flex: 1;
  border: none;
  resize: none;
  padding: 14px 18px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.65;
  tab-size: 2;
  outline: none;
  transition: background 0.15s;
}

.diff-textarea:focus { background: var(--bg-input-focus); }
.diff-textarea::placeholder { color: var(--text-muted); }

/* ==============================
   结果面板
   ============================== */
.result-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border-color);
  overflow: hidden;
}

.stats-inline {
  display: flex;
  gap: 10px;
  font-size: 12px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.stat.added   { color: var(--color-success); }
.stat.removed { color: var(--color-error); }
.stat.unchanged { color: var(--text-muted); }
.stat.changed { color: var(--color-warning); }

.toggle-all {
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  user-select: none;
}

/* ==============================
   JSON 对象/数组 diff
   ============================== */
.diff-output {
  flex: 1;
  overflow: auto;
  background: var(--bg-primary);
}

/* ---- item group ---- */
.item-group {
  border-bottom: 1px solid var(--border-color);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: var(--bg-secondary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  position: sticky;
  top: 0;
  z-index: 1;
}

.item-tag {
  font-weight: 600;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
}

.item-added   .item-tag { color: var(--color-success); background: rgba(4, 120, 87, 0.1); }
.item-removed .item-tag { color: var(--color-error);   background: rgba(220, 38, 38, 0.08); }
.item-matched .item-tag { color: var(--text-muted);    background: var(--bg-primary); }

.item-key {
  color: var(--text-primary);
  font-weight: 500;
}

.item-no-fields {
  padding: 10px 18px;
  color: var(--text-muted);
  font-size: 13px;
}

/* ---- field table ---- */
.field-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.55;
}

.field-table-flat {
  /* no border between items for object mode */
}

.field-row {
  transition: background 0.1s;
}

.field-row.field-hidden {
  display: none;
}

.field-key {
  width: 140px;
  min-width: 100px;
  padding: 4px 18px;
  color: var(--json-key);
  font-weight: 500;
  vertical-align: middle;
}

.field-old,
.field-new {
  padding: 4px 6px;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.field-old {
  color: var(--text-secondary);
}

.field-new {
  color: var(--text-primary);
}

.field-empty {
  color: transparent;
}

.field-arrow {
  width: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  vertical-align: middle;
}

/* ---- field coloring ---- */
.field-changed {
  background: rgba(180, 83, 9, 0.06);
}

.field-changed .field-old {
  color: var(--color-error);
}

.field-changed .field-new {
  color: var(--color-success);
}

.field-changed .field-arrow {
  color: var(--color-warning);
}

.field-added {
  background: rgba(4, 120, 87, 0.07);
}

.field-added .field-arrow {
  color: var(--color-success);
}

.field-added .field-new-only {
  color: var(--color-success);
}

.field-removed {
  background: rgba(220, 38, 38, 0.05);
}

.field-removed .field-old {
  color: var(--color-error);
  text-decoration: line-through;
}

.field-removed .field-arrow {
  color: var(--color-error);
}

/* ==============================
   逐行 diff (纯文本模式)
   ============================== */
.diff-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.6;
}

.diff-gutter {
  width: 44px;
  min-width: 44px;
  text-align: right;
  padding: 0 10px 0 8px;
  color: var(--text-muted);
  user-select: none;
  vertical-align: top;
  font-size: 12px;
  border-right: 1px solid var(--border-color);
  opacity: 0.55;
}

.diff-marker {
  width: 20px;
  min-width: 20px;
  text-align: center;
  font-weight: 600;
  user-select: none;
  vertical-align: top;
  padding: 0 4px;
}

.diff-content { padding: 0 14px; vertical-align: top; }
.diff-content pre { margin: 0; font-family: inherit; font-size: inherit; white-space: pre-wrap; word-break: break-all; }

.diff-added             { background: rgba(4, 120, 87, 0.08); }
.diff-added .diff-marker { color: var(--color-success); }
.diff-removed             { background: rgba(220, 38, 38, 0.06); }
.diff-removed .diff-marker { color: var(--color-error); }
.diff-unchanged .diff-marker { color: var(--text-muted); }

.diff-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--text-muted);
  font-size: 15px;
}

/* ==============================
   通用按钮
   ============================== */
.btn {
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s;
  font-family: inherit;
  cursor: pointer;
  border: none;
  white-space: nowrap;
}
.btn:disabled { opacity: 0.35; cursor: not-allowed; }

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
.btn-ghost:hover:not(:disabled) { background: var(--bg-secondary); color: var(--color-error); }

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
.btn-secondary:hover:not(:disabled) { background: var(--border-color); }

.btn-copy-sm { padding: 4px 10px; font-size: 12px; }
.btn-copied { background: var(--color-brand); color: #fff; border-color: var(--color-brand); }

/* ==============================
   状态栏
   ============================== */
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 20px;
  font-size: 13px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  color: var(--text-secondary);
  min-height: 30px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.status-dot.idle { background: var(--text-muted); }
.status-dot.ok   { background: var(--color-success); }

.status-chunk { white-space: nowrap; }
.status-sep   { color: var(--border-color); user-select: none; }
</style>
