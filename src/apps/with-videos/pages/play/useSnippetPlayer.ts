// Plays one snippet at a time on a single persistent YouTube player and
// reports when it reaches the snippet's end - via polling, since the API
// has no "reached time X" event. Switching videos uses loadVideoById; until
// the new video actually plays, getCurrentTime may still report the old
// video's time, so polling ignores that window.
import { createPlayer, PLAYER_STATE_PLAYING, type YTPlayer } from '../../dumb/youtube'
import type { Snippet } from '../../entities/snippet/snippet'

const POLL_INTERVAL_MS = 250

export function useSnippetPlayer(elementId: string) {
  let player: YTPlayer | null = null
  let loadedVideoId = ''
  let switchingVideo = false
  let pollIntervalId: number | null = null

  function stopPolling(): void {
    if (pollIntervalId !== null) {
      window.clearInterval(pollIntervalId)
      pollIntervalId = null
    }
  }

  function onStateChange(state: number): void {
    if (state === PLAYER_STATE_PLAYING) switchingVideo = false
  }

  async function init(youtubeId: string): Promise<void> {
    player = await createPlayer(elementId, youtubeId, onStateChange)
    loadedVideoId = youtubeId
  }

  function play(youtubeId: string, snippet: Snippet, onEnded: () => void): void {
    if (!player) return
    stopPolling()

    if (youtubeId === loadedVideoId) {
      player.seekTo(snippet.start, true)
      player.playVideo()
    } else {
      switchingVideo = true
      loadedVideoId = youtubeId
      player.loadVideoById(youtubeId, snippet.start)
    }

    pollIntervalId = window.setInterval(() => {
      if (!player || switchingVideo || player.getCurrentTime() < snippet.end) return
      stopPolling()
      player.pauseVideo()
      onEnded()
    }, POLL_INTERVAL_MS)
  }

  function destroy(): void {
    stopPolling()
    player?.destroy()
  }

  return { init, play, destroy }
}
