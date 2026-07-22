// Practice-session composable - ported from linguanodon's arabicnumbers
// app/session.js. Same exercise generation / weighted next-exercise picking /
// SM-2-ish interval scheduling; only the plumbing changed:
//  - numbers come from the static public/data/arabicnumbers/numbers.json
//    export instead of a Django API endpoint
//  - progress persists to this app's Dexie db instead of raw IndexedDB
//  - there is no server sync (queueEvent/queueState) - trials are logged to
//    this repo's shared cross-app activity log instead

import { ref } from 'vue'
import { appDb } from '../db/appDb'
import { logActivity } from '@/shared/activity/useLearningEvent'
import type { AnswerValue, ApiNumber, Exercise, ExerciseType, Missions, NumberEntry } from './types'

// exercise.value/missions.value are Vue reactive Proxies once assigned - and
// IndexedDB's structured clone algorithm (which Dexie sits on top of) can't
// clone a Proxy. Plain JSON round-tripping is the simplest way to get a
// cloneable copy of these small, purely-JSON-shaped records before persisting.
function toPlain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

const POSSIBLE_EXERCISE_COMBINATIONS: [ExerciseType, ExerciseType][] = [
  ['val', 'ar'],
  ['val', 'ar_long'],
  ['val', 'transliteration'],
  ['ar', 'val'],
  ['ar', 'ar_long'],
  ['ar', 'transliteration'],
  ['ar', 'en'],
  ['ar_long', 'val'],
  ['ar_long', 'ar'],
  ['ar_long', 'transliteration'],
  ['ar_long', 'en'],
  ['en', 'ar'],
  ['en', 'ar_long'],
  ['en', 'transliteration'],
  ['transliteration', 'val'],
  ['transliteration', 'ar'],
  ['transliteration', 'ar_long'],
  ['transliteration', 'en']
]

const EASY_EXERCISE_TYPES: ExerciseType[] = ['val', 'ar', 'transliteration']

const nowSeconds = () => Math.floor(Date.now() / 1000)

const exerciseKey = (numberVal: number, promptType: ExerciseType, answerType: ExerciseType) =>
  `${numberVal}:${promptType}:${answerType}`

function createExercises(bank: NumberEntry[]): Exercise[] {
  const created: Exercise[] = []
  for (const number of bank) {
    for (const [promptType, answerType] of POSSIBLE_EXERCISE_COMBINATIONS) {
      created.push({
        key: exerciseKey(number.val, promptType, answerType),
        promptType,
        answerType,
        prompt: number[promptType],
        correctAnswer: number[answerType],
        stats: [],
        sr: { repetitions: 0, interval: 10, dueAt: nowSeconds() },
        number
      })
    }
  }
  return created
}

function defaultMissions(): Missions {
  return {
    'Exercises Done': { goals: [0, 10, 50, 100, 200, 500, 1000, 10000], progress: 0, currentGoal: 1 },
    Streak: { goals: [0, 3, 5, 10, 20, 50, 100, 200], progress: 0, currentGoal: 1 }
  }
}

