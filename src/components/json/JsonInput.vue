<script setup lang="ts">
import { ref } from 'vue'
import { useJsonStore } from '@/stores/jsonStore'

const store = useJsonStore()

let debounceTimer: ReturnType<typeof setTimeout>

function onInput(e: Event) {
  const target = e.target as HTMLTextAreaElement
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    store.setRawString(target.value)
  }, 150)
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
  <div class="json-input">
    <div class="input-header">
      <span class="input-label">输入</span>
    </div>
    <textarea
      class="input-textarea"
      placeholder='在此粘贴 JSON 文本...

示例：
{"name": "hello", "items": [1, 2, 3]}'
      :value="store.rawString"
      @input="onInput"
      spellcheck="false"
    ></textarea>
    <div class="input-actions">
      <button class="btn btn-primary" @click="store.doFormat" :disabled="!store.hasContent">
        格式化
      </button>
      <button class="btn btn-secondary" @click="store.doMinify" :disabled="!store.hasContent">
        压缩
      </button>
      <button
        :class="['btn btn-secondary', { 'btn-copied': justCopied }]"
        @click="doCopy"
        :disabled="!store.isValid"
      >{{ justCopied ? '已复制 ✓' : '复制' }}</button>
      <button class="btn btn-ghost" @click="store.clear" :disabled="!store.hasContent">
        清空
      </button>
    </div>
  </div>
</template>

<style scoped>
.json-input {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
}

.input-header {
  padding: 12px 18px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.input-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-label);
  letter-spacing: 1px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.input-textarea {
  flex: 1;
  border: none;
  resize: none;
  padding: 18px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.7;
  tab-size: 2;
  outline: none;
  transition: background 0.15s;
}

.input-textarea:focus {
  background: var(--bg-input-focus);
}

.input-textarea::placeholder {
  color: var(--text-hint);
}

.input-actions {
  display: flex;
  gap: 8px;
  padding: 12px 14px;
  border-top: 1px solid var(--border-color);
  flex-wrap: wrap;
}

.btn {
  padding: 7px 16px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: var(--font-weight-btn);
  transition: all 0.15s;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-brand);
  color: var(--text-btn-brand);
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-brand-hover);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
}

.btn-ghost:hover:not(:disabled) {
  background: var(--bg-secondary);
  color: var(--color-error);
}

.btn-copied {
  background: var(--color-brand);
  color: var(--text-btn-brand);
  border-color: var(--color-brand);
}
</style>
