export type LanguageCatalogEntry = {
  code: string
  languageLongform: string
  youtubeId: string
  title: string
}

type IndexJson = Record<string, { language_longform: string; id: string; title: string }>

export async function getLanguageCatalog(): Promise<LanguageCatalogEntry[]> {
  const response = await fetch('/data/the-little-prince/index.json')
  if (!response.ok) throw new Error(`Failed to load language catalog (${response.status})`)

  const record = (await response.json()) as IndexJson
  return Object.entries(record).map(([code, entry]) => ({
    code,
    languageLongform: entry.language_longform,
    youtubeId: entry.id,
    title: entry.title
  }))
}
