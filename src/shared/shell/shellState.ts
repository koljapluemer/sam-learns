import { onMounted, onUnmounted, reactive, type Component } from 'vue'

export type ShellLayout = 'contained' | 'full-bleed'

export type ShellRegistration = {
  title: string
  icon: Component | null
  layout: ShellLayout
  locales: readonly string[]
  about: Component | null
  settings: Component | null
  stats: Component | null
}

export const DEFAULT_SHELL_STATE: ShellRegistration = {
  title: 'Sam Learns Things',
  icon: null,
  layout: 'contained',
  locales: [],
  about: null,
  settings: null,
  stats: null
}

export const shellState = reactive<ShellRegistration>({ ...DEFAULT_SHELL_STATE })

type ShellRegistrationInput = Partial<ShellRegistration>

export function useAppShell(registration: ShellRegistrationInput | (() => ShellRegistrationInput)) {
  onMounted(() => {
    const resolved = typeof registration === 'function' ? registration() : registration
    Object.assign(shellState, DEFAULT_SHELL_STATE, resolved)
  })

  onUnmounted(() => {
    Object.assign(shellState, DEFAULT_SHELL_STATE)
  })
}
