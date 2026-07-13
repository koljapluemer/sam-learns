import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'
import { appDb, makeExerciseKey, type ExerciseType } from '@/apps/world-map/db/appDb'
import { getEnabledCountries as getEnabledNeighborhoodCountries } from '@/apps/world-map/entities/neighborhood-content/neighborhoodContent'
import { getEnabledCountries as getEnabledWorldMapCountries } from '@/apps/world-map/entities/world-map-content/worldMapContent'

const PAN_INDEX_COUNT = 9
const scheduler = fsrs()

export type NextExercise =
  | { type: 'find-in-neighborhood'; country: string; zoom: number; panIndex: number }
  | { type: 'find-on-world-map'; country: string }

export type SubmittedAnswer = {
  type: ExerciseType
  country: string
  panIndex?: number
  numberOfClicksNeeded: number
  msToFirstClick: number
}

type CountryCandidate = { country: string; enabledTypes: ExerciseType[]; neighborhoodZoom?: number }
type ExerciseInstance = { type: 'find-in-neighborhood'; panIndex: number } | { type: 'find-on-world-map' }

let lastCountry: string | null = null

function isDue(card: Card, now: Date): boolean {
  return card.due <= now
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

async function getCandidateCountries(): Promise<CountryCandidate[]> {
  const [neighborhoodCountries, worldMapCountries] = await Promise.all([getEnabledNeighborhoodCountries(), getEnabledWorldMapCountries()])

  const candidates = new Map<string, CountryCandidate>()
  for (const entry of neighborhoodCountries) {
    candidates.set(entry.country, { country: entry.country, enabledTypes: ['find-in-neighborhood'], neighborhoodZoom: entry.zoom })
  }
  for (const entry of worldMapCountries) {
    const existing = candidates.get(entry.country)
    if (existing) existing.enabledTypes.push('find-on-world-map')
    else candidates.set(entry.country, { country: entry.country, enabledTypes: ['find-on-world-map'] })
  }
  return Array.from(candidates.values())
}

async function pickCountry(): Promise<CountryCandidate | undefined> {
  const enabled = await getCandidateCountries()
  if (enabled.length === 0) return undefined

  const candidates = enabled.length > 1 ? enabled.filter((entry) => entry.country !== lastCountry) : enabled

  const progressRows = await appDb.countryProgress.toArray()
  const progressByCountry = new Map(progressRows.map((row) => [row.country, row]))
  const now = new Date()

  const due: CountryCandidate[] = []
  const fresh: CountryCandidate[] = []
  for (const candidate of candidates) {
    const progress = progressByCountry.get(candidate.country)
    if (!progress) fresh.push(candidate)
    else if (isDue(progress, now)) due.push(candidate)
  }

  const pool = due.length > 0 ? due : fresh.length > 0 ? fresh : candidates
  return pickRandom(pool)
}

function buildInstanceCandidates(enabledTypes: ExerciseType[]): ExerciseInstance[] {
  const instances: ExerciseInstance[] = []
  if (enabledTypes.includes('find-in-neighborhood')) {
    for (let panIndex = 0; panIndex < PAN_INDEX_COUNT; panIndex += 1) {
      instances.push({ type: 'find-in-neighborhood', panIndex })
    }
  }
  if (enabledTypes.includes('find-on-world-map')) {
    instances.push({ type: 'find-on-world-map' })
  }
  return instances
}

async function pickExerciseInstance(country: string, enabledTypes: ExerciseType[]): Promise<ExerciseInstance> {
  const now = new Date()
  const candidates = buildInstanceCandidates(enabledTypes)
  const rows = await Promise.all(
    candidates.map((instance) =>
      appDb.exerciseProgress.get(makeExerciseKey(instance.type, country, instance.type === 'find-in-neighborhood' ? instance.panIndex : undefined))
    )
  )

  const due: ExerciseInstance[] = []
  const fresh: ExerciseInstance[] = []
  rows.forEach((row, index) => {
    if (!row) fresh.push(candidates[index])
    else if (isDue(row, now)) due.push(candidates[index])
  })

  const pool = due.length > 0 ? due : fresh.length > 0 ? fresh : candidates
  return pickRandom(pool)
}

export async function loadNextExercise(): Promise<NextExercise | undefined> {
  const picked = await pickCountry()
  if (!picked) return undefined

  lastCountry = picked.country
  const instance = await pickExerciseInstance(picked.country, picked.enabledTypes)

  if (instance.type === 'find-in-neighborhood') {
    return { type: 'find-in-neighborhood', country: picked.country, zoom: picked.neighborhoodZoom ?? 100, panIndex: instance.panIndex }
  }
  return { type: 'find-on-world-map', country: picked.country }
}

export async function submitAnswer(input: SubmittedAnswer): Promise<void> {
  const now = new Date()
  const rating = input.numberOfClicksNeeded === 1 ? Rating.Good : Rating.Again
  const exerciseKey = makeExerciseKey(input.type, input.country, input.panIndex)

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
    appDb.exerciseProgress.put({ ...nextExerciseCard, exerciseKey, exerciseType: input.type, country: input.country, panIndex: input.panIndex }),
    appDb.learningEvents.put({
      id: crypto.randomUUID(),
      timestamp: now.toISOString(),
      exerciseType: input.type,
      country: input.country,
      panIndex: input.panIndex,
      numberOfClicksNeeded: input.numberOfClicksNeeded,
      msToFirstClick: input.msToFirstClick
    })
  ])
}
