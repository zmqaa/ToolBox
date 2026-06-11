<script setup lang="ts">
import { computed } from 'vue'
import { useJsonStore } from '@/stores/jsonStore'

const store = useJsonStore()

const sizeDisplay = computed(() => {
  const bytes = store.byteSize
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
})
</script>

<template>
  <div :class="['status-bar', { 'status-error': store.error }]">
    <template v-if="!store.hasContent">
      <span class="status-dot idle"></span>
      <span>就绪 — 粘贴 JSON 后自动解析</span>
    </template>
    <template v-else-if="store.error">
      <span class="status-dot err"></span>
      <span>第 {{ store.errorLine }} 行，第 {{ store.errorColumn }} 列：{{ store.error }}</span>
    </template>
    <template v-else>
      <span class="status-dot ok"></span>
      <span class="status-chunk">合法 JSON</span>
      <span class="status-sep">·</span>
      <span class="status-chunk">{{ sizeDisplay }}</span>
      <span class="status-sep">·</span>
      <span class="status-chunk">{{ store.lineCount }} 行</span>
    </template>
  </div>
</template>

<style scoped>
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
