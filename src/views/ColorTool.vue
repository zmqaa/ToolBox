<script setup lang="ts">
import { ref } from 'vue'
import { useColorStore } from '@/stores/colorStore'
import { contrastText } from '@/utils/color'

const store = useColorStore()

let debounceTimer: ReturnType<typeof setTimeout>

function onInput(e: Event) {
  const target = e.target as HTMLInputElement
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.setInput(target.value)
  }, 150)
}

const justCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout>
function doCopy(text: string) {
  store.copy(text)
  justCopied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { justCopied.value = false }, 1500)
}
</script>

<template>
  <div class="color-tool">
    <div class="viewer-header">
      <h2>颜色转换</h2>
      <span class="viewer-desc">Hex ↔ RGB ↔ HSL 实时互转，支持 CSS 颜色名（red, blue...）</span>
    </div>

    <div class="viewer-body">
      <div class="clr-main">
        <!-- 输入区 -->
        <div class="clr-input-row">
          <input
            type="text"
            class="clr-input"
            placeholder="输入颜色：如 #047857、rgb(4,120,87)、hsl(160,90%,25%)、red..."
            :value="store.inputText"
            @input="onInput"
            spellcheck="false"
          />
          <button class="btn btn-ghost" @click="store.clear" :disabled="!store.hasInput">清空</button>
        </div>

        <!-- 色块预览 -->
        <div class="clr-preview-wrap" v-if="store.hasResult">
          <div
            class="clr-swatch"
            :style="{ background: store.result!.hex }"
          >
            <span :style="{ color: contrastText(store.result!.hex) }">
              {{ store.result!.hex }}
            </span>
          </div>
        </div>

        <!-- 结果 -->
        <div class="result-card" v-if="store.hasResult">
          <div class="result-row">
            <span class="result-label">HEX</span>
            <code class="result-value">{{ store.result!.hex }}</code>
            <button class="btn-copy" @click="doCopy(store.result!.hex)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
          </div>
          <div class="result-row">
            <span class="result-label">RGB</span>
            <code class="result-value">{{ store.result!.rgb }}</code>
            <button class="btn-copy" @click="doCopy(store.result!.rgb)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
          </div>
          <div class="result-row">
            <span class="result-label">RGBA</span>
            <code class="result-value">{{ store.result!.rgba }}</code>
            <button class="btn-copy" @click="doCopy(store.result!.rgba)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
          </div>
          <div class="result-row">
            <span class="result-label">HSL</span>
            <code class="result-value">{{ store.result!.hsl }}</code>
            <button class="btn-copy" @click="doCopy(store.result!.hsl)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
          </div>
          <div class="result-divider"></div>
          <div class="result-row">
            <span class="result-label">H</span>
            <code class="result-value">{{ store.result!.hslValues.h }}°</code>
          </div>
          <div class="result-row">
            <span class="result-label">S</span>
            <code class="result-value">{{ store.result!.hslValues.s }}%</code>
          </div>
          <div class="result-row">
            <span class="result-label">L</span>
            <code class="result-value">{{ store.result!.hslValues.l }}%</code>
          </div>
        </div>

        <!-- 空/错误 -->
        <div class="clr-empty" v-if="!store.hasInput">
          <p>输入任意颜色值，实时显示 Hex / RGB / HSL</p>
        </div>
        <div class="clr-empty clr-error" v-else-if="store.error">
          <p>{{ store.error }}</p>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div :class="['status-bar', { 'status-error': store.error }]">
      <template v-if="!store.hasInput">
        <span class="status-dot idle"></span>
        <span>就绪 — 支持 Hex、RGB、RGBA、HSL、CSS 颜色名</span>
      </template>
      <template v-else-if="store.hasResult">
        <span class="status-dot ok"></span>
        <span class="status-chunk">{{ store.result!.hex }}</span>
        <span class="status-sep">→</span>
        <span class="status-chunk">{{ store.result!.rgb }}</span>
        <span class="status-sep">→</span>
        <span class="status-chunk">{{ store.result!.hsl }}</span>
      </template>
      <template v-else-if="store.error">
        <span class="status-dot err"></span>
        <span>{{ store.error }}</span>
      </template>
    </div>
  </div>
</template>

<style scoped>
.color-tool {
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
  overflow: auto;
}

.clr-main {
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 28px;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* 输入 */
.clr-input-row {
  display: flex;
  gap: 8px;
}

.clr-input {
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

.clr-input:focus {
  border-color: var(--border-input-focus);
  background: var(--bg-input-focus);
}

.clr-input::placeholder {
  color: var(--text-muted);
  font-size: 14px;
}

/* 色块 */
.clr-preview-wrap {
  display: flex;
  justify-content: center;
}

.clr-swatch {
  width: 100%;
  height: 100px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  transition: background 0.2s;
}

.clr-swatch span {
  font-size: 24px;
  font-weight: 700;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  text-shadow: 0 1px 3px rgba(0,0,0,0.15);
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
  width: 64px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.result-value {
  flex: 1;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 15px;
  color: var(--text-primary);
  padding: 3px 0;
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

/* 空/错误 */
.clr-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 20px;
  color: var(--text-muted);
  text-align: center;
}

.clr-empty p {
  font-size: 15px;
}

.clr-error p {
  color: var(--color-error);
}

/* 按钮 */
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
