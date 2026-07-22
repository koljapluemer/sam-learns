// Game-session logic - ported from linguanodon's egyptiansentences
// app/session.js: timed "Go" mode (60s timer, streak/time-bonus scoring),
// localStorage highscores, keyboard navigation, and exercise generation.
// Distractor picking is unchanged: it picks randomly among the up-to-5
// distractors precomputed at import time and stored on each cloze word,
// rather than computing distractors live in the browser.

import { computed, onMounted, onUnmounted, ref } from 'vue'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { showToast } from './toast'
import type { ClozeWord, GameMode, Highscore, IndexCardRow, Sentence } from './types'

const INITIAL_TIME_SECONDS = 60
const ADVANCE_DELAY_MS = 5000
const HIGHSCORES_STORAGE_KEY = 'egyptiansentences-highscores'
const MAX_STORED_HIGHSCORES = 10

const MASKED_WORD_HTML =
  '<span class="inline-block bg-base-200/70 border border-base-300/60 rounded px-2 mx-1 min-w-[3rem]">&nbsp;&nbsp;&nbsp;</span>'

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length)
}

function loadHighscores(): Highscore[] {
  const raw = window.localStorage.getItem(HIGHSCORES_STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Highscore[]) : []
}

export function useGameSession() {
  const loading = ref(true)
  const loadError = ref('')

  const sentences = ref<Sentence[]>([])

  const gameMode = ref<GameMode>('undetermined')
  const isRevealed = ref(false)
  const isReverseOrder = ref(false)
  const streak = ref(0)
  const correctAnswerCount = ref(0)
  const incorrectAnswerCount = ref(0)
  const score = ref(0)
  const lastScore = ref<number | null>(null)

  const totalTime = ref(INITIAL_TIME_SECONDS)
  const currentTime = ref(0)
  const timerRunning = ref(false)

  const currentSentence = ref<Sentence | null>(null)
  const currentClozeWord = ref<ClozeWord | null>(null)
  const wrongAnswer = ref('')

  const highscores = ref<Highscore[]>(loadHighscores())

  let timerIntervalId: ReturnType<typeof setInterval> | null = null
  let advanceTimeoutId: ReturnType<typeof setTimeout> | null = null

  const remainingTime = computed(() => totalTime.value - currentTime.value)
  const progressPercent = computed(() => (1 - currentTime.value / totalTime.value) * 100)
  const sortedHighscores = computed(() => [...highscores.value].sort((a, b) => b.score - a.score))

  const cardRows = computed<IndexCardRow[]>(() => {
    const sentence = currentSentence.value
    const clozeWord = currentClozeWord.value
    if (!sentence || !clozeWord) return []

    const translation = (sentence.translations[0] ?? '').replace('eng:', '')

    if (!isRevealed.value) {
      const maskedArabic = sentence.arz.replace(clozeWord.word, MASKED_WORD_HTML)
      return [
        { type: 'text', text: maskedArabic, size: 'auto', rtl: true },
        { type: 'divider' },
        { type: 'text', text: translation, size: 'small' }
      ]
    }

    const highlightedArabic = sentence.arz.replace(
      clozeWord.word,
      `<span class="bg-base-200/70 border border-base-300/60 rounded px-1">${clozeWord.word}</span>`
    )
    return [
      { type: 'text', text: highlightedArabic, size: 'auto', rtl: true },
      { type: 'divider' },
      { type: 'text', text: sentence.transliteration, size: 'small' },
      { type: 'text', text: translation, size: 'small' }
    ]
  })

  function clearTimerInterval(): void {
    if (timerIntervalId !== null) {
      clearInterval(timerIntervalId)
      timerIntervalId = null
    }
  }

  function clearAdvanceTimeout(): void {
    if (advanceTimeoutId !== null) {
      clearTimeout(advanceTimeoutId)
      advanceTimeoutId = null
    }
  }

  function startTimer(): void {
    timerRunning.value = true
    clearTimerInterval()
    timerIntervalId = setInterval(() => {
      if (timerRunning.value) currentTime.value += 1
    }, 1000)
  }

  function generateExercise(): void {
    if (sentences.value.length === 0) return

    const sentence = sentences.value[randomIndex(sentences.value.length)]
    currentSentence.value = sentence

    const clozeWord = sentence.cloze_words[randomIndex(sentence.cloze_words.length)]
    currentClozeWord.value = clozeWord
    wrongAnswer.value = clozeWord.distractors[randomIndex(clozeWord.distractors.length)]
  }

  function getNextExercise(): void {
    clearAdvanceTimeout()

    if (currentTime.value >= totalTime.value) {
      timerRunning.value = false
      showToast("Time's up!", 'info')
      setGameMode('game-ended')
      return
    }

    isReverseOrder.value = Math.random() < 0.5
    isRevealed.value = false
    generateExercise()
    timerRunning.value = true
  }

  function moveToNextExercise(): void {
    if (isRevealed.value) getNextExercise()
  }

  function handleAnswer(isCorrect: boolean): void {
    if (gameMode.value !== 'go' || isRevealed.value) return

    timerRunning.value = false
    isRevealed.value = true

    void logActivity('egyptiansentences')

    clearAdvanceTimeout()
    advanceTimeoutId = setTimeout(moveToNextExercise, ADVANCE_DELAY_MS)

    if (isCorrect) {
      streak.value++
      correctAnswerCount.value++
      const timeBonus = Math.max(0, 5 - Math.floor((correctAnswerCount.value - 1) / 10))
      if (timeBonus > 0) {
        currentTime.value -= timeBonus
        showToast(`+${timeBonus} seconds`, 'success')
      }
      const pointsToAdd = 10 + streak.value * 2
      score.value += pointsToAdd
      showToast(`+${pointsToAdd}`, 'success')
    } else {
      streak.value = 0
      incorrectAnswerCount.value++
      const addToTime = 2 * incorrectAnswerCount.value + 1
      currentTime.value += addToTime
      showToast(`-${addToTime} seconds`, 'error')
    }
  }

  function setGameMode(mode: GameMode): void {
    if (mode === gameMode.value) return
    gameMode.value = mode

    if (mode === 'go') {
      score.value = 0
      currentTime.value = 0
      totalTime.value = INITIAL_TIME_SECONDS
      streak.value = 0
      correctAnswerCount.value = 0
      incorrectAnswerCount.value = 0
      startTimer()
      getNextExercise()
      return
    }

    if (mode === 'game-ended') {
      lastScore.value = score.value

      const bestScore = highscores.value.length ? Math.max(...highscores.value.map((entry) => entry.score)) : null

      if (highscores.value.length < MAX_STORED_HIGHSCORES) {
        showToast('New Top 10 Entry!', 'success')
      } else if (score.value > sortedHighscores.value[MAX_STORED_HIGHSCORES - 1].score) {
        showToast('New Top 10 Entry!', 'success')
      }

      if (bestScore === null || score.value > bestScore) {
        showToast('New Personal Best!', 'success')
      }

      highscores.value = [...highscores.value, { score: score.value, date: new Date().toISOString() }]
      window.localStorage.setItem(HIGHSCORES_STORAGE_KEY, JSON.stringify(highscores.value))
      setGameMode('undetermined')
    }
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      if (gameMode.value === 'go' && !isRevealed.value) handleAnswer(!isReverseOrder.value)
    } else if (event.key === 'ArrowRight') {
      if (gameMode.value === 'go' && !isRevealed.value) handleAnswer(isReverseOrder.value)
    } else if (event.key === 'Enter') {
      if (gameMode.value === 'go' && isRevealed.value) {
        getNextExercise()
      } else if (gameMode.value === 'undetermined') {
        setGameMode('go')
      }
    }
  }

  async function load(): Promise<void> {
    try {
      const response = await fetch('/data/egyptiansentences/sentences.json')
      if (!response.ok) throw new Error(`Failed to load sentences (${response.status})`)
      const data = (await response.json()) as Sentence[]
      sentences.value = data.filter((sentence) => sentence.cloze_words.length > 0)
      if (sentences.value.length === 0) {
        loadError.value = 'No sentences available.'
      }
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Could not load sentences.'
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await load()
    window.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown)
    clearTimerInterval()
    clearAdvanceTimeout()
  })

  return {
    loading,
    loadError,
    gameMode,
    isRevealed,
    isReverseOrder,
    streak,
    score,
    lastScore,
    remainingTime,
    progressPercent,
    currentSentence,
    currentClozeWord,
    wrongAnswer,
    cardRows,
    sortedHighscores,
    setGameMode,
    getNextExercise,
    handleAnswer
  }
}
