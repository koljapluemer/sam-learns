import { ref, watch, type WatchSource } from 'vue'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutoSave(
  sources: WatchSource<unknown>[],
  saveFn: () => Promise<void>,
  options: { debounceMs?: number } = {}
) {
  const { debounceMs = 500 } = options
  const status = ref<SaveStatus>('idle')
  let timeout: number | null = null
  let fadeTimeout: number | null = null

  watch(
    sources,
    () => {
      if (timeout) clearTimeout(timeout)
      if (fadeTimeout) clearTimeout(fadeTimeout)

      status.value = 'idle' // Reset while typing

      timeout = window.setTimeout(async () => {
        status.value = 'saving'
        try {
          await saveFn()
          status.value = 'saved'
          // Fade back to idle after 2s
          fadeTimeout = window.setTimeout(() => {
            status.value = 'idle'
          }, 2000)
        } catch {
          status.value = 'error'
        }
      }, debounceMs)
    },
    { deep: true }
  )

  return { status }
}
