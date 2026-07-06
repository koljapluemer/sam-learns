export type AppLocale = 'de' | 'en'

const localeStorageKey = 'simplify-expressions:locale'
const defaultLocale: AppLocale = 'de'

export function getStoredLocale(): AppLocale {
  const stored = window.localStorage.getItem(localeStorageKey)
  return stored === 'en' || stored === 'de' ? stored : defaultLocale
}

export function setStoredLocale(locale: AppLocale) {
  window.localStorage.setItem(localeStorageKey, locale)
}
