import { appDb } from '../../db/appDb'

export type Reflection = {
  question: string
  answer: string
  ratingQuestion: string
  rating: number
}

export async function markSnippetWatched(youtubeId: string, snippetId: string): Promise<string> {
  const id = crypto.randomUUID()
  await appDb.snippetViews.add({ id, youtubeId, snippetId, watchedAt: new Date() })
  return id
}

export async function getWatchedSnippetIds(youtubeId: string): Promise<Set<string>> {
  const rows = await appDb.snippetViews.where('youtubeId').equals(youtubeId).toArray()
  return new Set(rows.map((row) => row.snippetId))
}

export async function saveReflection(id: string, reflection: Reflection): Promise<void> {
  await appDb.snippetViews.update(id, reflection)
}
