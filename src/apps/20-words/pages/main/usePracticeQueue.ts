import { computed, onMounted, ref } from 'vue'
import type { Card, Grade } from 'ts-fsrs'
import { Rating } from 'ts-fsrs'
import { getDueWordCards, rateWordCard } from '../../entities/word-card/wordCard'
import { getWordsByIds } from '../../entities/word/word'
import { logActivity } from '@/shared/activity/useLearningEvent'
import type { WordRow } from '../../db/appDb'

type DueEntry = { wordId: string; card: Card; word: WordRow }

export function usePracticeQueue() {
  const loading = ref(true)
  const queue = ref<DueEntry[]>([])
  const dueAtStart = ref(0)
  const revealed = ref(false)

  const currentEntry = computed(() => queue.value[0] ?? null)

  async function load(): Promise<void> {
    loading.value = true
    const due = await getDueWordCards()
    const words = await getWordsByIds(due.map((entry) => entry.wordId))

    queue.value = due
      .map((entry) => {
        const word = words.get(entry.wordId)
        return word ? { wordId: entry.wordId, card: entry.card, word } : null
      })
      .filter((entry): entry is DueEntry => entry !== null)

    dueAtStart.value = queue.value.length
    loading.value = false
  }

  function reveal(): void {
    revealed.value = true
  }

  async function rate(rating: Grade): Promise<void> {
    const entry = currentEntry.value
    if (!entry) return

    await rateWordCard(entry.wordId, entry.card, rating)
    void logActivity('20-words')

    queue.value.shift()
    revealed.value = false
  }

  onMounted(load)

  return { loading, currentEntry, dueAtStart, remaining: computed(() => queue.value.length), revealed, reveal, rate, Rating }
}
