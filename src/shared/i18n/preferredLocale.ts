import { ref, readonly } from 'vue'

const STORAGE_KEY = 'samlearns:preferredLocale'

function detectBrowserLocale(): string {
  const lang = window.navigator.language?.split('-')[0]
  return lang || 'en'
}

const preferredLocaleState = ref<string>(
  window.localStorage.getItem(STORAGE_KEY) ?? detectBrowserLocale()
)

export const preferredLocale = readonly(preferredLocaleState)

export function setPreferredLocale(locale: string) {
  preferredLocaleState.value = locale
  window.localStorage.setItem(STORAGE_KEY, locale)
}
