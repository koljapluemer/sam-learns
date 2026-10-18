import type { CardRow } from '../../db/appDb'
import type { Word } from '../../entities/word/word'
import { pickRandom } from '../../dumb/random'

export type PracticePick = { word: Word; card: CardRow | undefined }

export type PickContext = {
  words: Word[]
  cards: Map<string, CardRow>
  lastTerm: string | null
  now: Date
}

const DUE_PREFERENCE = 0.7

// Seen cards that aren't due yet are never picked, so practice can run out.
export function pickNextCard(ctx: PickContext): PracticePick | null {
  const candidates = ctx.words
    .filter((word) => word.term !== ctx.lastTerm)
    .map((word) => ({ word, card: ctx.cards.get(word.term) }))
  const due = candidates.filter((pick) => pick.card && pick.card.due <= ctx.now)
  const unseen = candidates.filter((pick) => !pick.card)

  const [preferred, fallback] = Math.random() < DUE_PREFERENCE ? [due, unseen] : [unseen, due]
  return pickRandom(preferred.length ? preferred : fallback) ?? null
}
