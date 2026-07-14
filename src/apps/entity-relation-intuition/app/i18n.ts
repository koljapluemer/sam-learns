import { createLocalI18n } from '@/shared/i18n/createLocalI18n'

const messages = {
  en: {
    app: {
      title: 'ER Diagram Intuition',
      language: 'Language'
    },
    locale: {
      en: 'English',
      de: 'Deutsch'
    },
    loading: {
      label: 'Loading…'
    },
    noScenarios: {
      title: 'No scenarios available.',
      subtitle: 'Check back later.'
    },
    exercise: {
      revealButton: 'Reveal example solutions',
      examplesHeading: 'Example solutions',
      rateHeading: 'How did your sketch compare?'
    },
    rating: {
      again: 'Way off',
      hard: 'Partially right',
      good: 'Mostly right',
      easy: 'Nailed it'
    },
    exerciseprompt: 'Your job is to build a piece of software reflecting the following scenario. Construct an ER diagram.'
  },
  de: {
    app: {
      title: 'ER-Diagramm-Intuition',
      language: 'Sprache'
    },
    locale: {
      en: 'English',
      de: 'Deutsch'
    },
    loading: {
      label: 'Lädt…'
    },
    noScenarios: {
      title: 'Keine Szenarien verfügbar.',
      subtitle: 'Schau später wieder vorbei.'
    },
    exercise: {
      revealButton: 'Beispiellösungen zeigen',
      examplesHeading: 'Beispiellösungen',
      rateHeading: 'Wie gut passte deine Skizze?'
    },
    rating: {
      again: 'Daneben',
      hard: 'Teilweise richtig',
      good: 'Größtenteils richtig',
      easy: 'Genau richtig'
    },
    exerciseprompt: 'Stell dir vor, dass du den Auftrag hast, Software für das folgende Szenario zu entiwckeln. Konzipiere ein ER-Diagramm.'
  }
} as const

export const locales = ['en', 'de'] as const
export type AppLocale = (typeof locales)[number]

export const { useAppI18n, setAppLocale, getStoredLocale } = createLocalI18n({
  messages,
  locales,
  defaultLocale: 'en'
})
