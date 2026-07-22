// Port of linguanodon's infinitesentences app/practiceSession.js onto real Vue
// refs/computed (nativeIso/targetIso come from the route params here instead
// of a Django-rendered PracticeConfig). The original fetched one sentence at
// a time from a Django JSON endpoint keyed by pair+index; this repo's export
// (cms/infinitesentences/import_from_linguanodon.py) ships one JSON object
// per pair with every sentence already inlined, so sentence lookup here is a
// synchronous object read instead of a per-sentence fetch.
import { computed, ref } from 'vue'
import { Rating, type Grade } from 'ts-fsrs'
import { pickRandom, takeRandom } from './random'
import { createPracticeStore, createUserSettingsStore } from './store'
import { loadSentencesForPair } from './api'
import { buildPartKey, buildSentenceKey } from './keys'
import type {
  ChallengeTaskData,
  PracticeTask,
  SentenceData,
  SentencesByIndex,
  TaskText,
  UnderstandTaskData
} from './types'

type PartGlossState = 'VOCAB-TO-INTRODUCE' | 'VOCAB-TO-PRACTICE' | 'DONE'

interface PartEntry {
  key: string
  content: string
  translations: string[]
  usageExamples?: [string, string, string?][]
  transcription?: string
}

interface ActiveSentence {
  index: number
  key: string
  data: SentenceData
  partKeys: string[]
  finalQueued: boolean
}

const toTaskText = (content: string, refKey?: string): TaskText => ({ content, ref: refKey })

