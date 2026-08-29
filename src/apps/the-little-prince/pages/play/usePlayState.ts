// State machine for the main Play loop: play a segment, detect its end via
// polling (the YouTube API has no "reached time X" event), then hand off to
// a minimal SELECT screen with four branches, two of which detour through a
// vocab-practice session before resuming autoplay. The player is created
// once and only ever seeked between segments, never destroyed/recreated.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { createPlayer, type YTPlayer } from '../../dumb/youtube'
import { parseTimeCode } from '../../dumb/timeCode'
import { getLanguageCatalog } from '../../entities/language-catalog/languageCatalog'
import { getSegments, type Segment } from '../../entities/segment/segment'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import { logActivity } from '@/shared/activity/useLearningEvent'

export type PlayMode = 'loading' | 'playing' | 'select' | 'vocab-practice'

const POLL_INTERVAL_MS = 250
const PLAYER_ELEMENT_ID = 'the-little-prince-yt-player'

export function usePlayState() {
  const languageCode = useLocalSetting('the-little-prince.language-code', '')

  const mode = ref<PlayMode>('loading')
  const loadError = ref('')
  const youtubeId = ref('')
  const segments = ref<Segment[]>([])
  const segmentIndex = useLocalSetting(`the-little-prince.segment-index.${languageCode.value}`, 0)

  let player: YTPlayer | null = null
  let pollIntervalId: number | null = null

  const currentSegment = computed<Segment | null>(() => segments.value[segmentIndex.value] ?? null)
  const hasNextSegment = computed(() => segmentIndex.value < segments.value.length - 1)

  function stopPolling(): void {
    if (pollIntervalId !== null) {
      window.clearInterval(pollIntervalId)
      pollIntervalId = null
    }
  }

  function onSegmentEnded(): void {
    stopPolling()
    player?.pauseVideo()
    void logActivity('the-little-prince')
    mode.value = 'select'
  }

  function startPolling(segment: Segment): void {
    stopPolling()
    const endSeconds = parseTimeCode(segment.end)
    pollIntervalId = window.setInterval(() => {
      if (!player) return
      if (player.getCurrentTime() >= endSeconds) onSegmentEnded()
    }, POLL_INTERVAL_MS)
  }

  function playCurrentSegment(): void {
    const segment = currentSegment.value
    if (!player || !segment) return
    player.seekTo(parseTimeCode(segment.start), true)
    player.playVideo()
    startPolling(segment)
  }

  async function load(): Promise<void> {
    try {
      const catalog = await getLanguageCatalog()
      const entry = catalog.find((candidate) => candidate.code === languageCode.value)
      if (!entry) {
        // The gate (PagePlay.vue) only mounts this loop once a valid language
        // is set, so this is just a safety net.
        loadError.value = 'Pick a listening language to start.'
        return
      }

      youtubeId.value = entry.youtubeId
      segments.value = await getSegments(entry.youtubeId)
      if (segments.value.length === 0) {
        loadError.value = 'No segments for this language yet.'
        return
      }

      player = await createPlayer(PLAYER_ELEMENT_ID, entry.youtubeId, () => {})
      mode.value = 'playing'
      playCurrentSegment()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Could not load this video.'
    }
  }

  function replay(): void {
    mode.value = 'playing'
    playCurrentSegment()
  }

  function practiceCurrentAndReplay(): void {
    mode.value = 'vocab-practice'
  }

  function playNext(): void {
    if (!hasNextSegment.value) return
    segmentIndex.value += 1
    mode.value = 'playing'
    playCurrentSegment()
  }

  function practiceNextAndPlay(): void {
    if (!hasNextSegment.value) return
    segmentIndex.value += 1
    mode.value = 'vocab-practice'
  }

  function onVocabFinished(): void {
    mode.value = 'playing'
    playCurrentSegment()
  }

  onMounted(load)

  onUnmounted(() => {
    stopPolling()
    player?.destroy()
  })

  return {
    playerElementId: PLAYER_ELEMENT_ID,
    mode,
    loadError,
    youtubeId,
    currentSegment,
    hasNextSegment,
    replay,
    practiceCurrentAndReplay,
    playNext,
    practiceNextAndPlay,
    onVocabFinished
  }
}
