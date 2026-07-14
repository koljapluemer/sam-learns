import { computed, watchEffect, type Ref } from 'vue'
import { preferredLocale, setPreferredLocale } from './preferredLocale'
import { resolveEffectiveLocale } from './resolveEffectiveLocale'

export type MessageValue = string | { [key: string]: MessageValue }
export type MessageDictionary = Record<string, MessageValue>

export type CreateLocalI18nConfig<TLocale extends string, TMessages extends Record<TLocale, MessageDictionary>> = {
  messages: TMessages
  locales: readonly TLocale[]
  defaultLocale: TLocale
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
  const { messages, locales, defaultLocale } = config

  // Effective locale = the shared, global preferred locale intersected with what THIS
  // app actually supports. Apps with a restricted locale set (e.g. German-only) are
  // meant to stay restricted regardless of the global preference — see docs/adding-an-app.md.
  const currentLocale = computed(() => resolveEffectiveLocale(locales, defaultLocale, preferredLocale.value))

  function setAppLocale(locale: TLocale) {
    setPreferredLocale(locale)
  }

  function getStoredLocale(): TLocale {
    return currentLocale.value
  }

  function useAppI18n() {
    // Tied to the calling component's lifecycle: keeps `<html lang>` pointed at
    // whichever app is actually mounted, and stops updating once that app unmounts.
    watchEffect(() => {
      document.documentElement.lang = currentLocale.value
    })

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
