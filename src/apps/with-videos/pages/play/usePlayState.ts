// Main loop: watch a snippet, do up to 3 vocab exercises on it, then the
// next snippet autoplays. Replaying during exercises rewatches the snippet
// and returns to the remaining exercises afterwards.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Grade } from 'ts-fsrs'
import { getVideos, type Video } from '../../entities/video/video'
import { getSnippets, type Snippet } from '../../entities/snippet/snippet'
import { rateVocabCard } from '../../entities/vocab-card/vocabCard'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { useSnippetPlayer } from './useSnippetPlayer'
import { nextPosition, pickNewVideo, type Position } from './selectNextSnippet'
import { selectExercises, type VocabEntry } from './selectExercises'

export type PlayMode = 'loading' | 'playing' | 'exercises'

const PLAYER_ELEMENT_ID = 'with-videos-yt-player'

export function usePlayState() {
  const languageCode = useLocalSetting('with-videos.language-code', '')
  const position = useLocalSetting<Position | null>(`with-videos.position.${languageCode.value}`, null)
  const startedIds = useLocalSetting<string[]>(`with-videos.started-videos.${languageCode.value}`, [])

  const mode = ref<PlayMode>('loading')
  const loadError = ref('')
  const snippets = ref<Snippet[]>([])
  // null = not yet selected for the current snippet
  const exercises = ref<VocabEntry[] | null>(null)
  const exerciseTotal = ref(0)
  let videos: Video[] = []

  const player = useSnippetPlayer(PLAYER_ELEMENT_ID)
  const currentSnippet = computed<Snippet | null>(() => snippets.value[position.value?.index ?? -1] ?? null)
  const currentExercise = computed(() => exercises.value?.[0] ?? null)

  async function goTo(next: Position): Promise<void> {
    if (next.youtubeId !== position.value?.youtubeId) {
      snippets.value = await getSnippets(next.youtubeId)
    }
    position.value = next
    exercises.value = null
    playCurrent()
  }

  function playCurrent(): void {
    const snippet = currentSnippet.value
    if (!position.value || !snippet) return
    if (!startedIds.value.includes(position.value.youtubeId)) startedIds.value.push(position.value.youtubeId)
    mode.value = 'playing'
    player.play(position.value.youtubeId, snippet, () => void onSnippetEnded())
  }

  async function onSnippetEnded(): Promise<void> {
    void logActivity('with-videos')
    if (exercises.value === null && position.value && currentSnippet.value) {
      exercises.value = await selectExercises(position.value.youtubeId, currentSnippet.value)
      exerciseTotal.value = exercises.value.length
    }
    if (exercises.value?.length) mode.value = 'exercises'
    else await advance()
  }

  async function advance(): Promise<void> {
    if (!position.value) return
    await goTo(nextPosition(position.value, snippets.value.length, videos, startedIds.value))
  }

  async function rate(rating: Grade): Promise<void> {
    const entry = currentExercise.value
    if (!entry || !exercises.value) return
    await rateVocabCard(entry.key, entry.card, rating)
    exercises.value.shift()
    if (exercises.value.length === 0) await advance()
  }

  async function load(): Promise<void> {
    try {
      videos = (await getVideos()).filter((video) => video.languageCode === languageCode.value)
      if (videos.length === 0) {
        loadError.value = 'No videos for this language yet.'
        return
      }

      const saved = position.value
      const start = saved && videos.some((video) => video.youtubeId === saved.youtubeId)
        ? saved
        : { youtubeId: pickNewVideo(videos, startedIds.value), index: 0 }
      snippets.value = await getSnippets(start.youtubeId)
      // a re-split video can have fewer snippets than the saved index
      position.value = { ...start, index: start.index < snippets.value.length ? start.index : 0 }
      await player.init(start.youtubeId)
      playCurrent()
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Could not load this video.'
    }
  }

  onMounted(load)
  onUnmounted(player.destroy)

  return {
    playerElementId: PLAYER_ELEMENT_ID,
    mode,
    loadError,
    currentExercise,
    exerciseNumber: computed(() => exerciseTotal.value - (exercises.value?.length ?? 0) + 1),
    exerciseTotal,
    replay: playCurrent,
    rate
  }
}
