import { getDueSentenceCards } from '../../entities/sentence-card/sentenceCard'
import { getDueWordCards } from '../../entities/word-card/wordCard'
import { getSentencesEligibleForVocab } from '../../entities/sentence/sentence'
import { getWordsEligibleForExamples } from '../../entities/word/word'
import { pickRandom } from '../../dumb/random'

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

// Two-stage random pick: for each of the 5 screens, first check eligibility
// (and pick a candidate entity, excluding whatever the previous screen just
// touched); then pick uniformly among the screens that turned out eligible.
export async function pickNextScreen(exclude: TouchedEntities = NO_EXCLUSION): Promise<ScreenState> {
  const excludedSentenceIds = new Set(exclude.sentenceIds)
  const excludedWordIds = new Set(exclude.wordIds)

  const [dueSentences, dueWords, vocabEligibleSentences, exampleEligibleWords] = await Promise.all([
    getDueSentenceCards(),
    getDueWordCards(),
    getSentencesEligibleForVocab(),
    getWordsEligibleForExamples()
  ])

  const eligible: ScreenState[] = []

  const newSentenceEligible =
    dueWords.length < NEW_SENTENCE_WORDS_DUE_MAX &&
    dueSentences.length < NEW_SENTENCE_SENTENCES_DUE_MAX &&
    exampleEligibleWords.length < NEW_SENTENCE_WORDS_EXAMPLES_MAX &&
    vocabEligibleSentences.length < NEW_SENTENCE_SENTENCES_VOCAB_MAX
  if (newSentenceEligible) eligible.push({ type: 'new-example-sentence' })

  const vocabSentence = pickRandom(vocabEligibleSentences.filter((s) => !excludedSentenceIds.has(s.id)))
  if (vocabSentence) eligible.push({ type: 'add-sentence-vocab', sentenceId: vocabSentence.id })

  const exampleWord = pickRandom(exampleEligibleWords.filter((w) => !excludedWordIds.has(w.id)))
  if (exampleWord) eligible.push({ type: 'add-examples-to-word', wordId: exampleWord.id })

  const practiceSentence = pickRandom(dueSentences.filter((s) => !excludedSentenceIds.has(s.sentenceId)))
  if (practiceSentence) eligible.push({ type: 'practice-sentence', sentenceId: practiceSentence.sentenceId })

  const practiceWord = pickRandom(dueWords.filter((w) => !excludedWordIds.has(w.wordId)))
  if (practiceWord) eligible.push({ type: 'practice-vocab', wordId: practiceWord.wordId })

  const practiceEligible = eligible.filter(isPracticeScreen)
  const preferPractice = practiceScreenCount < otherScreenCount + PRACTICE_ADVANTAGE_THRESHOLD
  const pool = preferPractice && practiceEligible.length > 0 ? practiceEligible : eligible

  const picked = pickRandom(pool) ?? { type: 'new-example-sentence' as const }
  recordScreenShown(picked)
  return picked
}
