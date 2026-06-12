<script setup lang="ts">
import { ref, computed } from 'vue'
import type { JsonValue } from '@/types'
import { highlightValue } from '@/utils/syntaxHighlight'
import { isExpandable, getChildCount } from '@/utils/jsonParser'

const props = defineProps<{
  keyName: string
  value: JsonValue
  depth: number
  defaultExpanded?: boolean
}>()

const isExpanded = ref(props.depth < 3 || (props.defaultExpanded ?? false))

const expandable = computed(() => isExpandable(props.value))
const childCount = computed(() => (expandable.value ? getChildCount(props.value) : 0))

const isArray = computed(() => Array.isArray(props.value))
const bracket = computed(() => (isArray.value ? ['[', ']'] : ['{', '}']))
const typeLabel = computed(() => (isArray.value ? `Array[${childCount.value}]` : `Object{${childCount.value}}`))

const entries = computed<{ key: string; value: JsonValue }[]>(() => {
  const v = props.value
  if (v === null || typeof v !== 'object') return []
  if (Array.isArray(v)) {
    return (v as JsonValue[]).map((item, i) => ({ key: String(i), value: item }))
  }
  return Object.entries(v as Record<string, JsonValue>).map(([key, val]) => ({ key, value: val }))
})

const leafDisplay = computed(() => {
  return highlightValue(props.value)
})

function toggle() {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="json-node">
    <!-- 可展开节点 -->
    <template v-if="expandable">
      <div class="node-line" @click="toggle">
        <span class="expand-arrow">{{ isExpanded ? '[-]' : '[+]' }}</span>
        <span v-if="keyName !== ''" class="node-key json-key">"{{ keyName }}"</span>
        <span v-if="keyName !== ''" class="node-colon">: </span>
        <span class="node-bracket">{{ bracket[0] }}</span>
        <span class="node-type-label">{{ typeLabel }}</span>
        <span v-if="!isExpanded" class="node-bracket">{{ bracket[1] }}</span>
      </div>
      <div v-show="isExpanded" class="node-children">
        <JsonNode
          v-for="entry in entries"
          :key="entry.key"
          :key-name="entry.key"
          :value="entry.value"
          :depth="depth + 1"
        />
        <div class="node-line closing-bracket">
          <span class="node-bracket">{{ bracket[1] }}</span>
        </div>
      </div>
    </template>

    <!-- 叶子节点 -->
    <div v-else class="node-line leaf">
      <span class="node-key json-key">"{{ keyName }}"</span>
      <span class="node-colon">: </span>
      <span v-html="leafDisplay.html"></span>
    </div>
  </div>
</template>

<style scoped>
.json-node {
  font-family: 'Cascadia Code', 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  font-size: 15px;
  line-height: 1.75;
  cursor: default;
}

.node-line {
  display: flex;
  align-items: baseline;
  gap: 0;
  padding: 1.5px 0;
  white-space: nowrap;
}

.node-line:hover {
  background: rgba(4, 120, 87, 0.04);
  border-radius: 3px;
}

.expand-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-label);
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  font-weight: 600;
  margin-right: 2px;
}

.expand-arrow:hover {
  color: var(--color-brand);
}

.node-key {
  flex-shrink: 0;
}

.node-colon {
  color: var(--text-primary);
  margin-right: 4px;
}

.node-bracket {
  color: var(--text-primary);
}

.node-type-label {
  color: var(--text-muted);
  font-size: 13px;
  font-style: italic;
  font-weight: 500;
  margin: 0 4px;
}

.node-children {
  padding-left: 22px;
}

.leaf {
  cursor: default;
}

.closing-bracket {
  padding-left: 0;
}
</style>
