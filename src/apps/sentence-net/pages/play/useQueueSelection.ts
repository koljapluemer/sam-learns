import { getDueSentenceCards } from '../../entities/sentence-card/sentenceCard'
import { getDueWordCards } from '../../entities/word-card/wordCard'
import { getSentencesEligibleForVocab } from '../../entities/sentence/sentence'
import { getWordsEligibleForExamples } from '../../entities/word/word'
import { pickRandom } from '../../dumb/random'
import {
  hasHotPoolItems,
  hotPoolIds,
  removeFromHotPool,
  shuffleAndTrimHotPool,
  type HotPoolKind
} from '../../dumb/hotPool'

export type ScreenState =
  | { type: 'new-example-sentence' }
  | { type: 'add-sentence-vocab'; sentenceId: string }
  | { type: 'practice-sentence'; sentenceId: string }
  | { type: 'practice-vocab'; wordId: string }
  | { type: 'add-examples-to-word'; wordId: string }

export type TouchedEntities = { sentenceIds: string[]; wordIds: string[] }

// The two screens practice cards can jump to directly (edit the sentence /
// edit the word), bypassing normal random selection for one screen.
export type JumpTarget = Extract<ScreenState, { type: 'add-sentence-vocab' } | { type: 'add-examples-to-word' }>

type EntityScreenType = Exclude<ScreenState['type'], 'new-example-sentence'>

const NEW_SENTENCE_WORDS_DUE_MAX = 20
const NEW_SENTENCE_SENTENCES_DUE_MAX = 10
const NEW_SENTENCE_WORDS_EXAMPLES_MAX = 10
const NEW_SENTENCE_SENTENCES_VOCAB_MAX = 5

// Practice should outweigh adding new words/sentences: as long as practice
// screens haven't come up at least 3 more times than the other three
// screens combined this session, restrict selection to practice screens
// (when eligible). Session-only counters - reset on page reload.
const PRACTICE_ADVANTAGE_THRESHOLD = 3
const PRACTICE_SCREEN_TYPES = new Set<ScreenState['type']>(['practice-sentence', 'practice-vocab'])

// Rating a flashcard below "Easy" marks its related items (a sentence's
// words, a word's example sentences) as worth resurfacing soon - see
// PlayPracticeSentence.vue / PlayPracticeVocab.vue. When eligible, half the
// time selection prefers a screen pertaining to one of those hot items.
const HOT_POOL_PREFER_CHANCE = 0.5

const KIND_BY_TYPE: Record<EntityScreenType, HotPoolKind> = {
  'add-sentence-vocab': 'sentence',
  'practice-sentence': 'sentence',
  'add-examples-to-word': 'word',
  'practice-vocab': 'word'
}

let practiceScreenCount = 0
let otherScreenCount = 0

function isPracticeScreen(screen: ScreenState): boolean {
  return PRACTICE_SCREEN_TYPES.has(screen.type)
}

function recordScreenShown(screen: ScreenState): void {
  if (isPracticeScreen(screen)) practiceScreenCount++
  else otherScreenCount++
}

const NO_EXCLUSION: TouchedEntities = { sentenceIds: [], wordIds: [] }

function buildScreenState(type: EntityScreenType, id: string): ScreenState {
  switch (type) {
    case 'add-sentence-vocab':
      return { type: 'add-sentence-vocab', sentenceId: id }
    case 'practice-sentence':
      return { type: 'practice-sentence', sentenceId: id }
    case 'add-examples-to-word':
      return { type: 'add-examples-to-word', wordId: id }
    case 'practice-vocab':
      return { type: 'practice-vocab', wordId: id }
  }
}

function applyPracticePreference(types: ScreenState['type'][]): ScreenState['type'][] {
  const practiceEligible = types.filter(isPracticeScreen)
  const preferPractice = practiceScreenCount < otherScreenCount + PRACTICE_ADVANTAGE_THRESHOLD
  return preferPractice && practiceEligible.length > 0 ? practiceEligible : types
}

