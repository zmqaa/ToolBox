<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
</script>

<template>
  <AppSidebar />
  <main class="main-content">
    <router-view />
  </main>
</template>

<style scoped>
.main-content {
  flex: 1;
  min-height: 100vh;
  overflow-y: auto;
  background: var(--bg-secondary);
}
</style>
