import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ThemeMode } from '@/types'

const STORAGE_KEY = 'dev-toolbox-theme'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>(
    (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'auto'
  )

  const resolved = ref<'light' | 'dark'>(
    mode.value === 'auto' ? getSystemTheme() : mode.value
  )

  function applyTheme(theme: 'light' | 'dark') {
    document.documentElement.setAttribute('data-theme', theme)
    resolved.value = theme
  }

  function setMode(newMode: ThemeMode) {
    mode.value = newMode
    localStorage.setItem(STORAGE_KEY, newMode)
    applyTheme(newMode === 'auto' ? getSystemTheme() : newMode)
  }

  function toggle() {
    // 在 light / dark 之间切换（跳过 auto）
    const current = resolved.value
    setMode(current === 'dark' ? 'light' : 'dark')
  }

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    if (mode.value === 'auto') {
      applyTheme(getSystemTheme())
    }
  })

  // 初始化
  applyTheme(mode.value === 'auto' ? getSystemTheme() : mode.value)

  return { mode, resolved, setMode, toggle }
})
