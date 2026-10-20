// Auto-chooses what to watch next: the following snippet of the current
// video, or - once a video is done - a random video of the language,
// preferring ones never started.
import type { Video } from '../../entities/video/video'
import { pickRandom } from '../../dumb/random'

export type Position = {
  youtubeId: string
  index: number
}

export function pickNewVideo(videos: Video[], startedIds: string[], excludeId?: string): string {
  const others = videos.filter((video) => video.youtubeId !== excludeId)
  const unstarted = others.filter((video) => !startedIds.includes(video.youtubeId))
  return (pickRandom(unstarted) ?? pickRandom(others) ?? videos[0]).youtubeId
}

export function nextPosition(current: Position, snippetCount: number, videos: Video[], startedIds: string[]): Position {
  if (current.index + 1 < snippetCount) return { ...current, index: current.index + 1 }
  return { youtubeId: pickNewVideo(videos, startedIds, current.youtubeId), index: 0 }
}
