// Thin wrapper over the YouTube IFrame Player API, ported from
// linguanodon's comprehensible_input app/player.js. Loads the API script
// itself instead of relying on a Django template's <script> tag.

let apiLoadPromise: Promise<void> | null = null

function loadYouTubeApi(): Promise<void> {
  if (window.YT && window.YT.Player) return Promise.resolve()
  if (apiLoadPromise) return apiLoadPromise

  apiLoadPromise = new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => resolve()
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
) {
  await loadYouTubeApi()
  return new window.YT.Player(elementId, {
    videoId: youtubeId,
    // Percentage values become the iframe's width/height HTML attributes,
    // letting it fill the (never-replaced) aspect-ratio wrapper around it.
    width: '100%',
    height: '100%',
    events: {
      onStateChange: (event: { data: number }) => onStateChange(event.data)
    }
  })
}
