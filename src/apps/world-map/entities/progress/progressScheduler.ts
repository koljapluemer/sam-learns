import { createEmptyCard, fsrs, Rating, type Card } from 'ts-fsrs'
import { appDb, makeExerciseKey, type ExerciseType } from '@/apps/world-map/db/appDb'
import { getEnabledCountries as getEnabledNeighborhoodCountries } from '@/apps/world-map/entities/neighborhood-content/neighborhoodContent'
import { getEnabledCountries as getEnabledWorldMapCountries } from '@/apps/world-map/entities/world-map-content/worldMapContent'
import { getEnabledCountries as getEnabledIdentifyCountries } from '@/apps/world-map/entities/identify-country-content/identifyCountryContent'
import { getEnabledCountries as getEnabledDistractorChoiceCountries } from '@/apps/world-map/entities/distractor-choice-content/distractorChoiceContent'
import { getEnabledGroups, type CountryGroup } from '@/apps/world-map/entities/country-group-content/countryGroupContent'
// shared cross-cutting infra, see docs/adding-an-app.md
import { logActivity } from '@/shared/activity/useLearningEvent'

const PAN_INDEX_COUNT = 9
const GROUP_TRIGGER_FRACTION = 0.5
const scheduler = fsrs()

export type NextExercise =
  | { type: 'find-in-neighborhood'; country: string; zoom: number; panIndex: number }
  | { type: 'find-on-world-map'; country: string }
  | { type: 'identify-country'; country: string; distractor: string }
  | { type: 'distractor-choice'; country: string; zoom: number; panIndex: number; distractor: string }
  | { type: 'group-sequence'; groupId: string; countries: string[] }

export type SubmittedAnswer = {
  type: ExerciseType
  country: string
  panIndex?: number
  groupId?: string
  numberOfClicksNeeded: number
  msToFirstClick: number
}

type CountryCandidate = {
  country: string
  enabledTypes: ExerciseType[]
  neighborhoodZoom?: number
  distractorChoiceZoom?: number
  distractorChoiceDistractors?: string[]
}
type ExerciseInstance =
  | { type: 'find-in-neighborhood'; panIndex: number }
  | { type: 'find-on-world-map' }
  | { type: 'identify-country' }
  | { type: 'distractor-choice' }

let lastCountry: string | null = null

function isDue(card: Card, now: Date): boolean {
  return card.due <= now
}

export function getRetrievability(card: Card, now: Date = new Date()): number {
  return scheduler.get_retrievability(card, now, false)
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]
}

async function getCandidateCountries(): Promise<CountryCandidate[]> {
  const [neighborhoodCountries, worldMapCountries, identifyCountries, distractorChoiceCountries] = await Promise.all([
    getEnabledNeighborhoodCountries(),
    getEnabledWorldMapCountries(),
    getEnabledIdentifyCountries(),
    getEnabledDistractorChoiceCountries()
  ])

  const candidates = new Map<string, CountryCandidate>()
  for (const entry of neighborhoodCountries) {
    candidates.set(entry.country, { country: entry.country, enabledTypes: ['find-in-neighborhood'], neighborhoodZoom: entry.zoom })
  }
  for (const entry of worldMapCountries) {
    const existing = candidates.get(entry.country)
    if (existing) existing.enabledTypes.push('find-on-world-map')
    else candidates.set(entry.country, { country: entry.country, enabledTypes: ['find-on-world-map'] })
  }
  for (const entry of identifyCountries) {
    const existing = candidates.get(entry.country)
    if (existing) existing.enabledTypes.push('identify-country')
    else candidates.set(entry.country, { country: entry.country, enabledTypes: ['identify-country'] })
  }
  for (const entry of distractorChoiceCountries) {
    const existing = candidates.get(entry.country)
    if (existing) {
      existing.enabledTypes.push('distractor-choice')
      existing.distractorChoiceZoom = entry.zoom
      existing.distractorChoiceDistractors = entry.distractors
    } else {
      candidates.set(entry.country, {
        country: entry.country,
        enabledTypes: ['distractor-choice'],
        distractorChoiceZoom: entry.zoom,
        distractorChoiceDistractors: entry.distractors
      })
    }
  }
  return Array.from(candidates.values())
}

