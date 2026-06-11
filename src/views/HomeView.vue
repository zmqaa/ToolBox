<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { NavItem } from '@/types'

const router = useRouter()

const tools: NavItem[] = [
  { path: '/json-viewer',    label: 'JSON 查看器',   icon: '{}', available: true },
  { path: '/diff',           label: '文本对比',      icon: '<=>', available: true },
  { path: '/sql-formatter',  label: 'SQL 格式化',    icon: 'SQ', available: true },
  { path: '/list-formatter', label: '列值拼接',      icon: '[]', available: true },
  { path: '/timestamp',      label: '时间戳转换',    icon: 'ts', available: true },
  { path: '/password',       label: '密码生成器',    icon: '**', available: true },
  { path: '/color',          label: '颜色转换',      icon: '#',  available: true },
]

function goTool(path: string, available: boolean) {
  if (available) {
    router.push(path)
  }
}
</script>

<template>
  <div class="home">
    <div class="home-header">
      <h1>&gt; DevToolbox</h1>
      <p class="home-subtitle">开发者常用工具集。所有数据均在浏览器本地处理，不会上传至服务器。</p>
    </div>

    <div class="tool-grid">
      <div
        v-for="tool in tools"
        :key="tool.path"
        :class="['tool-card', { 'tool-disabled': !tool.available }]"
        @click="goTool(tool.path, tool.available)"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <span class="tool-name">{{ tool.label }}</span>
        <span v-if="!tool.available" class="tool-coming">即将</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home {
  max-width: 960px;
  margin: 0 auto;
  padding: 56px 40px;
}

.home-header {
  margin-bottom: 44px;
}

.home-header h1 {
  font-size: 30px;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--text-primary);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.home-subtitle {
  font-size: 16px;
  color: var(--text-secondary);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 28px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.tool-card:hover:not(.tool-disabled) {
  border-color: var(--color-brand);
  box-shadow: 0 0 0 1px rgba(5, 150, 105, 0.15);
  transform: translateY(-2px);
}

.tool-card.tool-disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tool-icon {
  font-size: 30px;
  line-height: 1;
  font-weight: 700;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  color: var(--color-brand);
}

.tool-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.tool-coming {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg-secondary);
  padding: 2px 10px;
  border-radius: 3px;
  letter-spacing: 0.5px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
</style>