export function usePracticeSession() {
  const loading = ref(true)
  const loadError = ref('')

  const fieldUsedAsPrompt = ref<ExerciseType>('val')
  const fieldUsedAsAnswer = ref<ExerciseType>('ar')
  const possibleAnswers = ref<AnswerValue[]>([])
  const prompt = ref<AnswerValue>('')
  const correctAnswer = ref<AnswerValue>('')
  const givenAnswer = ref<AnswerValue>('')
  const indexOfAnswerClicked = ref<number | null>(null)
  const exercise = ref<Exercise | null>(null)
  const streak = ref(0)
  const guessMade = ref(false)
  const missions = ref<Missions>(defaultMissions())

  let exercisesDoneThisSession = 0
  let numberBank: NumberEntry[] = []
  let exercises: Exercise[] = []

  function userSawExerciseBefore(): boolean {
    return (exercise.value?.stats.length ?? 0) > 0
  }

  function getNextExercise(): void {
    guessMade.value = false
    let possibleExercises = exercises
    // for the first 10 exercises, only use easy exercises
    if (exercisesDoneThisSession < 10) {
      possibleExercises = exercises.filter(
        (ex) => EASY_EXERCISE_TYPES.includes(ex.promptType) && EASY_EXERCISE_TYPES.includes(ex.answerType)
      )
    }

    // new exercises are those whose stats array is empty
    const newDueExercises = possibleExercises.filter((ex) => ex.stats.length === 0)
    // also check if parent number is due (or due is null)
    const oldDueExercises = possibleExercises.filter((ex) => {
      const parentDueAt = numberBank[ex.number.val].sr.dueAt
      return (
        ex.stats.length > 0 &&
        ex.sr.dueAt <= nowSeconds() &&
        (parentDueAt == null || parentDueAt <= nowSeconds())
      )
    })

    if (newDueExercises.length === 0 && oldDueExercises.length === 0) {
      // Nothing is due now: fall back to the currently most overdue seen exercise
      const fallbackExercise = possibleExercises
        .filter((item) => item.stats.length > 0)
        .sort((a, b) => a.sr.dueAt - b.sr.dueAt)[0]

      if (!fallbackExercise) {
        window.alert('You have nothing left to do right now! Come back later!')
        return
      }
      exercise.value = fallbackExercise
    } else {
      // pick an old exercise with 80% chance, but always new if no old exist
      // (and vice versa); the longer the streak, the likelier a new exercise
      const forNewExerciseMustBeLargerThan = Math.max(0.8 - streak.value * 0.03, 0.1)
      const pickNewExercise =
        Math.random() > forNewExerciseMustBeLargerThan ||
        (oldDueExercises.length === 0 && newDueExercises.length > 0)
      const randomIndex = Math.floor(Math.random() * 50)
      if (pickNewExercise) {
        exercise.value = newDueExercises.sort((a, b) => a.sr.dueAt - b.sr.dueAt)[
          Math.min(randomIndex, newDueExercises.length - 1)
        ]
      } else {
        exercise.value = oldDueExercises.sort((a, b) => a.sr.dueAt - b.sr.dueAt)[
          Math.min(randomIndex, oldDueExercises.length - 1)
        ]
      }
    }

    const currentExercise = exercise.value
    if (!currentExercise) return

    fieldUsedAsPrompt.value = currentExercise.promptType
    fieldUsedAsAnswer.value = currentExercise.answerType
    prompt.value = currentExercise.prompt
    correctAnswer.value = currentExercise.correctAnswer

    // 4 possible answers: the correct one, plus 3 wrong ones
    possibleAnswers.value = [currentExercise.correctAnswer]

    // try to find a possible answer out of the pool of already practiced numbers
    const alreadyPracticedExercises = exercises.filter((ex) => ex.stats.length > 0)
    for (const alreadyPracticedExercise of alreadyPracticedExercises) {
      if (
        alreadyPracticedExercise.answerType === currentExercise.answerType &&
        !possibleAnswers.value.includes(alreadyPracticedExercise.correctAnswer)
      ) {
        possibleAnswers.value.push(alreadyPracticedExercise.correctAnswer)
        break
      }
    }

    // add a near-miss answer: the correct number +/- 1..3 (clamped to 0-100)
    const possibleMeanAnswerNumber = currentExercise.number.val + Math.floor(Math.random() * 7) - 3
    if (possibleMeanAnswerNumber >= 0 && possibleMeanAnswerNumber <= 100) {
      const possibleMeanAnswer = numberBank[possibleMeanAnswerNumber][currentExercise.answerType]
      if (!possibleAnswers.value.includes(possibleMeanAnswer)) {
        possibleAnswers.value.push(possibleMeanAnswer)
      }
    }

    // fill the rest with random wrong answers of the same answer type
    const lengthOfPossibleAnswers = possibleAnswers.value.length
    for (let i = 0; i < 4 - lengthOfPossibleAnswers; i++) {
      let newWrongAnswer = numberBank[Math.floor(Math.random() * numberBank.length)][currentExercise.answerType]
      while (possibleAnswers.value.includes(newWrongAnswer) || newWrongAnswer === correctAnswer.value) {
        newWrongAnswer = numberBank[Math.floor(Math.random() * numberBank.length)][currentExercise.answerType]
      }
      possibleAnswers.value.push(newWrongAnswer)
    }

    possibleAnswers.value = possibleAnswers.value.sort(() => Math.random() - 0.5)
  }

  function handleAnswer(answer: AnswerValue): void {
    const currentExercise = exercise.value
    if (!currentExercise) return

    missions.value['Exercises Done'].progress++
    if (
      missions.value['Exercises Done'].progress >=
      missions.value['Exercises Done'].goals[missions.value['Exercises Done'].currentGoal]
    ) {
      missions.value['Exercises Done'].currentGoal++
    }

    exercisesDoneThisSession++
    const guessWasCorrect = answer === correctAnswer.value
    guessMade.value = true
    givenAnswer.value = answer
    indexOfAnswerClicked.value = possibleAnswers.value.indexOf(answer)

    const parentNumber = numberBank[currentExercise.number.val]

    // if answer correct, double interval; if incorrect, halve it (minimum 10)
    if (guessWasCorrect) {
      streak.value++
      missions.value.Streak.progress++
      if (missions.value.Streak.progress >= missions.value.Streak.goals[missions.value.Streak.currentGoal]) {
        missions.value.Streak.currentGoal++
      }
      currentExercise.sr.repetitions++
      // max level is 10
      parentNumber.level = Math.min(parentNumber.level + 1, 10)
      currentExercise.sr.interval = currentExercise.sr.interval * 2 * currentExercise.sr.repetitions
      // if the repetition before this one was more than 16h ago, set the interval to at least 16h
      if (
        currentExercise.stats.length > 1 &&
        currentExercise.stats[currentExercise.stats.length - 2].timestamp < nowSeconds() - 16 * 60 * 60
      ) {
        currentExercise.sr.interval = Math.max(currentExercise.sr.interval, 16 * 60 * 60)
      }
      parentNumber.sr.interval = parentNumber.sr.interval * 2
    } else {
      streak.value = 0
      missions.value.Streak.progress = 0
      currentExercise.sr.repetitions = 0
      // divide level by 2 and round down
      parentNumber.level = Math.floor(parentNumber.level / 2)
      currentExercise.sr.interval = Math.max(currentExercise.sr.interval / 2, 10)
      parentNumber.sr.interval = parentNumber.sr.interval / 2
    }

    currentExercise.sr.dueAt = nowSeconds() + currentExercise.sr.interval
    currentExercise.stats.push({
      guessWasCorrect,
      guess: answer,
      correctAnswer: correctAnswer.value,
      prompt: prompt.value,
      promptType: fieldUsedAsPrompt.value,
      answerType: fieldUsedAsAnswer.value,
      timestamp: nowSeconds()
    })
    parentNumber.sr.dueAt = nowSeconds() + parentNumber.sr.interval

    const plainNumberState = { val: parentNumber.val, level: parentNumber.level, sr: parentNumber.sr }
    const plainExercise = toPlain({ key: currentExercise.key, stats: currentExercise.stats, sr: currentExercise.sr })

    void appDb.numberState.put(plainNumberState)
    void appDb.exercises.put(plainExercise)
    void appDb.missions.put({ id: 'missions', value: toPlain(missions.value) })

    void logActivity('arabicnumbers')
  }

  async function load(): Promise<void> {
    try {
      const response = await fetch('/data/arabicnumbers/numbers.json')
      if (!response.ok) throw new Error(`Failed to load numbers (${response.status})`)
      const apiNumbers = (await response.json()) as ApiNumber[]
      apiNumbers.sort((a, b) => a.value - b.value)

      numberBank = apiNumbers.map((entry) => ({
        val: entry.value,
        ar: entry.numeral,
        ar_long: entry.script,
        en: entry.english,
        transliteration: entry.transliteration,
        level: 0,
        sr: { interval: 1, repetitions: 0, dueAt: null }
      }))

      const storedNumberState = await appDb.numberState.toArray()
      for (const record of storedNumberState) {
        const number = numberBank[record.val]
        if (number) {
          number.level = record.level
          number.sr = record.sr
        }
      }

      exercises = createExercises(numberBank)
      const exercisesByKey = new Map(exercises.map((ex) => [ex.key, ex]))

      const storedExercises = await appDb.exercises.toArray()
      for (const record of storedExercises) {
        const matchingExercise = exercisesByKey.get(record.key)
        if (matchingExercise) {
          matchingExercise.stats = record.stats
          matchingExercise.sr = record.sr
        }
      }

      const storedMissions = await appDb.missions.get('missions')
      if (storedMissions) {
        missions.value = storedMissions.value
      }

      getNextExercise()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : String(error)
    } finally {
      loading.value = false
    }
  }

  void load()

  return {
    loading,
    loadError,
    fieldUsedAsPrompt,
    fieldUsedAsAnswer,
    possibleAnswers,
    prompt,
    correctAnswer,
    givenAnswer,
    indexOfAnswerClicked,
    exercise,
    streak,
    guessMade,
    missions,
    getNumberBank: () => numberBank,
    getExercisesDoneThisSession: () => exercisesDoneThisSession,
    getNextExercise,
    handleAnswer,
    userSawExerciseBefore
  }
}
