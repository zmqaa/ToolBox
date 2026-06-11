<template>
  <div class="sidebar-logo">
    <router-link to="/" class="logo-link">
      <span class="logo-icon">&gt;_</span>
      <span class="logo-text">DevToolbox</span>
    </router-link>
  </div>
</template>

<style scoped>
.sidebar-logo {
  padding: 24px 24px 20px;
  border-bottom: 1px solid var(--border-color);
}

.logo-link {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-sidebar-active);
  text-decoration: none;
}

.logo-icon {
  font-size: 22px;
  font-weight: 700;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  color: var(--color-brand);
  line-height: 1;
}

.logo-text {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.2px;
}
</style>
