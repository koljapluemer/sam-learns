// Cards stay in place; one is active at a time. Each must be answered
// correctly once - after any answer the next unsolved card (wrapping
// around) becomes active. Only the first answer per card is FSRS-rated.
import { ref } from 'vue'
import { Rating } from 'ts-fsrs'
import { rateVocabCard } from '../../entities/vocab-card/vocabCard'
import type { VocabEntry } from './selectExercises'

export function useExerciseBoard(entries: VocabEntry[], onDone: () => void) {
  const solved = ref<boolean[]>(entries.map(() => false))
  const activeIndex = ref(0)
  const revealed = ref(false)
  const rated = new Set<number>()

  function nextUnsolvedIndex(from: number): number {
    for (let step = 1; step <= entries.length; step += 1) {
      const index = (from + step) % entries.length
      if (!solved.value[index]) return index
    }
    return -1
  }

  function reveal(): void {
    revealed.value = true
  }

  function answer(correct: boolean): void {
    const index = activeIndex.value
    if (!rated.has(index)) {
      rated.add(index)
      void rateVocabCard(entries[index].key, entries[index].card, correct ? Rating.Good : Rating.Again)
    }

    if (correct) solved.value[index] = true
    revealed.value = false

    const next = nextUnsolvedIndex(index)
    if (next === -1) onDone()
    else activeIndex.value = next
  }

  return { solved, activeIndex, revealed, reveal, answer }
}
