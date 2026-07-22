// Port of linguanodon's infinitesentences app/store.js (createLanguagePreferencesStore/
// createUserSettingsStore/createPracticeStore) onto this repo's useLocalSetting
// instead of a bespoke localStorage key - no accounts/sync, so mergeRemoteState
// and the queueEvent/queueState calls from the original are dropped entirely
// (see docs/linguanodon-import.md's "no accounts, no sync" decision).

import { createEmptyCard, fsrs, type Card, type Grade } from 'ts-fsrs'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'

interface LanguagePreferences {
  nativeIso: string | null
  targetIso: string | null
}

interface UserSettings {
  dailySentenceGoal: number
}

type SerializedCard = Omit<Card, 'due' | 'last_review'> & { due: string; last_review?: string }

interface PracticeState {
  glossCards: Record<string, SerializedCard>
  learnedSentences: Record<string, string>
  dailySentenceCounts: Record<string, number>
  dailySentenceCountsByLanguage: Record<string, number>
}

const scheduler = fsrs()

function serializeCard(card: Card): SerializedCard {
  return {
    ...card,
    due: card.due.toISOString(),
    last_review: card.last_review ? card.last_review.toISOString() : undefined
  }
}

function deserializeCard(serialized: SerializedCard): Card {
  return {
    ...serialized,
    due: new Date(serialized.due),
    last_review: serialized.last_review ? new Date(serialized.last_review) : undefined
  }
}

function formatDay(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function createLanguagePreferencesStore() {
  const state = useLocalSetting<LanguagePreferences>('infinitesentences.language-preferences', {
    nativeIso: null,
    targetIso: null
  })

  return {
    get nativeIso() {
      return state.value.nativeIso
    },
    get targetIso() {
      return state.value.targetIso
    },
    get hasLanguagesSet() {
      return Boolean(state.value.nativeIso) && Boolean(state.value.targetIso)
    },
    setLanguages(native: string, target: string): void {
      state.value.nativeIso = native
      state.value.targetIso = target
    },
    clearLanguages(): void {
      state.value.nativeIso = null
      state.value.targetIso = null
    }
  }
}

export function createUserSettingsStore() {
  const state = useLocalSetting<UserSettings>('infinitesentences.user-settings', { dailySentenceGoal: 10 })

  return {
    get dailySentenceGoal() {
      return state.value.dailySentenceGoal
    },
    setDailySentenceGoal(goal: number): void {
      state.value.dailySentenceGoal = Math.max(1, Math.floor(goal))
    }
  }
}

export function createPracticeStore() {
  const state = useLocalSetting<PracticeState>('infinitesentences.practice-tracking', {
    glossCards: {},
    learnedSentences: {},
    dailySentenceCounts: {},
    dailySentenceCountsByLanguage: {}
  })

  return {
    getGlossCard(glossKey: string): Card | null {
      const serialized = state.value.glossCards[glossKey]
      return serialized ? deserializeCard(serialized) : null
    },

    isGlossDue(glossKey: string, now: Date = new Date()): boolean {
      const card = this.getGlossCard(glossKey)
      return card ? card.due <= now : false
    },

    getGlossDueDate(glossKey: string): Date | null {
      const card = this.getGlossCard(glossKey)
      return card ? card.due : null
    },

    recordGlossReview(glossKey: string, rating: Grade): void {
      const now = new Date()
      const existing: Card = this.getGlossCard(glossKey) ?? createEmptyCard(now)
      const { card } = scheduler.next(existing, now, rating)
      state.value.glossCards[glossKey] = serializeCard(card)
    },

    markSentenceLearned(sentenceKey: string): void {
      state.value.learnedSentences[sentenceKey] = new Date().toISOString()
    },

    isSentenceLearned(sentenceKey: string): boolean {
      return Boolean(state.value.learnedSentences[sentenceKey])
    },

    recordSentenceCompleted(targetIso?: string): void {
      const today = formatDay(new Date())
      state.value.dailySentenceCounts[today] = (state.value.dailySentenceCounts[today] ?? 0) + 1

      if (targetIso) {
        const key = `${today}:${targetIso}`
        state.value.dailySentenceCountsByLanguage[key] = (state.value.dailySentenceCountsByLanguage[key] ?? 0) + 1
      }
    },

    getLast14DaysSentenceCounts(): { date: string; count: number }[] {
      const today = new Date()
      const fourteenDaysAgo = new Date(today)
      fourteenDaysAgo.setDate(today.getDate() - 13)

      const result: { date: string; count: number }[] = []
      for (let i = 0; i < 14; i++) {
        const date = new Date(fourteenDaysAgo)
        date.setDate(fourteenDaysAgo.getDate() + i)
        const dateStr = formatDay(date)
        result.push({ date: dateStr, count: state.value.dailySentenceCounts[dateStr] || 0 })
      }
      return result
    },

    getLast14DaysSentenceCountsByLanguage(): { date: string; counts: Record<string, number> }[] {
      const today = new Date()
      const fourteenDaysAgo = new Date(today)
      fourteenDaysAgo.setDate(today.getDate() - 13)

      const result: { date: string; counts: Record<string, number> }[] = []
      for (let i = 0; i < 14; i++) {
        const date = new Date(fourteenDaysAgo)
        date.setDate(fourteenDaysAgo.getDate() + i)
        const dateStr = formatDay(date)

        const counts: Record<string, number> = {}
        for (const [key, count] of Object.entries(state.value.dailySentenceCountsByLanguage)) {
          const [keyDate, lang] = key.split(':')
          if (keyDate === dateStr && lang) counts[lang] = count
        }
        result.push({ date: dateStr, counts })
      }
      return result
    },

    getAllPracticedLanguages(): string[] {
      const languages = new Set<string>()
      for (const key of Object.keys(state.value.dailySentenceCountsByLanguage)) {
        const lang = key.split(':')[1]
        if (lang) languages.add(lang)
      }
      return Array.from(languages).sort()
    },

    getCurrentStreak(): number {
      const today = new Date()
      let currentStreak = 0
      let missedOne = false

      for (let i = 0; i < 365 * 10; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = formatDay(date)
        const practiced = (state.value.dailySentenceCounts[dateStr] || 0) > 0

        if (practiced) {
          currentStreak++
          missedOne = false
        } else if (missedOne) {
          break
        } else {
          missedOne = true
        }
      }

      return currentStreak
    }
  }
}