async function findQualifyingGroup(now: Date): Promise<CountryGroup | undefined> {
  const groups = await getEnabledGroups()
  if (groups.length === 0) return undefined

  const progressRows = await appDb.countryProgress.toArray()
  const progressByCountry = new Map(progressRows.map((row) => [row.country, row]))

  const qualifying = groups.filter((group) => {
    const dueOrUnseenCount = group.countries.filter((code) => {
      const progress = progressByCountry.get(code)
      return !progress || isDue(progress, now)
    }).length
    return dueOrUnseenCount / group.countries.length >= GROUP_TRIGGER_FRACTION
  })

  return qualifying.length > 0 ? pickRandom(qualifying) : undefined
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

function buildInstanceCandidates(
  enabledTypes: ExerciseType[],
  identifyCountryPoolSize: number,
  distractorChoiceCount: number
): ExerciseInstance[] {
  const instances: ExerciseInstance[] = []
  if (enabledTypes.includes('find-in-neighborhood')) {
    for (let panIndex = 0; panIndex < PAN_INDEX_COUNT; panIndex += 1) {
      instances.push({ type: 'find-in-neighborhood', panIndex })
    }
  }
  if (enabledTypes.includes('find-on-world-map')) {
    instances.push({ type: 'find-on-world-map' })
  }
  if (enabledTypes.includes('identify-country') && identifyCountryPoolSize > 1) {
    instances.push({ type: 'identify-country' })
  }
  if (enabledTypes.includes('distractor-choice') && distractorChoiceCount > 0) {
    instances.push({ type: 'distractor-choice' })
  }
  return instances
}

async function pickExerciseInstance(
  country: string,
  enabledTypes: ExerciseType[],
  identifyCountryPoolSize: number,
  distractorChoiceCount: number
): Promise<ExerciseInstance> {
  const now = new Date()
  const candidates = buildInstanceCandidates(enabledTypes, identifyCountryPoolSize, distractorChoiceCount)
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

function buildDistractorChoiceExercise(picked: CountryCandidate): NextExercise {
  const distractors = picked.distractorChoiceDistractors ?? []
  return {
    type: 'distractor-choice',
    country: picked.country,
    zoom: picked.distractorChoiceZoom ?? 140,
    panIndex: Math.floor(Math.random() * PAN_INDEX_COUNT),
    distractor: pickRandom(distractors)
  }
}

export async function loadNextExercise(): Promise<NextExercise | undefined> {
  const qualifyingGroup = await findQualifyingGroup(new Date())
  if (qualifyingGroup) {
    const countries = Math.random() < 0.5 ? qualifyingGroup.countries : [...qualifyingGroup.countries].reverse()
    lastCountry = countries[countries.length - 1]
    return { type: 'group-sequence', groupId: qualifyingGroup.id, countries }
  }

  const picked = await pickCountry()
  if (!picked) return undefined

  lastCountry = picked.country

  const isFreshCountry = !(await appDb.countryProgress.get(picked.country))
  const hasIntroExercise = picked.enabledTypes.includes('distractor-choice') && (picked.distractorChoiceDistractors?.length ?? 0) > 0
  if (isFreshCountry && hasIntroExercise) {
    return buildDistractorChoiceExercise(picked)
  }

  const identifyCountryPool = (await getEnabledIdentifyCountries()).map((entry) => entry.country)
  const instance = await pickExerciseInstance(
    picked.country,
    picked.enabledTypes,
    identifyCountryPool.length,
    picked.distractorChoiceDistractors?.length ?? 0
  )

  if (instance.type === 'find-in-neighborhood') {
    return { type: 'find-in-neighborhood', country: picked.country, zoom: picked.neighborhoodZoom ?? 100, panIndex: instance.panIndex }
  }
  if (instance.type === 'identify-country') {
    const distractor = pickRandom(identifyCountryPool.filter((country) => country !== picked.country))
    return { type: 'identify-country', country: picked.country, distractor }
  }
  if (instance.type === 'distractor-choice') {
    return buildDistractorChoiceExercise(picked)
  }
  return { type: 'find-on-world-map', country: picked.country }
}

export async function submitAnswer(input: SubmittedAnswer): Promise<void> {
  const now = new Date()
  const rating = input.numberOfClicksNeeded === 1 ? Rating.Good : Rating.Again
  const exerciseKey = makeExerciseKey(input.type, input.country, input.panIndex, input.groupId)

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
    appDb.exerciseProgress.put({
      ...nextExerciseCard,
      exerciseKey,
      exerciseType: input.type,
      country: input.country,
      panIndex: input.panIndex,
      groupId: input.groupId
    }),
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

  await logActivity('world-map')
}
