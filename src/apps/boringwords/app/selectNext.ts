// Ported unchanged from linguanodon's boringwords app/selectNext.js: given
// the full word list for a language and a lookup into stored FSRS cards,
// picks which word to show next:
// 1) any due card -> uniform random among due
// 2) else any never-reviewed word -> uniform random among unseen
// 3) else the single word whose card is soonest due

import type { Card } from 'ts-fsrs'
import { pickRandom } from './random'
import type { Word } from './types'

export function selectNextWord(words: Word[], getCard: (wordId: number) => Card | undefined, now = new Date()): Word | null {
  if (words.length === 0) return null

  const due: Word[] = []
  const unseen: Word[] = []
  let leastOverdue: { word: Word; card: Card } | null = null

  for (const word of words) {
    const card = getCard(word.id)
    if (!card) {
      unseen.push(word)
      continue
    }
    if (card.due <= now) {
      due.push(word)
      continue
    }
    if (!leastOverdue || card.due < leastOverdue.card.due) {
      leastOverdue = { word, card }
    }
  }

  if (due.length > 0) return pickRandom(due) ?? null
  if (unseen.length > 0) return pickRandom(unseen) ?? null
  return leastOverdue ? leastOverdue.word : null
}
