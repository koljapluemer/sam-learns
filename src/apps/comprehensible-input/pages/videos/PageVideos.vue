<script setup lang="ts">
// Ported from linguanodon's all-videos.html + video-list.html - browse by
// language, then pick an individual video to watch. The dataset is tiny (40
// videos across 1-2 languages), so this is one page with a client-side
// filter instead of separate per-language routes.
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Video } from '../../app/types'

const videos = ref<Video[]>([])
const selectedLanguageCode = ref<string | null>(null)

const languages = computed(() => {
  const seen = new Map<string, string>()
  for (const video of videos.value) seen.set(video.languageCode, video.languageName)
  return [...seen.entries()].map(([code, name]) => ({ code, name }))
})

const filteredVideos = computed(() =>
  selectedLanguageCode.value ? videos.value.filter((v) => v.languageCode === selectedLanguageCode.value) : []
)

onMounted(async () => {
  const response = await fetch('/data/comprehensible-input/videos.json')
  videos.value = (await response.json()) as Video[]
  if (languages.value.length === 1) selectedLanguageCode.value = languages.value[0].code
})
</script>

<template>
  <div class="min-h-screen p-4">
    <div
      v-if="!selectedLanguageCode"
      class="flex flex-col items-center gap-6"
    >
      <h1 class="text-2xl font-bold">
        Pick a language
      </h1>
      <p class="text-sm opacity-70 text-center max-w-xs">
        Browse superbeginner comprehensible-input videos by language and
        watch - no account needed.
      </p>
      <div class="flex flex-col gap-2 w-full max-w-xs">
        <button
          v-for="language in languages"
          :key="language.code"
          type="button"
          class="btn btn-primary"
          @click="selectedLanguageCode = language.code"
        >
          {{ language.name }}
        </button>
        <p
          v-if="languages.length === 0"
          class="text-center opacity-70"
        >
          No languages with videos yet.
        </p>
      </div>
    </div>

    <div
      v-else
      class="max-w-5xl mx-auto"
    >
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-semibold">
          {{ languages.find((l) => l.code === selectedLanguageCode)?.name }}
        </h1>
        <button
          v-if="languages.length > 1"
          type="button"
          class="btn btn-sm btn-outline"
          @click="selectedLanguageCode = null"
        >
          Change language
        </button>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RouterLink
          v-for="video in filteredVideos"
          :key="video.videoId"
          :to="{ name: 'comprehensible-input-watch', params: { videoId: video.videoId } }"
          class="card border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
          <figure>
            <img
              :src="video.thumbnailUrl"
              :alt="video.title"
              class="h-32 w-full object-cover"
            >
          </figure>
          <div class="card-body p-3">
            <p class="text-sm font-medium">
              {{ video.title }}
            </p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
