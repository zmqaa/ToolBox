<script setup lang="ts">
import JsonInput from '@/components/json/JsonInput.vue'
import JsonTree from '@/components/json/JsonTree.vue'
import StatusBar from '@/components/json/StatusBar.vue'
</script>

<template>
  <div class="json-viewer">
    <div class="viewer-header">
      <h2>JSON 查看器</h2>
      <span class="viewer-desc">左侧粘贴 JSON 文本，右侧浏览语法高亮的树形结构</span>
    </div>
    <div class="viewer-body">
      <div class="viewer-input-panel">
        <JsonInput />
      </div>
      <div class="viewer-tree-panel">
        <JsonTree />
      </div>
    </div>
    <StatusBar />
  </div>
</template>

<style scoped>
.json-viewer {
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

.viewer-input-panel {
  width: 45%;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.viewer-tree-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
