<script setup lang="ts">
import { ref } from 'vue'
import { useListStore } from '@/stores/listStore'
import type { OutputPreset, WrapMode, JoinMode } from '@/utils/listFormatter'

const store = useListStore()

let debounceTimer: ReturnType<typeof setTimeout>

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.setInput(target.value)
  }, 200)
}

const justCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout>
function doCopy() {
  store.copyOutput()
  justCopied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { justCopied.value = false }, 1500)
}

const PRESETS: OutputPreset[] = ['sql-in', 'json-array', 'bare', 'markdown']
const WRAP_MODES: { mode: WrapMode; label: string }[] = [
  { mode: 'single', label: "''" },
  { mode: 'double', label: '""' },
  { mode: 'backtick', label: '``' },
  { mode: 'none', label: '无' },
]
const JOIN_MODES: { mode: JoinMode; label: string }[] = [
  { mode: 'comma-space', label: ', ' },
  { mode: 'comma', label: ',' },
  { mode: 'newline', label: '↲' },
  { mode: 'semicolon', label: ';' },
  { mode: 'space', label: '空格' },
]
const SORT_OPTIONS: { dir: 'none' | 'asc' | 'desc'; label: string }[] = [
  { dir: 'none', label: '维持' },
  { dir: 'asc', label: 'A→Z' },
  { dir: 'desc', label: 'Z→A' },
]
</script>

<template>
  <div class="list-tool">
    <div class="viewer-header">
      <h2>列值拼接</h2>
      <span class="viewer-desc">粘贴一列值，自动加引号拼接。支持 SQL IN()、JSON 数组、Markdown 等格式</span>
    </div>

    <div class="viewer-body">
      <!-- 选项工具栏 -->
      <div class="toolbar">
        <!-- 预设行：分段式按钮组 -->
        <div class="toolbar-row">
          <span class="toolbar-hint">预设</span>
          <div class="segmented">
            <button
              v-for="(p, i) in PRESETS"
              :key="p"
              :class="['seg-item', {
                active: store.opts.preset === p,
                first: i === 0,
                last: i === PRESETS.length - 1
              }]"
              @click="store.setPreset(p)"
            >{{ store.PRESET_LABELS[p] }}</button>
          </div>
        </div>

        <!-- 调节行：包裹 / 连接 / 排序 / 清理 -->
        <div class="toolbar-row tune-row">
          <div class="tune-group">
            <span class="tune-label">包裹</span>
            <div class="tune-btns">
              <button v-for="w in WRAP_MODES" :key="w.mode"
                :class="['btn-tune', { active: store.opts.wrapMode === w.mode }]"
                @click="store.setWrapMode(w.mode)">{{ w.label }}</button>
            </div>
          </div>

          <span class="tune-divider"></span>

          <div class="tune-group">
            <span class="tune-label">连接</span>
            <div class="tune-btns">
              <button v-for="j in JOIN_MODES" :key="j.mode"
                :class="['btn-tune', { active: store.opts.joinMode === j.mode }]"
                @click="store.setJoinMode(j.mode)">{{ j.label }}</button>
            </div>
          </div>

          <span class="tune-divider"></span>

          <div class="tune-group">
            <span class="tune-label">排序</span>
            <div class="tune-btns">
              <button v-for="s in SORT_OPTIONS" :key="s.dir"
                :class="['btn-tune', { active: store.opts.sort === s.dir }]"
                @click="store.setSort(s.dir)">{{ s.label }}</button>
            </div>
          </div>

          <span class="tune-divider"></span>

          <div class="tune-group">
            <span class="tune-label">清理</span>
            <div class="tune-btns">
              <button :class="['btn-tune', { active: store.opts.trim }]" @click="store.toggle('trim')">
                ✂ 空格</button>
              <button :class="['btn-tune', { active: store.opts.skipEmpty }]" @click="store.toggle('skipEmpty')">
                ⊘ 空行</button>
              <button :class="['btn-tune', { active: store.opts.dedupe }]" @click="store.toggle('dedupe')">
                ⊙ 去重</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入 / 输出左右对齐 -->
      <div class="panels-row">
        <div class="panel input-panel">
          <div class="panel-header">
            <span class="panel-label">输入</span>
            <div class="panel-actions">
              <button class="btn btn-ghost" @click="store.clear" :disabled="!store.hasInput">清空</button>
            </div>
          </div>
          <textarea
            class="list-textarea"
            placeholder="在此粘贴一列数据...

示例：
alice
bob
charlie

