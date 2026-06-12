<script setup lang="ts">
import { ref } from 'vue'
import { usePasswordStore } from '@/stores/passwordStore'

const store = usePasswordStore()

store.generate()

const LENGTH_PRESETS = [8, 12, 16, 20, 24, 32]

const justCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout>
function doCopy(text: string) {
  store.copy(text)
  justCopied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { justCopied.value = false }, 1500)
}

const allCopied = ref(false)
let allCopyTimer: ReturnType<typeof setTimeout>
function doCopyAll() {
  store.copyAll()
  allCopied.value = true
  clearTimeout(allCopyTimer)
  allCopyTimer = setTimeout(() => { allCopied.value = false }, 1500)
}
</script>

<template>
  <div class="password-tool">
    <div class="viewer-header">
      <h2>密码生成器</h2>
      <span class="viewer-desc">随机生成强密码，可调长度/字符集，支持批量生成</span>
    </div>

    <div class="viewer-body">
      <div class="pw-main">
        <!-- 设置区 -->
        <div class="settings-card">
          <div class="setting-row">
            <span class="setting-label">长度</span>
            <div class="len-group">
              <button
                v-for="n in LENGTH_PRESETS"
                :key="n"
                :class="['btn btn-option', { active: store.opts.length === n }]"
                @click="store.opts.length = n; store.generate()"
              >{{ n }}</button>
              <input
                type="number"
                class="len-input"
                :value="store.opts.length"
                @input="store.opts.length = Math.max(4, Math.min(128, Number(($event.target as HTMLInputElement).value))); store.generate()"
                min="4" max="128"
              />
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">字符集</span>
            <div class="checkbox-group">
              <label :class="['cb', { active: store.opts.upper }]">
                <input type="checkbox" v-model="store.opts.upper" @change="store.generate" /> A-Z
              </label>
              <label :class="['cb', { active: store.opts.lower }]">
                <input type="checkbox" v-model="store.opts.lower" @change="store.generate" /> a-z
              </label>
              <label :class="['cb', { active: store.opts.digits }]">
                <input type="checkbox" v-model="store.opts.digits" @change="store.generate" /> 0-9
              </label>
              <label :class="['cb', { active: store.opts.symbols }]">
                <input type="checkbox" v-model="store.opts.symbols" @change="store.generate" /> !@#$
              </label>
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">&nbsp;</span>
            <div class="checkbox-group">
              <label :class="['cb', { active: store.opts.excludeAmbiguous }]">
                <input type="checkbox" v-model="store.opts.excludeAmbiguous" @change="store.generate" />
                排除易混淆 (0/O/1/l/I)
              </label>
            </div>
          </div>
          <div class="setting-row">
            <span class="setting-label">数量</span>
            <div class="len-group">
              <button
                v-for="n in [1, 5, 10, 20]"
                :key="n"
                :class="['btn btn-option', { active: store.opts.count === n }]"
                @click="store.opts.count = n; store.generate()"
              >{{ n }}</button>
            </div>
          </div>
        </div>

        <!-- 结果区 -->
        <div class="pw-results" v-if="store.passwords.length">
          <div
            v-for="(pw, i) in store.passwords"
            :key="i"
            class="pw-row"
          >
            <div class="pw-strength-bar">
              <div
                class="pw-strength-fill"
                :style="{
                  width: store.getStrength(pw).score + '%',
                  background: store.STRENGTH_COLORS[store.getStrength(pw).level],
                }"
              ></div>
            </div>
            <code class="pw-text">{{ pw }}</code>
            <span
              class="pw-badge"
              :style="{ background: store.STRENGTH_COLORS[store.getStrength(pw).level] }"
            >{{ store.STRENGTH_LABELS[store.getStrength(pw).level] }} · {{ store.getStrength(pw).score }}分</span>
            <button class="btn btn-copy" @click="doCopy(pw)" :title="justCopied ? '已复制' : '复制'">{{ justCopied ? '✓' : '复制' }}</button>
          </div>
          <div class="pw-actions" v-if="store.passwords.length > 1">
            <button class="btn btn-secondary" @click="doCopyAll">{{ allCopied ? '已复制 ✓' : '复制全部' }}</button>
            <button class="btn btn-now" @click="store.generate">重新生成</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
      <span class="status-dot ok"></span>
      <span class="status-chunk">{{ store.passwords.length }} 个密码</span>
      <span class="status-sep">·</span>
      <span class="status-chunk">字符池 {{ [store.opts.upper ? 26 : 0, store.opts.lower ? 26 : 0, store.opts.digits ? 10 : 0, store.opts.symbols ? 28 : 0].reduce((a,b) => a + b, 0) }}</span>
      <span class="status-sep">·</span>
      <span class="status-chunk">排除混淆 {{ store.opts.excludeAmbiguous ? '开' : '关' }}</span>
    </div>
  </div>
</template>

<style scoped>
.password-tool {
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
  overflow: auto;
}

.pw-main {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 28px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* 设置卡片 */
.settings-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 4px 0;
}

.setting-row {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  gap: 16px;
  border-bottom: 1px solid var(--border-color);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-label {
  width: 56px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-muted);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.len-group {
  display: flex;
  gap: 4px;
  align-items: center;
}

.len-input {
  width: 58px;
  padding: 5px 8px;
  border: 1px solid var(--border-input);
  border-radius: 4px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 14px;
  text-align: center;
  outline: none;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.len-input:focus {
  border-color: var(--border-input-focus);
}

.checkbox-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.cb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  user-select: none;
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.cb.active {
  background: var(--color-brand-light);
  border-color: var(--color-brand);
  color: var(--text-primary);
}

.cb input { display: none; }

/* 结果 */
.pw-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pw-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.pw-strength-bar {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  background: var(--border-color);
  overflow: hidden;
  flex-shrink: 0;
}

.pw-strength-fill {
  width: 100%;
  height: 100%;
  transition: height 0.3s, background 0.3s;
}

.pw-text {
  flex: 1;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 16px;
  color: var(--text-primary);
  word-break: break-all;
  letter-spacing: 0.5px;
}

.pw-badge {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  padding: 2px 8px;
  border-radius: 3px;
  white-space: nowrap;
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.pw-actions {
  display: flex;
  gap: 10px;
  margin-top: 6px;
}

/* 按钮 */
.btn {
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: var(--font-weight-btn);
  transition: all 0.15s;
  font-family: inherit;
  cursor: pointer;
  border: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.btn-option {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.btn-option:hover {
  color: var(--text-primary);
  border-color: var(--text-muted);
}

.btn-option.active {
  background: var(--color-brand);
  color: var(--text-btn-brand);
  border-color: var(--color-brand);
}

.btn-copy {
  background: none;
  font-size: 14px;
  opacity: 0.4;
  padding: 4px 6px;
}

.btn-copy:hover {
  opacity: 1;
  background: var(--bg-secondary);
}

.btn-now {
  background: var(--color-brand);
  color: var(--text-btn-brand);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.btn-now:hover {
  filter: brightness(1.1);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--border-color);
}

/* 状态栏 */
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
