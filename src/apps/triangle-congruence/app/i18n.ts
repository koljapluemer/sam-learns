import { createLocalI18n } from '@/shared/i18n/createLocalI18n'

const messages = {
  de: {
    app: {
      title: 'Kongruenzsätze'
    },
    identifyTheorem: {
      heading: 'Woran kannst du erkennen, dass die beiden Dreiecke kongruent sind?',
      chooseHeading: 'Wähle den richtigen Kongruenzsatz:',
      options: {
        sws: {
          title: 'sws',
          explanation: 'Zwei Seiten haben die gleiche Länge, und der eingeschlossene Winkel ist gleich groß.'
        },
        sss: {
          title: 'sss',
          explanation: 'Alle drei Seitenlängen stimmen überein'
        },
        wsw: {
          title: 'wsw',
          explanation: 'Eine Seitenlänge und die beiden anliegenden Winkel stimmen überein'
        },
        ssw: {
          title: 'SsW',
          explanation: 'Zwei Seiten und die Größe des Winkels gegenüber der längeren Seite stimmen überein'
        }
      }
    },
    cloze: {
      heading: 'Fülle die Lücke.',
      noDistractor: '(keine)',
      answerPlaceholder: 'Deine Antwort',
      checkAnswer: 'Antwort prüfen',
      revealLetter: 'Zeige einen Buchstaben'
    },
    feedback: {
      positive0: 'Sehr gut!',
      positive1: 'Stark!',
      positive2: 'Super gemacht!',
      positive3: 'Perfekt!',
      positive4: 'Ausgezeichnet!'
    },
    allLearned: {
      title: 'Herzlichen Glückwunsch!',
      subtitle: 'Du hast alle Kongruenzsätze erfolgreich gelernt!'
    },
    loading: {
      label: 'Lädt'
    }
  }
} as const

export const locales = ['de'] as const
export type AppLocale = (typeof locales)[number]

export const { useAppI18n, setAppLocale, getStoredLocale } = createLocalI18n({
  messages,
  locales,
  defaultLocale: 'de'
})
