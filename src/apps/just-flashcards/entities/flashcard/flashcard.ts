import { db } from '@/shared/db/db'
import { appDb, type FlashcardRow } from '../../db/appDb'

export async function addFlashcard(front: string, back: string): Promise<void> {
  await appDb.flashcards.add({
    id: crypto.randomUUID(),
    front,
    back,
    createdAt: new Date().toISOString()
  })
}

export async function updateFlashcard(id: string, front: string, back: string): Promise<void> {
  await appDb.flashcards.update(id, { front, back })
}

export async function deleteFlashcard(id: string): Promise<void> {
  await db.transaction('rw', appDb.flashcards, appDb.cards, async () => {
    await appDb.flashcards.delete(id)
    await appDb.cards.delete(id)
  })
}

export async function listFlashcards(): Promise<FlashcardRow[]> {
  return appDb.flashcards.orderBy('createdAt').reverse().toArray()
}
