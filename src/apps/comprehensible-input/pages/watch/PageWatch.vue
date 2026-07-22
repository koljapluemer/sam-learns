<script setup lang="ts">
// Ported from linguanodon's watch.html/main.js - a standalone watch page for
// one specific video, reached from PageVideos.vue's browse-by-language flow
// (as opposed to PageHome.vue's random "infinite watch" loop).
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { RouterLink } from 'vue-router'
import { createWatchTracker } from '../../app/useWatchTracker'
import { createPlayer } from '../../app/youtube'
import type { Video } from '../../app/types'

const route = useRoute()
const video = ref<Video | null>(null)
let tracker: ReturnType<typeof createWatchTracker> | null = null

onMounted(async () => {
  const response = await fetch('/data/comprehensible-input/videos.json')
  const videos = (await response.json()) as Video[]
  const videoId = Number(route.params.videoId)
  video.value = videos.find((v) => v.videoId === videoId) ?? null
  if (!video.value) return

  tracker = createWatchTracker({
    videoId: video.value.videoId,
    languageId: video.value.languageId,
    languageName: video.value.languageName,
    videoTitle: video.value.title
  })

  const player = await createPlayer('player', video.value.youtubeId, (state) => {
    tracker?.setPlaying(state === window.YT.PlayerState.PLAYING)
  })
  tracker.setPlayer(player)
})

onUnmounted(() => {
  tracker?.destroy()
})
</script>

<template>
  <div
    v-if="video"
    class="p-4"
  >
    <div class="mb-4 flex justify-start max-w-5xl mx-auto">
      <RouterLink
        :to="{ name: 'comprehensible-input-videos' }"
        class="btn btn-sm btn-outline"
      >
        Back to {{ video.languageName }}
      </RouterLink>
    </div>
    <div class="max-w-5xl mx-auto flex flex-col gap-4">
      <div class="aspect-video w-full overflow-hidden rounded-box bg-black">
        <div
          id="player"
          class="h-full w-full"
        />
      </div>
      <h1 class="text-xl font-semibold">
        {{ video.title }}
      </h1>
    </div>
  </div>
</template>