// Restricts to screens pertaining to a hot-pool item, half the time - falls
// back to the unrestricted pool if the roll misses, the hot pool is empty, or
// nothing currently eligible happens to be hot.
function applyHotPoolPreference(
  types: ScreenState['type'][],
  candidatesByType: Record<EntityScreenType, string[]>
): { pool: ScreenState['type'][]; useHot: boolean } {
  if (!hasHotPoolItems() || Math.random() >= HOT_POOL_PREFER_CHANCE) return { pool: types, useHot: false }

  const hotTypes = types.filter((type): type is EntityScreenType => {
    if (type === 'new-example-sentence') return false
    const hotIds = hotPoolIds(KIND_BY_TYPE[type])
    return candidatesByType[type].some((id) => hotIds.has(id))
  })

  return hotTypes.length > 0 ? { pool: hotTypes, useHot: true } : { pool: types, useHot: false }
}

function pickCandidateId(type: EntityScreenType, candidates: string[], useHot: boolean): string {
  if (!useHot) return pickRandom(candidates) as string
  const hotIds = hotPoolIds(KIND_BY_TYPE[type])
  const hotCandidates = candidates.filter((id) => hotIds.has(id))
  return (pickRandom(hotCandidates) ?? pickRandom(candidates)) as string
}

// Two-stage random pick: for each of the 5 screens, first check eligibility
// (and gather candidate entities, excluding whatever the previous screen just
// touched); then narrow to practice screens, then to hot-pool screens (each
// only when applicable), and finally pick uniformly among what's left.
export async function pickNextScreen(exclude: TouchedEntities = NO_EXCLUSION): Promise<ScreenState> {
  removeFromHotPool('sentence', exclude.sentenceIds)
  removeFromHotPool('word', exclude.wordIds)
  shuffleAndTrimHotPool()

  const excludedSentenceIds = new Set(exclude.sentenceIds)
  const excludedWordIds = new Set(exclude.wordIds)

  const [dueSentences, dueWords, vocabEligibleSentences, exampleEligibleWords] = await Promise.all([
    getDueSentenceCards(),
    getDueWordCards(),
    getSentencesEligibleForVocab(),
    getWordsEligibleForExamples()
  ])

  const candidatesByType: Record<EntityScreenType, string[]> = {
    'add-sentence-vocab': vocabEligibleSentences.filter((s) => !excludedSentenceIds.has(s.id)).map((s) => s.id),
    'add-examples-to-word': exampleEligibleWords.filter((w) => !excludedWordIds.has(w.id)).map((w) => w.id),
    'practice-sentence': dueSentences.filter((s) => !excludedSentenceIds.has(s.sentenceId)).map((s) => s.sentenceId),
    'practice-vocab': dueWords.filter((w) => !excludedWordIds.has(w.wordId)).map((w) => w.wordId)
  }

  const newSentenceEligible =
    dueWords.length < NEW_SENTENCE_WORDS_DUE_MAX &&
    dueSentences.length < NEW_SENTENCE_SENTENCES_DUE_MAX &&
    exampleEligibleWords.length < NEW_SENTENCE_WORDS_EXAMPLES_MAX &&
    vocabEligibleSentences.length < NEW_SENTENCE_SENTENCES_VOCAB_MAX

  const baseTypes: ScreenState['type'][] = (Object.keys(candidatesByType) as EntityScreenType[]).filter(
    (type) => candidatesByType[type].length > 0
  )
  if (newSentenceEligible) baseTypes.push('new-example-sentence')

  const practicePreferred = applyPracticePreference(baseTypes)
  const { pool, useHot } = applyHotPoolPreference(practicePreferred, candidatesByType)

  const pickedType = pickRandom(pool) ?? 'new-example-sentence'
  const picked: ScreenState =
    pickedType === 'new-example-sentence'
      ? { type: 'new-example-sentence' }
      : buildScreenState(pickedType, pickCandidateId(pickedType, candidatesByType[pickedType], useHot))

  recordScreenShown(picked)
  return picked
}
