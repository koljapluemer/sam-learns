export type VocabItem = {
  term: string
  translation: string
  // Essential to grasp the snippet's meaning (vs. fillers/details).
  core: boolean
}

export type Snippet = {
  id: string
  start: number
  end: number
  text: string
  vocab: VocabItem[]
}

export async function getSnippets(youtubeId: string): Promise<Snippet[]> {
  const response = await fetch(`/data/with-videos/snippets/${youtubeId}.json`)
  if (!response.ok) throw new Error(`Failed to load snippets (${response.status})`)
  return (await response.json()) as Snippet[]
}

// Snippets without subtitle text (and thus no vocab) can't be practised.
export function hasSubtitles(snippet: Snippet): boolean {
  return snippet.text.trim() !== '' && snippet.vocab.length > 0
}
