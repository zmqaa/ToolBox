<script setup lang="ts">
import { computed } from 'vue'
import { useJsonStore } from '@/stores/jsonStore'
import JsonNode from './JsonNode.vue'
import type { JsonValue } from '@/types'

const store = useJsonStore()

const rootValue = computed<JsonValue | null>(() => store.parsedData)
</script>

<template>
  <div class="json-tree">
    <div v-if="!store.hasContent" class="tree-empty">
      <div class="empty-label">树形视图</div>
      <p>在左侧输入有效的 JSON 后，解析后的树形结构将显示在这里。</p>
    </div>
    <div v-else-if="store.error" class="tree-error">
      <div class="error-label">解析错误</div>
      <p>JSON 解析失败，请检查输入内容是否存在语法错误。</p>
    </div>
    <div v-else-if="rootValue !== null" class="tree-content">
      <JsonNode key-name="" :value="rootValue" :depth="0" :default-expanded="true" />
    </div>
  </div>
</template>

<style scoped>
.json-tree {
  flex: 1;
  padding: 20px;
  overflow: auto;
  background: var(--bg-primary);
}

.tree-empty,
.tree-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  gap: 10px;
  padding: 40px;
}

.empty-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 1px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  border: 1px dashed var(--border-color);
  padding: 6px 16px;
  border-radius: 4px;
}

.tree-empty p {
  color: var(--text-muted);
  font-size: 15px;
  max-width: 280px;
  line-height: 1.6;
}

.tree-error {
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

.tree-error p {
  color: var(--color-error);
  font-size: 15px;
  max-width: 320px;
  line-height: 1.6;
}

.tree-content {
  min-width: max-content;
}
</style>