支持换行、逗号、分号、空格、Tab 自动分割"
            :value="store.inputText"
            @input="onInput"
            spellcheck="false"
          ></textarea>
        </div>

        <div class="panel output-panel">
          <div class="panel-header">
            <span class="panel-label">输出</span>
            <div class="panel-actions">
              <button
                :class="['btn btn-secondary', { 'btn-copied': justCopied }]"
                @click="doCopy"
                :disabled="!store.hasOutput"
              >{{ justCopied ? '已复制 ✓' : '复制' }}</button>
            </div>
          </div>
          <div class="list-output" v-if="store.hasOutput">
            <pre><code>{{ store.outputText }}</code></pre>
          </div>
          <div v-else class="output-placeholder">
            <div class="placeholder-icon">→</div>
            <p>在左侧输入数据后，结果将显示在这里</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <template v-if="!store.hasInput">
        <span class="status-dot idle"></span>
        <span>就绪 — 自动识别换行 / 逗号 / 分号 / 空格 / Tab 分隔</span>
      </template>
      <template v-else>
        <span class="status-dot ok"></span>
        <span class="status-chunk">{{ store.PRESET_LABELS[store.opts.preset] }}</span>
        <span class="status-sep">·</span>
        <span class="status-chunk">{{ store.opts.wrapMode === 'single' ? "''" : store.opts.wrapMode === 'double' ? '""' : store.opts.wrapMode === 'backtick' ? '``' : '无引号' }}</span>
        <span class="status-sep">·</span>
        <span class="status-chunk">{{ store.opts.joinMode === 'comma-space' ? ', ' : store.opts.joinMode === 'comma' ? ',' : store.opts.joinMode === 'newline' ? '换行' : store.opts.joinMode === 'semicolon' ? ';' : '空格' }}</span>
        <span v-if="store.opts.dedupe || store.opts.sort !== 'none'" class="status-sep">·</span>
        <span v-if="store.opts.dedupe" class="status-chunk">已去重</span>
        <span v-if="store.opts.dedupe && store.opts.sort !== 'none'" class="status-sep">·</span>
        <span v-if="store.opts.sort !== 'none'" class="status-chunk">{{ store.opts.sort === 'asc' ? 'A→Z' : 'Z→A' }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* ==============================
   整体容器
   ============================== */
.list-tool {
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

/* ==============================
   主体区域
   ============================== */
.viewer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ==============================
   选项工具栏
   ============================== */
.toolbar {
  padding: 12px 28px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-card);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-hint {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  flex-shrink: 0;
}

/* ---- 分段式按钮组 (预设) ---- */
.segmented {
  display: inline-flex;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.seg-item {
  padding: 5px 16px;
  font-size: 13px;
  font-weight: 500;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  background: transparent;
  color: var(--text-muted);
  border: none;
  border-right: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.seg-item.last {
  border-right: none;
}

.seg-item:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.seg-item.active {
  background: var(--color-brand);
  color: #fff;
}

/* ---- 调节行 ---- */
.tune-row {
  flex-wrap: wrap;
  gap: 6px 0;
}

.tune-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tune-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  flex-shrink: 0;
}

.tune-btns {
  display: flex;
  gap: 3px;
}

.btn-tune {
  padding: 4px 10px;
  font-size: 12px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-tune:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.btn-tune.active {
  background: var(--color-brand);
  color: #fff;
  border-color: var(--color-brand);
}

.tune-divider {
  width: 1px;
  height: 24px;
  background: var(--border-color);
  margin: 0 6px;
  flex-shrink: 0;
}

/* ==============================
   输入 / 输出面板
   ============================== */
.panels-row {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.input-panel {
  border-right: 1px solid var(--border-color);
}

.panel-header {
  padding: 8px 18px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 38px;
}

.panel-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 1.5px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 输入文本域 */
.list-textarea {
  flex: 1;
  border: none;
  resize: none;
  padding: 16px 18px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 15px;
  line-height: 1.7;
  tab-size: 2;
  outline: none;
  transition: background 0.15s;
}

.list-textarea:focus {
  background: var(--bg-input-focus);
}

.list-textarea::placeholder {
  color: var(--text-muted);
}

/* 输出区 */
.list-output {
  flex: 1;
  padding: 16px 18px;
  overflow: auto;
  background: var(--bg-primary);
}

.list-output pre {
  margin: 0;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

.list-output pre code {
  font-family: inherit;
  font-size: inherit;
}

/* 输出占位 */
.output-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  gap: 10px;
  padding: 40px;
  color: var(--text-muted);
}

.placeholder-icon {
  font-size: 24px;
  opacity: 0.3;
}

.output-placeholder p {
  font-size: 15px;
  max-width: 260px;
  line-height: 1.6;
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

.btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--color-error);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
}

.btn-copied {
  background: var(--color-brand);
  color: #fff;
  border-color: var(--color-brand);
}

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

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.idle {
  background: var(--text-muted);
}

.status-dot.ok {
  background: var(--color-success);
}

.status-chunk {
  white-space: nowrap;
}

.status-sep {
  color: var(--border-color);
  user-select: none;
}
</style>
