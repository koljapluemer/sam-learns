// Practice-session composable, ported from linguanodon's boringwords
// app/session.js + app/store.js. Same FSRS-backed next-card selection;
// review state now lives in this app's Dexie db instead of a localStorage
// JSON blob, and there is no server sync (queueEvent/queueState/pullState) -
// trials are logged to this repo's shared cross-app activity log instead.

import { ref } from 'vue'
import { createEmptyCard, fsrs, Rating, type Card, type Grade } from 'ts-fsrs'
import { appDb } from '../db/appDb'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { pickRandom } from './random'
import { buildWordKey } from './keys'
import { selectNextWord } from './selectNext'
import type { Background, BoringWordsLanguage, Word } from './types'

const scheduler = fsrs()

export function usePracticeSession(language: BoringWordsLanguage) {
  const loading = ref(true)
  const loadError = ref('')
  const words = ref<Word[]>([])
  const backgrounds = ref<Background[]>([])
  const currentWord = ref<Word | null>(null)
  const currentBackground = ref<Background | null>(null)
  const revealed = ref(false)

  const cardsByWordKey = new Map<string, Card>()

  function pickBackground(): void {
    currentBackground.value = pickRandom(backgrounds.value) ?? null
  }

  function pickNextCard(): void {
    revealed.value = false
    currentWord.value = selectNextWord(words.value, (wordId) => cardsByWordKey.get(buildWordKey(language, wordId)))
    pickBackground()
  }

  function reveal(): void {
    revealed.value = true
  }

  function rate(rating: Grade): void {
    const word = currentWord.value
    if (!word) return

    const wordKey = buildWordKey(language, word.id)
    const now = new Date()
    const existingCard: Card = cardsByWordKey.get(wordKey) ?? createEmptyCard(now)
    const { card } = scheduler.next(existingCard, now, rating)
    cardsByWordKey.set(wordKey, card)

    void appDb.wordCards.put({ ...card, wordKey })
    void logActivity('boringwords')

    pickNextCard()
  }

  async function load(): Promise<void> {
    try {
      const [wordsResponse, backgroundsResponse] = await Promise.all([
        fetch('/data/boringwords/words.json'),
        fetch('/data/boringwords/backgrounds.json')
      ])
      if (!wordsResponse.ok) throw new Error(`Failed to load words (${wordsResponse.status})`)
      if (!backgroundsResponse.ok) throw new Error(`Failed to load backgrounds (${backgroundsResponse.status})`)

      const allWords = (await wordsResponse.json()) as Word[]
      const allBackgrounds = (await backgroundsResponse.json()) as Background[]

      words.value = allWords.filter((word) => word.language === language)
      backgrounds.value = allBackgrounds.filter((background) => background.language === language)

      if (words.value.length === 0) {
        loadError.value = 'No words for this language yet.'
        return
      }

      const storedCards = await appDb.wordCards.toArray()
      for (const { wordKey, ...card } of storedCards) {
        cardsByWordKey.set(wordKey, card)
      }

      pickNextCard()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Could not load this deck.'
    } finally {
      loading.value = false
    }
  }

  void load()

  return { loading, loadError, currentWord, currentBackground, revealed, reveal, rate, Rating }
}