export function usePracticeSession(nativeIso: string, targetIso: string) {
  const practiceStore = createPracticeStore()
  const userSettingsStore = createUserSettingsStore()

  const todayCount = computed(() => {
    const today = new Date()
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return practiceStore.getLast14DaysSentenceCounts().find((d) => d.date === key)?.count ?? 0
  })
  const progressPercent = computed(() =>
    Math.min(100, (todayCount.value / userSettingsStore.dailySentenceGoal) * 100)
  )
  const goalReached = computed(() => todayCount.value >= userSettingsStore.dailySentenceGoal)

  let sentencesByIndex: SentencesByIndex = {}
  let availableIndices: number[] = []
  const activeSentences = ref<ActiveSentence[]>([])
  const partByKey = ref<Record<string, PartEntry>>({})
  let partState = new Map<string, PartGlossState>()
  const finalQueue = ref<string[]>([])
  const currentTask = ref<PracticeTask | null>(null)
  const lastPartKey = ref<string | null>(null)
  const lastIntroTask = ref<'memorize' | 'understand' | null>(null)
  const isLoading = ref(true)
  const errorMessage = ref<string | null>(null)

  function resetSession(): void {
    activeSentences.value = []
    partByKey.value = {}
    partState = new Map()
    finalQueue.value = []
    currentTask.value = null
    lastPartKey.value = null
    lastIntroTask.value = null
    errorMessage.value = null
  }

  function ensurePartEntry(part: SentenceData['parts'][number]): PartEntry {
    const key = buildPartKey(targetIso, part.content)
    if (!partByKey.value[key]) {
      partByKey.value[key] = { ...part, key }
    }
    if (!partState.has(key)) {
      const card = practiceStore.getGlossCard(key)
      if (!card) {
        partState.set(key, 'VOCAB-TO-INTRODUCE')
      } else if (practiceStore.isGlossDue(key)) {
        partState.set(key, 'VOCAB-TO-PRACTICE')
      } else {
        partState.set(key, 'DONE')
      }
    }
    return partByKey.value[key]
  }

  function addSentenceData(index: number, data: SentenceData): void {
    const key = buildSentenceKey(nativeIso, targetIso, index)
    const partKeys = data.parts.map((part) => ensurePartEntry(part).key)

    const willBeShown = partKeys.filter((k) => {
      const s = partState.get(k)
      return s === 'VOCAB-TO-INTRODUCE' || s === 'VOCAB-TO-PRACTICE'
    })
    const needed = 2 - willBeShown.length
    if (needed > 0) {
      const doneParts = partKeys
        .filter((k) => partState.get(k) === 'DONE')
        .map((k) => ({ k, due: practiceStore.getGlossDueDate(k) ?? new Date(0) }))
        .sort((a, b) => a.due.getTime() - b.due.getTime())
      for (const { k } of doneParts.slice(0, needed)) {
        partState.set(k, 'VOCAB-TO-PRACTICE')
      }
    }

    activeSentences.value.push({ index, key, data, partKeys, finalQueued: false })
    queueFinalIfReady(key)
  }

  function getAvailableSentenceIndices(): number[] {
    const activeIndices = new Set(activeSentences.value.map((sentence) => sentence.index))
    return availableIndices.filter((index) => {
      if (activeIndices.has(index)) return false
      const sentenceKey = buildSentenceKey(nativeIso, targetIso, index)
      return !practiceStore.isSentenceLearned(sentenceKey)
    })
  }

  function addRandomSentence(): boolean {
    const candidates = getAvailableSentenceIndices()
    const nextIndex = pickRandom(candidates)
    if (nextIndex === undefined) return false

    const data = sentencesByIndex[String(nextIndex)]
    if (!data) return false
    addSentenceData(nextIndex, data)
    return true
  }

  function ensureTwoSentences(): void {
    while (activeSentences.value.length < 2) {
      if (!addRandomSentence()) break
    }
  }

  function queueFinalIfReady(sentenceKey: string): void {
    const sentence = activeSentences.value.find((item) => item.key === sentenceKey)
    if (!sentence || sentence.finalQueued) return
    const ready = sentence.partKeys.every((key) => partState.get(key) === 'DONE')
    if (!ready) return
    sentence.finalQueued = true
    finalQueue.value.push(sentence.key)
  }

  function refreshFinalQueue(): void {
    activeSentences.value.forEach((sentence) => queueFinalIfReady(sentence.key))
  }

  function buildTranslations(translations: string[], limit = 3): TaskText[] {
    return takeRandom(translations, Math.min(limit, translations.length)).map((text) => toTaskText(text))
  }

  function buildMemorizeTask(partKey: string, part: PartEntry): PracticeTask {
    return {
      kind: 'memorize',
      partKey,
      data: {
        gloss: { ...toTaskText(part.content, partKey), transcription: part.transcription },
        translations: buildTranslations(part.translations)
      }
    }
  }

  function buildRecallTask(partKey: string, part: PartEntry): PracticeTask {
    return {
      kind: 'recall',
      partKey,
      data: {
        gloss: { ...toTaskText(part.content, partKey), transcription: part.transcription },
        translations: buildTranslations(part.translations)
      }
    }
  }

  function buildUnderstandTask(partKey: string, part: PartEntry): PracticeTask | null {
    if (!part.usageExamples || part.usageExamples.length < 2) return null

    const examples: UnderstandTaskData['examples'] = takeRandom(
      part.usageExamples,
      Math.min(3, part.usageExamples.length)
    ).map(([targetText, nativeText]) => ({
      example: toTaskText(targetText),
      translation: toTaskText(nativeText)
    }))

    if (examples.length < 2) return null

    return {
      kind: 'understand',
      partKey,
      data: {
        gloss: { ...toTaskText(part.content, partKey), transcription: part.transcription },
        translations: buildTranslations(part.translations),
        examples
      }
    }
  }

  function buildChallengeTask(sentence: ActiveSentence): PracticeTask {
    const data: ChallengeTaskData = {
      gloss: { ...toTaskText(sentence.data.sentence, sentence.key), transcription: sentence.data.transcription },
      translations: buildTranslations(sentence.data.translations),
      credits: sentence.data.credits
    }
    return { kind: 'challenge', sentenceKey: sentence.key, data }
  }

  function requestNextTask(): void {
    if (finalQueue.value.length) {
      const sentenceKey = finalQueue.value[0]
      const sentence = activeSentences.value.find((item) => item.key === sentenceKey)
      if (sentence) currentTask.value = buildChallengeTask(sentence)
      return
    }

    const eligible: string[] = []
    for (const [key, state] of partState.entries()) {
      if ((state === 'VOCAB-TO-INTRODUCE' || state === 'VOCAB-TO-PRACTICE') && key !== lastPartKey.value) {
        eligible.push(key)
      }
    }

    if (!eligible.length) {
      for (const [key, state] of partState.entries()) {
        if (state === 'VOCAB-TO-INTRODUCE' || state === 'VOCAB-TO-PRACTICE') eligible.push(key)
      }
    }

    const selectedKey = pickRandom(eligible)
    if (!selectedKey) return

    const part = partByKey.value[selectedKey]
    if (!part) return

    const state = partState.get(selectedKey)
    if (!state) return

    lastPartKey.value = selectedKey

    if (state === 'VOCAB-TO-INTRODUCE') {
      const preferredOrder: ('memorize' | 'understand')[] =
        lastIntroTask.value === 'memorize' ? ['understand', 'memorize'] : ['memorize', 'understand']
      for (const option of preferredOrder) {
        if (option === 'understand') {
          const understand = buildUnderstandTask(selectedKey, part)
          if (understand) {
            currentTask.value = understand
            lastIntroTask.value = 'understand'
            return
          }
        }
        if (option === 'memorize') {
          currentTask.value = buildMemorizeTask(selectedKey, part)
          lastIntroTask.value = 'memorize'
          return
        }
      }
    } else {
      currentTask.value = buildRecallTask(selectedKey, part)
    }
  }

  function handleTaskDone(rememberedCorrectly?: boolean): void {
    const task = currentTask.value
    if (!task) return

    if (task.kind === 'challenge') {
      const sentenceKey = task.sentenceKey
      practiceStore.markSentenceLearned(sentenceKey)
      practiceStore.recordSentenceCompleted(targetIso)
      finalQueue.value = finalQueue.value.filter((key) => key !== sentenceKey)
      activeSentences.value = activeSentences.value.filter((sentence) => sentence.key !== sentenceKey)
      currentTask.value = null

      ensureTwoSentences()
      refreshFinalQueue()
      requestNextTask()
      if (!currentTask.value && !activeSentences.value.length) {
        errorMessage.value = 'No more sentences to learn. Come back soon!'
      }
      return
    }

    const partKey = task.partKey

    if (task.kind === 'memorize' || task.kind === 'understand') {
      partState.set(partKey, 'VOCAB-TO-PRACTICE')
    } else if (task.kind === 'recall') {
      const remembered = rememberedCorrectly ?? false
      const rating: Grade = remembered ? Rating.Good : Rating.Again
      practiceStore.recordGlossReview(partKey, rating)
      if (remembered) partState.set(partKey, 'DONE')
    }

    currentTask.value = null
    refreshFinalQueue()
    requestNextTask()
  }

  async function loadPractice(): Promise<void> {
    isLoading.value = true
    resetSession()
    try {
      sentencesByIndex = await loadSentencesForPair(nativeIso, targetIso)
      availableIndices = Object.keys(sentencesByIndex)
        .map((key) => Number(key))
        .sort((a, b) => a - b)
      ensureTwoSentences()

      if (!activeSentences.value.length) {
        errorMessage.value = 'No sentences available for this language pair.'
        return
      }

      refreshFinalQueue()
      requestNextTask()
    } catch (error) {
      console.error('Failed to load practice data:', error)
      errorMessage.value = 'Failed to load practice data.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    todayCount,
    progressPercent,
    goalReached,
    isLoading,
    errorMessage,
    currentTask,
    handleTaskDone,
    loadPractice
  }
}
