import { ref, type Ref } from 'vue'

export type MessageValue = string | { [key: string]: MessageValue }
export type MessageDictionary = Record<string, MessageValue>

export type CreateLocalI18nConfig<TLocale extends string, TMessages extends Record<TLocale, MessageDictionary>> = {
  messages: TMessages
  locales: readonly TLocale[]
  defaultLocale: TLocale
  storageKey: string
}

export type LocalI18n<TLocale extends string> = {
  useAppI18n: () => {
    locale: Ref<TLocale>
    t: (path: string, params?: Record<string, string | number>) => string
  }
  setAppLocale: (locale: TLocale) => void
  getStoredLocale: () => TLocale
}

function resolveMessage(messages: MessageDictionary, path: string): string | undefined {
  const segments = path.split('.')
  let current: MessageValue | undefined = messages

  for (const segment of segments) {
    if (!current || typeof current === 'string') {
      return undefined
    }

    current = current[segment]
  }

  return typeof current === 'string' ? current : undefined
}

function formatMessage(template: string, params?: Record<string, string | number>) {
  if (!params) {
    return template
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? `{${key}}`))
}

export function createLocalI18n<TLocale extends string, TMessages extends Record<TLocale, MessageDictionary>>(
  config: CreateLocalI18nConfig<TLocale, TMessages>
): LocalI18n<TLocale> {
  const { messages, locales, defaultLocale, storageKey } = config

  function isValidLocale(value: string | null): value is TLocale {
    return value !== null && (locales as readonly string[]).includes(value)
  }

  function getStoredLocale(): TLocale {
    const stored = window.localStorage.getItem(storageKey)
    return isValidLocale(stored) ? stored : defaultLocale
  }

  function setStoredLocale(locale: TLocale) {
    window.localStorage.setItem(storageKey, locale)
  }

  const currentLocale = ref(getStoredLocale()) as Ref<TLocale>
  document.documentElement.lang = currentLocale.value

  function setAppLocale(locale: TLocale) {
    currentLocale.value = locale
    setStoredLocale(locale)
    document.documentElement.lang = locale
  }

  function useAppI18n() {
    return {
      locale: currentLocale,
      t(path: string, params?: Record<string, string | number>) {
        const fallback = resolveMessage(messages[defaultLocale], path) ?? path
        const template = resolveMessage(messages[currentLocale.value], path) ?? fallback
        return formatMessage(template, params)
      }
    }
  }

  return { useAppI18n, setAppLocale, getStoredLocale }
}
