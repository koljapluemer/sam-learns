// Practice-session logic - ported from linguanodon's saetze app/session.js
// (random exercise, shuffle answers, disable wrong answers, reveal + auto-
// advance on correct). No persisted per-exercise state in the original
// either - it's pure in-session random picking, not spaced repetition, so
// there's no Dexie db for this app.

import { onUnmounted, ref, watch, type Ref } from 'vue'
import { logActivity } from '@/shared/activity/useLearningEvent'
import type { Exercise } from './types'

const ADVANCE_DELAY_MS = 700

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length)
}

function shuffleAnswers(answers: [string, string]): string[] {
  return Math.random() < 0.5 ? [...answers] : [answers[1], answers[0]]
}

export function usePracticeSession(lessonKey: Ref<string>) {
  const loading = ref(true)
  const loadError = ref('')
  const exercises = ref<Exercise[]>([])
  const exercise = ref<Exercise | null>(null)
  const displayedAnswers = ref<string[]>([])
  const disabledAnswers = ref<string[]>([])
  const revealedAnswer = ref('')

  let advanceTimeoutId: ReturnType<typeof setTimeout> | null = null

  function clearAdvanceTimeout(): void {
    if (advanceTimeoutId !== null) {
      clearTimeout(advanceTimeoutId)
      advanceTimeoutId = null
    }
  }

  function showRandomExercise(): void {
    const pool = exercises.value
    if (pool.length === 0) {
      exercise.value = null
      displayedAnswers.value = []
      disabledAnswers.value = []
      revealedAnswer.value = ''
      return
    }

    const next = pool[randomIndex(pool.length)]
    exercise.value = next
    displayedAnswers.value = shuffleAnswers([next.correct_answer, next.wrong_answer])
    disabledAnswers.value = []
    revealedAnswer.value = ''
  }

  function handleAnswer(answer: string): void {
    const current = exercise.value
    if (!current || revealedAnswer.value) return

    if (answer !== current.correct_answer) {
      disabledAnswers.value = [...disabledAnswers.value, answer]
      return
    }

    revealedAnswer.value = current.correct_answer
    void logActivity('saetze')
    clearAdvanceTimeout()
    advanceTimeoutId = setTimeout(() => {
      showRandomExercise()
      advanceTimeoutId = null
    }, ADVANCE_DELAY_MS)
  }

  let allExercisesCache: Exercise[] | null = null

  async function load(): Promise<void> {
    loading.value = true
    loadError.value = ''
    clearAdvanceTimeout()
    try {
      if (!allExercisesCache) {
        const response = await fetch('/data/saetze/exercises.json')
        if (!response.ok) throw new Error(`Failed to load exercises (${response.status})`)
        allExercisesCache = (await response.json()) as Exercise[]
      }
      const data = allExercisesCache.filter((item) => item.lesson === lessonKey.value)
      if (data.length === 0) {
        loadError.value = 'This lesson is empty.'
        return
      }
      exercises.value = data
      showRandomExercise()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Could not load this lesson.'
    } finally {
      loading.value = false
    }
  }

  watch(lessonKey, load, { immediate: true })
  onUnmounted(clearAdvanceTimeout)

  return {
    loading,
    loadError,
    exercise,
    displayedAnswers,
    disabledAnswers,
    revealedAnswer,
    handleAnswer
  }
}
