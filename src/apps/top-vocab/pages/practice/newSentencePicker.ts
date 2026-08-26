import type { SentenceCardRow, VocabCardRow } from '../../db/appDb'
import { isSentenceEligible } from '../../entities/sentence/sentence'
import { sentenceCardId } from '../../entities/sentence-card/sentenceCard'
import { vocabCardId } from '../../entities/vocab-card/vocabCard'

// Picks the next never-seen sentence to introduce once the due pool runs
// dry, per spec.md: prefer sentences overlapping with vocab already being
// learned (scored by count of already-tracked contained words), falling
// back to uniform-random among the top-scoring ties. With no vocab learned
// yet every score is 0, so this naturally also covers "at first open, pick
// a random sentence" without a separate code path.
export function pickNewSentence(
  languageCode: string,
  sentences: Map<string, string[]>,
  sentenceCards: Map<string, SentenceCardRow>,
  vocabCards: Map<string, VocabCardRow>
): string | null {
  const unseen = [...sentences].filter(
    ([text, wordKeys]) =>
      isSentenceEligible(text, wordKeys) && !sentenceCards.has(sentenceCardId(languageCode, text))
  )
  if (unseen.length === 0) return null

  const scored = unseen.map(([text, wordKeys]) => ({
    text,
    score: wordKeys.filter((word) => vocabCards.has(vocabCardId(languageCode, word))).length
  }))
  const bestScore = Math.max(...scored.map((entry) => entry.score))
  const best = scored.filter((entry) => entry.score === bestScore)

  return best[Math.floor(Math.random() * best.length)]?.text ?? null
}
