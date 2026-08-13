import type { Card } from 'ts-fsrs'
import type { FlashcardRow } from '../../db/appDb'
import { listFlashcards } from '../../entities/flashcard/flashcard'
import { getSchedules } from '../../entities/flashcard-schedule/flashcardSchedule'

export type PracticeCandidate = { flashcard: FlashcardRow; schedule: Card | undefined }

let lastFlashcardId: string | null = null

export async function pickNextFlashcard(): Promise<PracticeCandidate | null> {
  const [flashcards, schedules] = await Promise.all([listFlashcards(), getSchedules()])
  const now = new Date()
  const eligible = flashcards
    .map((flashcard) => ({ flashcard, schedule: schedules.get(flashcard.id) }))
    .filter(({ schedule }) => !schedule || schedule.due <= now)

  const due = eligible.filter(({ schedule }) => schedule)
  const unseen = eligible.filter(({ schedule }) => !schedule)
  const preferred = due.length > 0 ? due : unseen
  const withoutPrevious = preferred.filter(({ flashcard }) => flashcard.id !== lastFlashcardId)
  const pool = withoutPrevious.length > 0 ? withoutPrevious : preferred
  if (pool.length === 0) return null

  const candidate = pool[Math.floor(Math.random() * pool.length)] ?? null
  lastFlashcardId = candidate?.flashcard.id ?? null
  return candidate
}
