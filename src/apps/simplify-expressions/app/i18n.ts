import { createLocalI18n } from '@/shared/i18n/createLocalI18n'

const messages = {
  de: {
    app: {
      title: 'Termtrainer',
      practice: 'Üben',
      language: 'Sprache',
      feedback: 'Feedback',
      footerNote: 'Von Kolja Sam (koljasam.com). Es werden pseudonyme Lerndaten gespeichert. Für die App werden funktionale Cookies verwendet.'
    },
    feedbackForm: {
      title: 'Feedback',
      intro: 'Was hilft dir, was fehlt noch?',
      helpfulForLearningLabel: 'Wie hilfreich ist die App fürs Lernen?',
      improveUsefulnessLabel: 'Was sollte verbessert werden, damit die App nützlicher ist?',
      anythingElseLabel: 'Noch etwas?',
      websiteLabel: 'Website',
      submit: 'Senden',
      sending: 'Sendet',
      cancel: 'Abbrechen',
      close: 'Schließen',
      closeSymbol: '×',
      error: 'Feedback konnte nicht gesendet werden.'
    },
    tutor: {
      title: 'Terme vereinfachen',
      intro: 'Vereinfache den Term so weit wie möglich.',
      exerciseLabel: 'Aufgabe',
      answerLabel: 'Deine Antwort',
      answerPlaceholder: 'Vereinfachten Term eingeben',
      mathInputToolbar: {
        label: 'Mathematische Zeichen',
        square: 'Quadrat einfügen',
        squareSymbol: 'x²',
        power: 'Potenz einfügen',
        powerSymbol: 'xⁿ',
        leftParen: 'Öffnende Klammer einfügen',
        leftParenSymbol: '(',
        rightParen: 'Schließende Klammer einfügen',
        rightParenSymbol: ')',
        plus: 'Plus einfügen',
        plusSymbol: '+',
        minus: 'Minus einfügen',
        minusSymbol: '−',
        multiply: 'Mal einfügen',
        multiplySymbol: '·',
        divide: 'Geteilt einfügen',
        divideSymbol: '÷'
      },
      check: 'Prüfen',
      giveUp: 'Aufgeben & Lösung zeigen',
      next: 'Nächste Aufgabe',
      loadingAction: 'Lädt',
      loadingLabel: 'Lädt',
      difficultyBand: 'Stufe {value}',
      feedback: {
        idle: 'Vereinfache den Term.',
        loading: 'Eine passende Aufgabe wird gewählt.',
        revealed: 'Eine mögliche Lösung:',
        empty: 'Gib zuerst eine Antwort ein.',
        parseError: 'Ich kann diese Eingabe noch nicht lesen.',
        notEquivalent: 'Der Term ist nicht gleichwertig.',
        copied: 'Der Term ist gleichwertig, aber noch nicht vereinfacht.',
        tooComplex: 'Das ist richtig, aber noch nicht einfach genug.',
        correct: 'Richtig. Eine mögliche Lösung:'
      },
      topics: {
        'combine-like-terms': 'Gleichartige Terme',
        'normalize-product-powers': 'Potenzen in Produkten',
        'remove-parentheses-with-sign': 'Klammern mit Vorzeichen',
        'distribute-monomial-over-sum': 'Monom ausmultiplizieren',
        'expand-monomial-times-parenthesized-product': 'Produkt mit Klammer ausmultiplizieren',
        'expand-binomial-times-binomial': 'Binome ausmultiplizieren',
        'signed-product-with-follow-up-combine': 'Vorzeichen und Produkt',
        'challenge-mixed-expressions': 'Mischaufgabe'
      }
    },
    locale: {
      de: 'Deutsch',
      en: 'English'
    }
  },
  en: {
    app: {
      title: 'Expression Tutor',
      practice: 'Practice',
      language: 'Language',
      feedback: 'Feedback',
      footerNote: 'Made by Kolja Sam (koljasam.com). Pseudonymous learning data is stored. Functional cookies are used for the app.'
    },
    feedbackForm: {
      title: 'Feedback',
      intro: 'What helps you learn, and what is missing?',
      helpfulForLearningLabel: 'How helpful is the app for learning?',
      improveUsefulnessLabel: 'What could be improved to make the app more useful?',
      anythingElseLabel: 'Anything else?',
      websiteLabel: 'Website',
      submit: 'Send',
      sending: 'Sending',
      cancel: 'Cancel',
      close: 'Close',
      closeSymbol: '×',
      error: 'Could not send feedback.'
    },
    tutor: {
      title: 'Simplify expressions',
      intro: 'Simplify the expression as far as possible.',
      exerciseLabel: 'Exercise',
      answerLabel: 'Your answer',
      answerPlaceholder: 'Enter the simplified expression',
      mathInputToolbar: {
        label: 'Math symbols',
        square: 'Insert squared',
        squareSymbol: 'x²',
        power: 'Insert exponent',
        powerSymbol: 'xⁿ',
        leftParen: 'Insert opening parenthesis',
        leftParenSymbol: '(',
        rightParen: 'Insert closing parenthesis',
        rightParenSymbol: ')',
        plus: 'Insert plus',
        plusSymbol: '+',
        minus: 'Insert minus',
        minusSymbol: '−',
        multiply: 'Insert multiplication',
        multiplySymbol: '·',
        divide: 'Insert division',
        divideSymbol: '÷'
      },
      check: 'Check',
      giveUp: 'Give up & Show Solution',
      next: 'Next exercise',
      loadingAction: 'Loading',
      loadingLabel: 'Loading',
      difficultyBand: 'Band {value}',
      feedback: {
        idle: 'Simplify the expression.',
        loading: 'Choosing the next exercise.',
        revealed: 'One possible answer:',
        empty: 'Enter an answer first.',
        parseError: 'I cannot read that input yet.',
        notEquivalent: 'The expression is not equivalent.',
        copied: 'The expression is equivalent, but not simplified yet.',
        tooComplex: 'That is correct, but not simple enough yet.',
        correct: 'Correct. One possible answer:'
      },
      topics: {
        'combine-like-terms': 'Combine like terms',
        'normalize-product-powers': 'Normalize product powers',
        'remove-parentheses-with-sign': 'Remove parentheses with sign',
        'distribute-monomial-over-sum': 'Distribute a monomial',
        'expand-monomial-times-parenthesized-product': 'Expand a monomial product',
        'expand-binomial-times-binomial': 'Expand binomials',
        'signed-product-with-follow-up-combine': 'Signed product and combine',
        'challenge-mixed-expressions': 'Challenge'
      }
    },
    locale: {
      de: 'Deutsch',
      en: 'English'
    }
  }
} as const

export const locales = ['de', 'en'] as const
export type AppLocale = (typeof locales)[number]

export const { useAppI18n, setAppLocale, getStoredLocale } = createLocalI18n({
  messages,
  locales,
  defaultLocale: 'de'
})
