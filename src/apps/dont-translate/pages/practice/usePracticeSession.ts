import { onMounted, ref } from 'vue'
import type { Grade } from 'ts-fsrs'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { createCard, getCards, rateCard } from '../../entities/card/card'
import { getFlashcards, type Flashcard } from '../../entities/flashcard/flashcard'
import { pickNextCard, type PracticePick } from './nextCard'

export function usePracticeSession(languageCode: string) {
  const loading = ref(true)
  const current = ref<PracticePick | null>(null)
  let flashcards: Flashcard[] = []
  let lastFlashcardId: string | null = null
  let lastWasMemorize = false

  async function advance(): Promise<void> {
    const cards = await getCards(languageCode)
    current.value = pickNextCard({
      languageCode,
      flashcards,
      cards,
      lastFlashcardId,
      lastWasMemorize,
      now: new Date()
    })
  }

  async function finish(pick: PracticePick, wasMemorize: boolean): Promise<void> {
    lastFlashcardId = pick.flashcard.id
    lastWasMemorize = wasMemorize
    await logActivity('dont-translate')
    await advance()
  }

  async function completeMemorize(): Promise<void> {
    const pick = current.value
    if (!pick) return
    await createCard(pick.id)
    await finish(pick, true)
  }

  async function rate(rating: Grade): Promise<void> {
    const pick = current.value
    if (!pick?.card) return
    await rateCard(pick.card, rating)
    await finish(pick, false)
  }

  onMounted(async () => {
    flashcards = await getFlashcards(languageCode)
    await advance()
    loading.value = false
  })

  return { loading, current, completeMemorize, rate }
}
