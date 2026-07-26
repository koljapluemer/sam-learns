// Thin wrapper over the YouTube IFrame Player API, based on
// comprehensible-input/app/youtube.ts. Extended with seekTo/destroy (which
// this app needs for segment-level playback control) and resolves only once
// the player fires onReady, so callers can safely seek/play immediately.
// Self-contained (no `declare global`) so it can't clash with any other
// app's own ambient Window.YT typing.

export interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  getCurrentTime(): number
  seekTo(seconds: number, allowSeekAhead: boolean): void
  destroy(): void
}

interface YTNamespace {
  Player: new (elementId: string, options: Record<string, unknown>) => YTPlayer
}

function getYT(): YTNamespace | undefined {
  return (window as unknown as { YT?: YTNamespace }).YT
}

let apiLoadPromise: Promise<void> | null = null

function loadYouTubeApi(): Promise<void> {
  if (getYT()?.Player) return Promise.resolve()
  if (apiLoadPromise) return apiLoadPromise

  apiLoadPromise = new Promise((resolve) => {
    ;(window as unknown as { onYouTubeIframeAPIReady: () => void }).onYouTubeIframeAPIReady = () => resolve()
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  })
  return apiLoadPromise
}

export async function createPlayer(
  elementId: string,
  youtubeId: string,
  onStateChange: (state: number) => void
): Promise<YTPlayer> {
  await loadYouTubeApi()
  const YT = getYT()
  if (!YT) throw new Error('YouTube IFrame API failed to load')

  return new Promise((resolve) => {
    const player = new YT.Player(elementId, {
      videoId: youtubeId,
      // Percentage values become the iframe's width/height HTML attributes,
      // letting it fill the (never-replaced) aspect-ratio wrapper around it.
      width: '100%',
      height: '100%',
      events: {
        onReady: () => resolve(player),
        onStateChange: (event: { data: number }) => onStateChange(event.data)
      }
    })
  })
}
