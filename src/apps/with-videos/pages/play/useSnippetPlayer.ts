// Shows one snippet at a time on a single persistent YouTube player: cue it
// (paused, in the background), then play it and get notified at its end -
// via polling, since the API has no "reached time X" event. Until a newly
// cued video actually plays, getCurrentTime may still report the previous
// video's time, so polling ignores that window.
import { createPlayer, PLAYER_STATE_PLAYING, type YTPlayer } from '../../dumb/youtube'
import type { Snippet } from '../../entities/snippet/snippet'

const POLL_INTERVAL_MS = 250

export function useSnippetPlayer(elementId: string) {
  let player: YTPlayer | null = null
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

  async function cue(youtubeId: string, snippet: Snippet): Promise<void> {
    stopPolling()
    player ??= await createPlayer(elementId, youtubeId, onStateChange)
    switchingVideo = true
    player.cueVideoById(youtubeId, snippet.start)
  }

  function play(snippet: Snippet, onEnded: () => void): void {
    if (!player) return
    stopPolling()
    player.playVideo()

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

  return { cue, play, destroy }
}
