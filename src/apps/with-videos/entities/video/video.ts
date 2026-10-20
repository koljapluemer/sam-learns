export type Video = {
  youtubeId: string
  title: string
  languageCode: string
  languageName: string
}

export type Language = {
  code: string
  name: string
}

export async function getVideos(): Promise<Video[]> {
  const response = await fetch('/data/with-videos/videos.json')
  if (!response.ok) throw new Error(`Failed to load videos (${response.status})`)
  return (await response.json()) as Video[]
}

export async function getLanguages(): Promise<Language[]> {
  const namesByCode = new Map((await getVideos()).map((video) => [video.languageCode, video.languageName]))
  return [...namesByCode].map(([code, name]) => ({ code, name }))
}
