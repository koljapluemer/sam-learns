import { onMounted, ref } from 'vue'
import type { Grade } from 'ts-fsrs'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { cachedUrlsReady, isUrlAvailable } from '@/shared/offline/cachedUrls'
import { getCards, rateCard } from '../../entities/card/card'
import { getWords, type Word } from '../../entities/word/word'
import { pickNextCard, type PracticePick } from './nextCard'

export function usePracticeSession() {
  const loading = ref(true)
  const current = ref<PracticePick | null>(null)
  let words: Word[] = []
  let lastTerm: string | null = null

  async function advance(): Promise<void> {
    const cards = await getCards()
    // Offline, only words whose image and audio are cached.
    const available = words.filter((word) => isUrlAvailable(word.image) && isUrlAvailable(word.audio))
    current.value = pickNextCard({ words: available, cards, lastTerm, now: new Date() })
  }

  async function rate(rating: Grade): Promise<void> {
    const pick = current.value
    if (!pick) return
    await rateCard(pick.word.term, pick.card, rating)
    lastTerm = pick.word.term
    await logActivity('ancient-greek-alphabet')
    await advance()
  }

  onMounted(async () => {
    words = await getWords()
    await cachedUrlsReady()
    await advance()
    loading.value = false
  })

  return { loading, current, rate }
}
