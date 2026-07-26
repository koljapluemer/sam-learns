// Segment vocab-practice session: hard/again-rated items are pushed back
// onto the end of the in-memory queue regardless of their new FSRS due date,
// so they resurface before the session ends. Because the initial queue has
// no duplicates and items are only ever pushed after being shifted off the
// front, an item can only repeat immediately if the queue is empty except
// for itself (the one unavoidable edge case) - no extra "last shown"
// tracking is needed beyond this FIFO push-to-end behavior.
import { computed, onMounted, ref } from 'vue'
import { Rating, type Grade } from 'ts-fsrs'
import type { Segment } from '../../entities/segment/segment'
import { rateVocabCard } from '../../entities/vocab-card/vocabCard'
import { selectVocabSet, type VocabEntry } from './selectVocabSet'

export function useVocabPracticeQueue(youtubeId: string, segment: Segment, onFinished: () => void) {
  const loading = ref(true)
  const queue = ref<VocabEntry[]>([])
  const revealed = ref(false)

  const currentEntry = computed(() => queue.value[0] ?? null)
  const remaining = computed(() => queue.value.length)

  async function load(): Promise<void> {
    queue.value = await selectVocabSet(youtubeId, segment)
    loading.value = false
    if (queue.value.length === 0) onFinished()
  }

  function reveal(): void {
    revealed.value = true
  }

  async function rate(rating: Grade): Promise<void> {
    const entry = currentEntry.value
    if (!entry) return

    await rateVocabCard(entry.key, entry.card, rating)
    queue.value.shift()
    revealed.value = false

    if (rating === Rating.Again || rating === Rating.Hard) {
      queue.value.push(entry)
    }

    if (queue.value.length === 0) onFinished()
  }

  onMounted(load)

  return { loading, currentEntry, remaining, revealed, reveal, rate, Rating }
}
