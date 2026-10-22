// Picks a random video, then its first unwatched snippet - or, once all are
// watched, a random one. Snippets without subtitles are skipped, as are
// videos left with none.
import type { Video } from '../../entities/video/video'
import { getSnippets, hasSubtitles, type Snippet } from '../../entities/snippet/snippet'
import { getWatchedSnippetIds } from '../../entities/snippet-view/snippetView'
import { pickRandom, shuffleArray } from '../../dumb/random'

export type Selection = {
  youtubeId: string
  snippet: Snippet
}

const usableSnippetsByVideo = new Map<string, Snippet[]>()

async function getUsableSnippets(youtubeId: string): Promise<Snippet[]> {
  let snippets = usableSnippetsByVideo.get(youtubeId)
  if (!snippets) {
    snippets = (await getSnippets(youtubeId)).filter(hasSubtitles)
    usableSnippetsByVideo.set(youtubeId, snippets)
  }
  return snippets
}

export async function selectNextSnippet(videos: Video[]): Promise<Selection | null> {
  for (const { youtubeId } of shuffleArray(videos)) {
    const snippets = await getUsableSnippets(youtubeId)
    if (snippets.length === 0) continue

    const watched = await getWatchedSnippetIds(youtubeId)
    const snippet = snippets.find((item) => !watched.has(item.id)) ?? pickRandom(snippets)!
    return { youtubeId, snippet }
  }
  return null
}
