import { ref, reactive } from 'vue'
import { defineStore } from 'pinia'
import { generatePasswords, evaluateStrength } from '@/utils/password'
import type { PasswordOptions } from '@/utils/password'
import { STRENGTH_COLORS, STRENGTH_LABELS } from '@/utils/password'

export const usePasswordStore = defineStore('password', () => {
  const opts = reactive<PasswordOptions>({
    length: 16,
    upper: true,
    lower: true,
    digits: true,
    symbols: true,
    excludeAmbiguous: false,
    count: 1,
  })

  const passwords = ref<string[]>([])

  function generate() {
    passwords.value = generatePasswords({ ...opts })
  }

  function getStrength(pw: string) {
    return evaluateStrength(pw)
  }

  function copy(pw: string) {
    navigator.clipboard.writeText(pw)
  }

  function copyAll() {
    navigator.clipboard.writeText(passwords.value.join('\n'))
  }

  return {
    opts,
    passwords,
    generate,
    getStrength,
    copy,
    copyAll,
    STRENGTH_COLORS,
    STRENGTH_LABELS,
  }
})
