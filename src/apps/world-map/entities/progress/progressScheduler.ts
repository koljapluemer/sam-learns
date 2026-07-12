import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'
import { appDb, makeExerciseKey } from '@/apps/world-map/db/appDb'
import { getEnabledCountries, type EnabledCountry } from '@/apps/world-map/entities/neighborhood-content/neighborhoodContent'

const PAN_INDEX_COUNT = 9
const scheduler = fsrs()

export type NextExercise = { country: string; zoom: number; panIndex: number }

export type SubmittedAnswer = {
  country: string
  panIndex: number
  numberOfClicksNeeded: number
  msToFirstClick: number
}

let lastCountry: string | null = null

function isDue(card: Card, now: Date): boolean {
  return card.due <= now
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

async function pickCountry(): Promise<EnabledCountry | undefined> {
  const enabled = await getEnabledCountries()
  if (enabled.length === 0) return undefined

  const candidates = enabled.length > 1 ? enabled.filter((entry) => entry.country !== lastCountry) : enabled

  const progressRows = await appDb.countryProgress.toArray()
  const progressByCountry = new Map(progressRows.map((row) => [row.country, row]))
  const now = new Date()

  const due: EnabledCountry[] = []
  const fresh: EnabledCountry[] = []
  for (const candidate of candidates) {
    const progress = progressByCountry.get(candidate.country)
    if (!progress) fresh.push(candidate)
    else if (isDue(progress, now)) due.push(candidate)
  }

  const pool = due.length > 0 ? due : fresh.length > 0 ? fresh : candidates
  return pickRandom(pool)
}

async function pickPanIndex(country: string): Promise<number> {
  const now = new Date()
  const panIndices = Array.from({ length: PAN_INDEX_COUNT }, (_, index) => index)
  const rows = await Promise.all(panIndices.map((panIndex) => appDb.exerciseProgress.get(makeExerciseKey(country, panIndex))))

  const due: number[] = []
  const fresh: number[] = []
  rows.forEach((row, panIndex) => {
    if (!row) fresh.push(panIndex)
    else if (isDue(row, now)) due.push(panIndex)
  })

  const pool = due.length > 0 ? due : fresh.length > 0 ? fresh : panIndices
  return pickRandom(pool)
}

export async function loadNextExercise(): Promise<NextExercise | undefined> {
  const picked = await pickCountry()
  if (!picked) return undefined

  lastCountry = picked.country
  const panIndex = await pickPanIndex(picked.country)
  return { country: picked.country, zoom: picked.zoom, panIndex }
}

export async function submitAnswer(input: SubmittedAnswer): Promise<void> {
  const now = new Date()
  const rating = input.numberOfClicksNeeded === 1 ? Rating.Good : Rating.Again
  const exerciseKey = makeExerciseKey(input.country, input.panIndex)

  const [countryEntry, exerciseEntry] = await Promise.all([
    appDb.countryProgress.get(input.country),
    appDb.exerciseProgress.get(exerciseKey)
  ])

  const countryCard = countryEntry ?? createEmptyCard(now)
  const exerciseCard = exerciseEntry ?? createEmptyCard(now)

  const { card: nextCountryCard } = scheduler.next(countryCard, now, rating)
  const { card: nextExerciseCard } = scheduler.next(exerciseCard, now, rating)

  await Promise.all([
    appDb.countryProgress.put({ ...nextCountryCard, country: input.country }),
    appDb.exerciseProgress.put({ ...nextExerciseCard, exerciseKey, country: input.country, panIndex: input.panIndex }),
    appDb.learningEvents.put({
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      country: input.country,
      panIndex: input.panIndex,
      numberOfClicksNeeded: input.numberOfClicksNeeded,
      msToFirstClick: input.msToFirstClick
    })
  ])
}
