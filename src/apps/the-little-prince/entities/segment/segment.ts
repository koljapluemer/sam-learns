export type Segment = {
  start: string
  end: string
  vocab: Record<string, string>
}

export async function getSegments(youtubeId: string): Promise<Segment[]> {
  const response = await fetch(`/data/the-little-prince/vocab/${youtubeId}.json`)
  if (!response.ok) throw new Error(`Failed to load segments (${response.status})`)
  return (await response.json()) as Segment[]
}
