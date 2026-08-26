import { onMounted, ref, type Ref } from 'vue'
import { Rating, type Grade } from 'ts-fsrs'
import { logActivity } from '@/shared/activity/useLearningEvent'
import type { SentenceCardRow, VocabCardRow } from '../../db/appDb'
import { getWords, isVocabEligible, type VocabEntry, type VocabExample } from '../../entities/vocab/vocab'
import { getSentences } from '../../entities/sentence/sentence'
import {
  createVocabCard,
  getVocabCards,
  rateVocabCard,
  setVocabCardsDueNow,
  vocabCardId
} from '../../entities/vocab-card/vocabCard'
import {
  createSentenceCard,
  getSentenceCards,
  rateSentenceCard,
  sentenceCardId
} from '../../entities/sentence-card/sentenceCard'
import { buildDuePool, type DueCandidate } from './duePool'
import { pickNewSentence } from './newSentencePicker'
import { pickExamples } from './exampleSentencePicker'
import { buildTranslationLookup } from './translationLookup'

export type ResolvedVocabCandidate = {
  kind: 'vocab'
  id: string
  word: string
  translations: string[]
  level: 1 | 2 | 3 | 4
  frontExamples: VocabExample[]
  frontShowTranslations: boolean
  backExamples: VocabExample[]
}

export type ResolvedSentenceCandidate = {
  kind: 'sentence'
  id: string
  text: string
  translation: string
  vocab: { word: string; translations: string[] }[]
  showVocabOnFront: boolean
}

export type ResolvedCandidate = ResolvedVocabCandidate | ResolvedSentenceCandidate

const EXAMPLE_COUNT_LOW = 2
const EXAMPLE_COUNT_HIGH = 3

function resolveVocabCandidate(raw: Extract<DueCandidate, { kind: 'vocab' }>, words: Map<string, VocabEntry>): ResolvedVocabCandidate {
  const entry = words.get(raw.word) ?? { word: raw.word, translations: [], examples: [] }
  const initial = entry.examples.find((example) => example.target === raw.card.initialSentence) ?? {
    target: raw.card.initialSentence,
    translation: ''
  }
  const level = raw.card.level

  let frontExamples: VocabExample[] = []
  let frontShowTranslations = true
  let backExamples: VocabExample[] = []

  if (level === 1) {
    frontExamples = [initial, ...pickExamples(entry.examples, EXAMPLE_COUNT_LOW, initial.target)]
  } else if (level === 2) {
    frontExamples = pickExamples(entry.examples, EXAMPLE_COUNT_HIGH, initial.target)
  } else if (level === 3) {
    frontExamples = pickExamples(entry.examples, EXAMPLE_COUNT_HIGH, initial.target)
    frontShowTranslations = false
  } else {
    backExamples = pickExamples(entry.examples, EXAMPLE_COUNT_HIGH, initial.target)
  }

  return {
    kind: 'vocab',
    id: raw.id,
    word: raw.word,
    translations: entry.translations,
    level,
    frontExamples,
    frontShowTranslations,
    backExamples
  }
}

function resolveSentenceCandidate(
  raw: Extract<DueCandidate, { kind: 'sentence' }>,
  sentences: Map<string, string[]>,
  words: Map<string, VocabEntry>,
  translations: Map<string, string>
): ResolvedSentenceCandidate {
  const wordKeys = sentences.get(raw.text) ?? []
  const vocab = wordKeys.map((word) => ({ word, translations: words.get(word)?.translations ?? [] }))

  return {
    kind: 'sentence',
    id: raw.id,
    text: raw.text,
    translation: translations.get(raw.text) ?? '',
    vocab,
    showVocabOnFront: !raw.card.lastAnswerCorrect
  }
}

let lastShownId: string | null = null

export function usePracticeQueue(languageCode: string): {
  loading: Ref<boolean>
  candidate: Ref<ResolvedCandidate | null>
  rate: (rating: Grade) => Promise<void>
  Rating: typeof Rating
} {
  const loading = ref(true)
  const candidate = ref<ResolvedCandidate | null>(null)
  let rawCandidate: DueCandidate | null = null
  let sentences: Map<string, string[]> = new Map()

  async function bootstrapNewSentence(
    words: Map<string, VocabEntry>,
    sentenceCards: Map<string, SentenceCardRow>,
    vocabCards: Map<string, VocabCardRow>,
    now: Date
  ): Promise<boolean> {
    const text = pickNewSentence(languageCode, sentences, sentenceCards, vocabCards)
    if (!text) return false

    // Pass the same `now` used for the due-pool rebuild below, so the
    // freshly created cards' due dates are guaranteed <= that comparison
    // time (avoids a race against a later Date.now() reading as "not due
    // yet" by a few milliseconds).
    await createSentenceCard(sentenceCardId(languageCode, text), now)
    const wordKeys = sentences.get(text) ?? []
    await Promise.all(
      wordKeys.map(async (word) => {
        const entry = words.get(word)
        if (!entry || !isVocabEligible(entry)) return
        const id = vocabCardId(languageCode, word)
        if (!vocabCards.has(id)) await createVocabCard(id, text, now)
      })
    )
    return true
  }

  async function loadNext(): Promise<void> {
    loading.value = true

    const [words, loadedSentences, vocabCards, sentenceCards] = await Promise.all([
      getWords(languageCode),
      getSentences(languageCode),
      getVocabCards(languageCode),
      getSentenceCards(languageCode)
    ])
    sentences = loadedSentences

    const now = new Date()
    let pool = buildDuePool(languageCode, vocabCards, sentenceCards, sentences, now).filter(
      (item) => item.id !== lastShownId
    )

    if (pool.length === 0 && (await bootstrapNewSentence(words, sentenceCards, vocabCards, now))) {
      const [refreshedVocabCards, refreshedSentenceCards] = await Promise.all([
        getVocabCards(languageCode),
        getSentenceCards(languageCode)
      ])
      pool = buildDuePool(languageCode, refreshedVocabCards, refreshedSentenceCards, sentences, now).filter(
        (item) => item.id !== lastShownId
      )
    }

    if (pool.length === 0) {
      rawCandidate = null
      candidate.value = null
      lastShownId = null
      loading.value = false
      return
    }

    const translations = buildTranslationLookup(words)
    const next = pool[Math.floor(Math.random() * pool.length)] as DueCandidate
    rawCandidate = next
    lastShownId = next.id
    candidate.value =
      next.kind === 'vocab'
        ? resolveVocabCandidate(next, words)
        : resolveSentenceCandidate(next, sentences, words, translations)
    loading.value = false
  }

  async function rate(rating: Grade): Promise<void> {
    if (!rawCandidate) return

    if (rawCandidate.kind === 'vocab') {
      await rateVocabCard(rawCandidate.id, rawCandidate.card, rating)
    } else {
      const wasCorrect = rawCandidate.card.lastAnswerCorrect
      await rateSentenceCard(rawCandidate.id, rawCandidate.card, rating)

      if (wasCorrect && (rating === Rating.Again || rating === Rating.Hard)) {
        const wordKeys = sentences.get(rawCandidate.text) ?? []
        await setVocabCardsDueNow(wordKeys.map((word) => vocabCardId(languageCode, word)))
      }
    }

    await logActivity('top-vocab')
    await loadNext()
  }

  onMounted(loadNext)

  return { loading, candidate, rate, Rating }
}
