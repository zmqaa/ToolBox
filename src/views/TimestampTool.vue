<script setup lang="ts">
import { ref } from 'vue'
import { useTimestampStore } from '@/stores/timestampStore'
import { PRECISION_LABELS } from '@/utils/timestamp'
import type { Precision } from '@/utils/timestamp'

const store = useTimestampStore()

const precisions: Precision[] = ['second', 'minute', 'hour', 'day', 'month']

let debounceTimer: ReturnType<typeof setTimeout>

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.setInput(target.value)
  }, 200)
}

const justCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout>
function doCopy(text: string | number) {
  store.copy(String(text))
  justCopied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { justCopied.value = false }, 1500)
}
</script>

<template>
  <div class="timestamp-tool">
    <div class="viewer-header">
      <h2>时间戳转换</h2>
      <span class="viewer-desc">Unix 时间戳 ↔ 可读日期互转，支持秒/毫秒自动识别</span>
    </div>

    <div class="viewer-body">
      <div class="ts-main">
        <!-- 输入区 -->
        <div class="ts-input-row">
          <div class="ts-input-wrap">
            <input
              type="text"
              class="ts-input"
              placeholder="输入时间戳（如 1717926400）或日期（如 2026-05-01）..."
              :value="store.inputText"
              @input="onInput"
              spellcheck="false"
            />
            <button class="btn btn-now" @click="store.setNow" title="填入当前时间戳">
              现在
            </button>
            <button class="btn btn-ghost" @click="store.clear" :disabled="!store.hasInput && !store.hasResult">
              清空
            </button>
          </div>
        </div>

        <!-- 结果区 -->
        <div class="ts-result" v-if="store.hasResult">
          <!-- 精度选择 -->
          <div class="precision-bar">
            <span class="precision-label">精度</span>
            <div class="precision-btns">
              <button
                v-for="p in precisions"
                :key="p"
                :class="['btn btn-precision', { active: store.precision === p }]"
                @click="store.setPrecision(p)"
              >{{ PRECISION_LABELS[p] }}</button>
            </div>
            <span class="source-hint">{{ store.result!.sourceType }}</span>
          </div>

          <div class="result-card">
            <div class="result-row">
              <span class="result-label">Unix 秒</span>
              <code class="result-value">{{ store.result!.unixSeconds }}</code>
              <button class="btn-copy" @click="doCopy(store.result!.unixSeconds)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
            </div>
            <div class="result-row">
              <span class="result-label">Unix 毫秒</span>
              <code class="result-value">{{ store.result!.unixMilliseconds }}</code>
              <button class="btn-copy" @click="doCopy(store.result!.unixMilliseconds)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
            </div>
            <div class="result-divider"></div>
            <div class="result-row">
              <span class="result-label">ISO 8601</span>
              <code class="result-value">{{ store.formattedISO }}</code>
              <button class="btn-copy" @click="doCopy(store.formattedISO)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
            </div>
            <div class="result-row">
              <span class="result-label">本地时间</span>
              <code class="result-value highlight">{{ store.formattedLocal }}</code>
              <button class="btn-copy" @click="doCopy(store.formattedLocal)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
            </div>
            <div class="result-row">
              <span class="result-label">UTC 时间</span>
              <code class="result-value utc">{{ store.result!.utcString }}</code>
              <button class="btn-copy" @click="doCopy(store.result!.utcString)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
            </div>
            <div class="result-divider"></div>
            <div class="result-row">
              <span class="result-label">相对时间</span>
              <code class="result-value relative">{{ store.result!.relative }}</code>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="ts-empty" v-else-if="!store.hasInput">
          <p>输入 Unix 时间戳或日期字符串，自动识别并转换</p>
          <div class="empty-hints">
            <span>支持格式：</span>
            <code>1717926400</code>
            <code>1717926400000</code>
            <code>20260501</code>
            <code>2026-05-01</code>
            <code>2026/05/01 12:00</code>
          </div>
        </div>

        <!-- 错误 -->
        <div class="ts-empty ts-error" v-else-if="store.result && !store.result.success">
          <p>{{ store.result.error }}</p>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div :class="['status-bar', { 'status-error': store.result && !store.result.success }]">
      <template v-if="!store.hasInput && !store.hasResult">
        <span class="status-dot idle"></span>
        <span>就绪 — 当前时间戳 {{ Math.floor(Date.now() / 1000) }}，点击「现在」快速填入</span>
      </template>
      <template v-else-if="store.hasResult">
        <span class="status-dot ok"></span>
        <span class="status-chunk">{{ store.result!.sourceType }}</span>
        <span class="status-sep">·</span>
        <span class="status-chunk">精度 {{ PRECISION_LABELS[store.precision] }}</span>
        <span class="status-sep">·</span>
        <span class="status-chunk">{{ store.result!.relative }}</span>
      </template>
      <template v-else-if="store.result && !store.result.success">
        <span class="status-dot err"></span>
        <span>{{ store.result.error }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.timestamp-tool {
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
  overflow: auto;
}

.ts-main {
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 输入行 */
.ts-input-row {
  display: flex;
}

.ts-input-wrap {
  display: flex;
  width: 100%;
  gap: 8px;
}

.ts-input {
  flex: 1;
  padding: 14px 18px;
  border: 1px solid var(--border-input);
  border-radius: 6px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 16px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.ts-input:focus {
  border-color: var(--border-input-focus);
  background: var(--bg-input-focus);
}

.ts-input::placeholder {
  color: var(--text-hint);
  font-size: 15px;
}

/* 精度栏 */
.precision-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.precision-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-label);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.precision-btns {
  display: flex;
  gap: 4px;
}

.source-hint {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-hint);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

/* 结果卡片 */
.result-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 6px 0;
  box-shadow: var(--shadow-sm);
}

.result-row {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  gap: 14px;
}

.result-label {
  width: 88px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-label);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.result-value {
  flex: 1;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 15px;
  color: var(--text-primary);
  padding: 3px 0;
  word-break: break-all;
}

.result-value.highlight {
  color: var(--color-brand);
  font-weight: 600;
  font-size: 16px;
}

.result-value.utc {
  font-size: 14px;
}

.result-value.relative {
  color: var(--color-brand);
  font-weight: 600;
}

.result-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 20px;
}

.btn-copy {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 3px 6px;
  border-radius: 4px;
  opacity: 0.4;
  transition: opacity 0.15s;
  flex-shrink: 0;
}

.btn-copy:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

/* 空状态 */
.ts-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 20px;
  text-align: center;
  color: var(--text-secondary);
}

.ts-empty p {
  font-size: 16px;
}

.empty-hints {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 8px;
  font-size: 14px;
}

.empty-hints code {
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  background: var(--bg-secondary);
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.ts-error p {
  color: var(--color-error);
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
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-now {
  background: var(--color-brand);
  color: var(--text-btn-brand);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.btn-now:hover {
  filter: brightness(1.1);
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

.btn-precision {
  background: transparent;
  color: var(--text-label);
  border: 1px solid var(--border-color);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 12px;
  padding: 3px 10px;
}

.btn-precision:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.btn-precision.active {
  background: var(--color-brand);
  color: var(--text-btn-brand);
  border-color: var(--color-brand);
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
</style>
