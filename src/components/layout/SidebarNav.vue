<script setup lang="ts">
import { useRoute } from 'vue-router'
import type { NavItem } from '@/types'

const route = useRoute()

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: '#', available: true },
  { path: '/json-viewer', label: 'JSON 查看器', icon: '{}', available: true },
  { path: '/diff', label: '文本对比', icon: '<=>', available: true },
  { path: '/sql-formatter', label: 'SQL 格式化', icon: 'SQ', available: true },
  { path: '/list-formatter', label: '列值拼接', icon: '[]', available: true },
  { path: '/timestamp', label: '时间戳转换', icon: 'ts', available: true },
  { path: '/password', label: '密码生成器', icon: '**', available: true },
  { path: '/color', label: '颜色转换', icon: '#', available: true },
]

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <nav class="sidebar-nav">
    <div class="nav-section-title">工具</div>
    <ul class="nav-list">
      <li v-for="item in navItems" :key="item.path">
        <router-link
          :to="item.path"
          :class="['nav-item', { active: isActive(item.path), disabled: !item.available }]"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="!item.available" class="nav-badge">即将</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.sidebar-nav {
  flex: 1;
  padding: 16px 0;
  overflow-y: auto;
}

.nav-section-title {
  padding: 8px 24px 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 1px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 24px;
  color: var(--text-sidebar);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
  border-left: 3px solid transparent;
  margin: 0 0;
}

.nav-item:hover:not(.disabled) {
  background: var(--bg-sidebar-hover);
  color: var(--text-sidebar-active);
}

.nav-item.active {
  background: rgba(4, 120, 87, 0.12);
  color: var(--text-sidebar-active);
  border-left-color: var(--color-brand);
  font-weight: 600;
}

.nav-item.disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.nav-icon {
  font-size: 15px;
  font-weight: 600;
  width: 26px;
  text-align: center;
  line-height: 1;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  color: var(--color-brand);
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
  letter-spacing: 0.5px;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}
</style>
