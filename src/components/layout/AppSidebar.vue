<script setup lang="ts">
import SidebarLogo from './SidebarLogo.vue'
import SidebarNav from './SidebarNav.vue'
import ThemeToggle from './ThemeToggle.vue'
</script>

<template>
  <aside class="sidebar">
    <SidebarLogo />
    <SidebarNav />
    <ThemeToggle />
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: var(--bg-sidebar);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width 0.2s;
  overflow: hidden;
}
</style>
