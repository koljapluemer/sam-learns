import type { CardRow } from '../../db/appDb'
import { cardId, type Direction } from '../../entities/card/card'
import type { Flashcard } from '../../entities/flashcard/flashcard'
import { pickRandom } from '../../dumb/random'

export type PracticePick = { id: string; flashcard: Flashcard; direction: Direction; card: CardRow | undefined }

export type PickContext = {
  languageCode: string
  flashcards: Flashcard[]
  cards: Map<string, CardRow>
  lastFlashcardId: string | null
  lastWasMemorize: boolean
  now: Date
}

const UNSEEN_PREFERENCE = 0.1

function toPick(ctx: PickContext, flashcard: Flashcard, direction: Direction): PracticePick {
  const id = cardId(ctx.languageCode, flashcard.id, direction)
  return { id, flashcard, direction, card: ctx.cards.get(id) }
}

// w2i is always practicable; i2w only unlocks once w2i has been seen and
// isn't currently due.
function eligiblePicks(ctx: PickContext): PracticePick[] {
  return ctx.flashcards.flatMap((flashcard) => {
    const w2i = toPick(ctx, flashcard, 'w2i')
    const i2wUnlocked = w2i.card !== undefined && w2i.card.due > ctx.now
    return i2wUnlocked ? [w2i, toPick(ctx, flashcard, 'i2w')] : [w2i]
  })
}

export function pickNextCard(ctx: PickContext): PracticePick | null {
  const candidates = eligiblePicks(ctx).filter((pick) => pick.flashcard.id !== ctx.lastFlashcardId)
  const unseen = candidates.filter((pick) => !pick.card)
  const due = candidates.filter((pick) => pick.card && pick.card.due <= ctx.now)

  if (ctx.lastWasMemorize && due.length) return pickRandom(due) ?? null
  if (Math.random() < UNSEEN_PREFERENCE && unseen.length) return pickRandom(unseen) ?? null
  return pickRandom(due.length ? due : unseen) ?? null
}
