<script setup lang="ts">
import { ref } from 'vue'
import { useSqlStore } from '@/stores/sqlStore'
import type { KeywordCase } from '@/utils/sqlFormatter'

const store = useSqlStore()

let debounceTimer: ReturnType<typeof setTimeout>

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.setRawString(target.value)
  }, 200)
}

function setCase(kc: KeywordCase) {
  store.setKeywordCase(kc)
}

const justCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout>
function doCopy() {
  store.copyFormatted()
  justCopied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { justCopied.value = false }, 1500)
}
</script>

<template>
  <div class="sql-formatter">
    <div class="viewer-header">
      <h2>SQL 格式化</h2>
      <span class="viewer-desc">粘贴 SQL 语句，自动格式化排版，支持关键词大小写切换</span>
    </div>

    <div class="viewer-body">
      <!-- 左侧输入 -->
      <div class="panel input-panel">
        <div class="panel-header">
          <span class="panel-label">输入</span>
          <div class="panel-actions">
            <button class="btn btn-ghost" @click="store.clear" :disabled="!store.hasContent">清空</button>
          </div>
        </div>
        <textarea
          class="sql-textarea"
          placeholder='在此粘贴 SQL 语句...

示例：
select u.id, u.name, o.amount from users u left join orders o on u.id = o.user_id where o.status = "paid" order by o.created_at desc limit 10;'
          :value="store.rawString"
          @input="onInput"
          spellcheck="false"
        ></textarea>
      </div>

      <!-- 右侧输出 -->
      <div class="panel output-panel">
        <div class="panel-header">
          <span class="panel-label">输出</span>
          <div class="panel-actions">
            <button class="btn btn-option" @click="store.toggleColumnWrap" :title="'切换字段排列方式'">
              {{ store.columnWrapLabel }}
            </button>
            <span class="action-sep"></span>
            <button
              :class="['btn btn-option', { active: store.keywordCase === 'upper' }]"
              @click="setCase('upper')"
            >大写</button>
            <button
              :class="['btn btn-option', { active: store.keywordCase === 'lower' }]"
              @click="setCase('lower')"
            >小写</button>
            <span class="action-sep"></span>
            <button
              :class="['btn btn-secondary', { 'btn-copied': justCopied }]"
              @click="doCopy"
              :disabled="!store.isValid"
            >{{ justCopied ? '已复制 ✓' : '复制' }}</button>
          </div>
        </div>
        <div class="sql-output" v-if="store.formattedSql">
          <pre><code>{{ store.formattedSql }}</code></pre>
        </div>
        <div v-else-if="!store.hasContent" class="output-empty">
          <div class="empty-label">格式化输出</div>
          <p>在左侧输入 SQL 后，格式化结果将显示在这里。</p>
        </div>
        <div v-else-if="store.error" class="output-error">
          <div class="error-label">格式化错误</div>
          <p>{{ store.error }}</p>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div :class="['status-bar', { 'status-error': store.error }]">
      <template v-if="!store.hasContent">
        <span class="status-dot idle"></span>
        <span>就绪 — 粘贴 SQL 后自动格式化</span>
      </template>
      <template v-else-if="store.error">
        <span class="status-dot err"></span>
        <span>{{ store.error }}</span>
      </template>
      <template v-else>
        <span class="status-dot ok"></span>
        <span class="status-chunk">关键词 {{ store.keywordCase === 'upper' ? '大写' : '小写' }}</span>
        <span class="status-sep">·</span>
        <span class="status-chunk">缩进 {{ store.indentSize }} 空格</span>
        <span class="status-sep">·</span>
        <span class="status-chunk">{{ store.columnWrapLabel }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sql-formatter {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
}

.viewer-header {
  padding: 16px 28px;
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
  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;
}

.input-panel {
  width: 45%;
  border-right: 1px solid var(--border-color);
}

.output-panel {
  flex: 1;
}

.panel-header {
  padding: 10px 18px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 42px;
}

.panel-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-label);
  letter-spacing: 1px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.action-sep {
  width: 1px;
  height: 16px;
  background: var(--border-color);
  margin: 0 4px;
}

.sql-textarea {
  flex: 1;
  border: none;
  resize: none;
  padding: 18px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 15px;
  line-height: 1.7;
  tab-size: 2;
  outline: none;
  transition: background 0.15s;
}

.sql-textarea:focus {
  background: var(--bg-input-focus);
}

.sql-textarea::placeholder {
  color: var(--text-hint);
}

.sql-output {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background: var(--bg-primary);
}

.sql-output pre {
  margin: 0;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-primary);
  white-space: pre;
}

.sql-output pre code {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
}

.output-empty,
.output-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  text-align: center;
  gap: 10px;
  padding: 40px;
}

.empty-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-label);
  letter-spacing: 1px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  border: 1px dashed var(--border-color);
  padding: 6px 16px;
  border-radius: 4px;
}

.output-empty p {
  color: var(--text-secondary);
  font-size: 15px;
  max-width: 280px;
  line-height: 1.6;
}

.output-error {
  color: var(--color-error);
}

.error-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 1px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  border: 1px solid var(--color-error);
  padding: 6px 16px;
  border-radius: 4px;
  color: var(--color-error);
}

.output-error p {
  color: var(--color-error);
  font-size: 15px;
  max-width: 320px;
  line-height: 1.6;
}

/* 按钮 */
.btn {
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: var(--font-weight-btn);
  transition: all 0.15s;
  font-family: inherit;
  cursor: pointer;
  border: none;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-option {
  background: transparent;
  color: var(--text-label);
  border: 1px solid var(--border-color);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.btn-option:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.btn-option.active {
  background: var(--color-brand);
  color: var(--text-btn-brand);
  border-color: var(--color-brand);
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

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--color-error);
}

/* 状态栏 */
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

.status-error {
  color: var(--color-error);
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.idle { background: var(--text-muted); }
.status-dot.ok   { background: var(--color-success); }
.status-dot.err  { background: var(--color-error); }

.status-chunk {
  white-space: nowrap;
}

.status-sep {
  color: var(--border-color);
  user-select: none;
}

.btn-copied {
  background: var(--color-brand) !important;
  color: var(--text-btn-brand) !important;
  border-color: var(--color-brand) !important;
}
</style>
