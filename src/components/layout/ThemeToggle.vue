<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'

const theme = useThemeStore()
</script>

<template>
  <div class="theme-toggle" @click="theme.toggle" :title="`当前：${theme.resolved === 'dark' ? '深色模式' : '浅色模式'} — 点击切换`">
    <span class="theme-indicator" :class="theme.resolved"></span>
    <span class="theme-label">{{ theme.resolved === 'dark' ? '深色' : '浅色' }}</span>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 24px;
  border-top: 1px solid var(--border-color);
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
  margin-top: auto;
}

.theme-toggle:hover {
  background: var(--bg-sidebar-hover);
}

.theme-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid;
}

.theme-indicator.light {
  background: #fbbf24;
  border-color: #f59e0b;
  box-shadow: 0 0 6px rgba(251, 191, 36, 0.4);
}

.theme-indicator.dark {
  background: #6366f1;
  border-color: #818cf8;
  box-shadow: 0 0 6px rgba(99, 102, 241, 0.4);
}

.theme-label {
  font-size: 15px;
  color: var(--text-sidebar);
  font-weight: 500;
}
</style>
