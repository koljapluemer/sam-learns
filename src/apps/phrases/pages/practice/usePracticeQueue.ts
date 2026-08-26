import { onMounted, ref } from 'vue'
import { Rating, type Card, type Grade } from 'ts-fsrs'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { getLanguageGoals, getLanguages, type PhraseExpression } from '../../entities/phrase-catalog/phraseCatalog'
import { expressionCardId, getSchedules, rateExpression } from '../../entities/phrase-schedule/phraseSchedule'

export type PracticeItem = {
  id: string
  languageCode: string
  languageName: string
  goalKey: string
  expression: PhraseExpression
  schedule: Card | undefined
}

let lastItemId: string | null = null

export function usePracticeQueue() {
  const loading = ref(true)
  const item = ref<PracticeItem | null>(null)

  async function loadNext(): Promise<void> {
    loading.value = true
    const languages = await getLanguages()
    const goalsByLanguage = await Promise.all(languages.map((language) => getLanguageGoals(language.code)))
    const schedules = await getSchedules()
    const now = new Date()

    const all: PracticeItem[] = []
    languages.forEach((language, i) => {
      for (const goal of goalsByLanguage[i] ?? []) {
        for (const expression of goal.expressions) {
          const id = expressionCardId(language.code, goal.key, expression.text)
          all.push({
            id,
            languageCode: language.code,
            languageName: language.name,
            goalKey: goal.key,
            expression,
            schedule: schedules.get(id)
          })
        }
      }
    })

    const eligible = all.filter(({ schedule }) => !schedule || schedule.due <= now)
    const due = eligible.filter(({ schedule }) => schedule)
    const unseen = eligible.filter(({ schedule }) => !schedule)
    const preferred = due.length > 0 ? due : unseen
    const withoutPrevious = preferred.filter((candidate) => candidate.id !== lastItemId)
    const pool = withoutPrevious.length > 0 ? withoutPrevious : preferred

    const next = pool.length > 0 ? (pool[Math.floor(Math.random() * pool.length)] ?? null) : null
    lastItemId = next?.id ?? null
    item.value = next
    loading.value = false
  }

  async function rate(rating: Grade): Promise<void> {
    if (!item.value) return
    await rateExpression(item.value.id, item.value.schedule, rating)
    await logActivity('phrases')
    await loadNext()
  }

  onMounted(loadNext)

  return { loading, item, rate, Rating }
}
