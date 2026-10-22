// Main loop: a random snippet is cued behind up to 3 vocab exercises; once
// all are solved it plays, then a short reflection unlocks the next one.
import { onMounted, onUnmounted, ref } from 'vue'
import { getVideos, type Video } from '../../entities/video/video'
import { markSnippetWatched, saveReflection, type Reflection } from '../../entities/snippet-view/snippetView'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import { logActivity } from '@/shared/activity/useLearningEvent'
import { useSnippetPlayer } from './useSnippetPlayer'
import { selectNextSnippet, type Selection } from './selectNextSnippet'
import { selectExercises, type VocabEntry } from './selectExercises'

export type PlayMode = 'loading' | 'exercises' | 'playing' | 'reflection'

const PLAYER_ELEMENT_ID = 'with-videos-yt-player'

export function usePlayState() {
  const languageCode = useLocalSetting('with-videos.language-code', '')

  const mode = ref<PlayMode>('loading')
  const loadError = ref('')
  const exercises = ref<VocabEntry[]>([])
  let videos: Video[] = []
  let current: Selection | null = null
  let snippetViewId = ''

  const player = useSnippetPlayer(PLAYER_ELEMENT_ID)

  async function loadNext(): Promise<void> {
    mode.value = 'loading'
    try {
      current = await selectNextSnippet(videos)
      if (!current) {
        loadError.value = 'No videos with subtitles for this language yet.'
        return
      }
      exercises.value = await selectExercises(current.youtubeId, current.snippet)
      await player.cue(current.youtubeId, current.snippet)
      mode.value = 'exercises'
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Could not load this video.'
    }
  }

  function playSnippet(): void {
    if (!current) return
    mode.value = 'playing'
    player.play(current.snippet, () => void onSnippetEnded())
  }

  async function onSnippetEnded(): Promise<void> {
    if (!current) return
    void logActivity('with-videos')
    snippetViewId = await markSnippetWatched(current.youtubeId, current.snippet.id)
    mode.value = 'reflection'
  }

  async function submitReflection(reflection: Reflection): Promise<void> {
    await saveReflection(snippetViewId, reflection)
    await loadNext()
  }

  async function load(): Promise<void> {
    try {
      videos = (await getVideos()).filter((video) => video.languageCode === languageCode.value)
    } catch (error) {
      loadError.value = error instanceof Error ? error.message : 'Could not load videos.'
      return
    }
    await loadNext()
  }

  onMounted(load)
  onUnmounted(player.destroy)

  return {
    playerElementId: PLAYER_ELEMENT_ID,
    mode,
    loadError,
    exercises,
    playSnippet,
    submitReflection
  }
}
