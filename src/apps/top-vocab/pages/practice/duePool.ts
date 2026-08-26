import type { SentenceCardRow, VocabCardRow } from '../../db/appDb'
import { vocabCardId } from '../../entities/vocab-card/vocabCard'

export type VocabCandidate = { kind: 'vocab'; id: string; word: string; card: VocabCardRow }
export type SentenceCandidate = { kind: 'sentence'; id: string; text: string; card: SentenceCardRow }
export type DueCandidate = VocabCandidate | SentenceCandidate

export function isVocabDue(card: VocabCardRow, now: Date): boolean {
  if (card.level < 4) return true
  return card.due <= now
}

function isVocabMastered(card: VocabCardRow | undefined, now: Date): boolean {
  return card !== undefined && card.level === 4 && card.due > now
}

export function isSentenceDue(
  card: SentenceCardRow,
  containedVocabCards: (VocabCardRow | undefined)[],
  now: Date
): boolean {
  if (!card.lastAnswerCorrect) return card.due <= now
  return card.due <= now && containedVocabCards.every((vocabCard) => isVocabMastered(vocabCard, now))
}

export function buildDuePool(
  languageCode: string,
  vocabCards: Map<string, VocabCardRow>,
  sentenceCards: Map<string, SentenceCardRow>,
  sentenceWordKeys: Map<string, string[]>,
  now: Date
): DueCandidate[] {
  const prefix = `${languageCode}:`
  const pool: DueCandidate[] = []

  for (const [id, card] of vocabCards) {
    if (isVocabDue(card, now)) pool.push({ kind: 'vocab', id, word: id.slice(prefix.length), card })
  }

  for (const [id, card] of sentenceCards) {
    const text = id.slice(prefix.length)
    const wordKeys = sentenceWordKeys.get(text) ?? []
    const containedVocabCards = wordKeys.map((word) => vocabCards.get(vocabCardId(languageCode, word)))
    if (isSentenceDue(card, containedVocabCards, now)) pool.push({ kind: 'sentence', id, text, card })
  }

  return pool
}
