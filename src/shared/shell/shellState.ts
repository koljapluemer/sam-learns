import { onMounted, onUnmounted, reactive, type Component } from 'vue'

export type ShellRegistration = {
  title: string
  icon: Component | null
  locales: readonly string[]
}

export const DEFAULT_SHELL_STATE: ShellRegistration = {
  title: 'Sam Learns Things',
  icon: null,
  locales: []
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
