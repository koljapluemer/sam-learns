import { createLocalI18n } from '@/shared/i18n/createLocalI18n'

const messages = {
  en: {
    app: {
      title: 'World Map'
    },
    exercise: {
      instruction: 'Find {country} in its neighborhood',
      instructionWorldMap: 'Find {country} on the world map'
    },
    loading: {
      label: 'Loading…'
    },
    noExercises: {
      title: 'No countries enabled yet.',
      subtitle: 'Enable some in the CMS.'
    }
  }
} as const

const locales = ['en'] as const
export type AppLocale = (typeof locales)[number]

export const { useAppI18n, setAppLocale, getStoredLocale } = createLocalI18n({
  messages,
  locales,
  defaultLocale: 'en',
  storageKey: 'world-map:locale'
})
