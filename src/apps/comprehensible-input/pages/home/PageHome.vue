<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import type { Video } from '../../app/types'

const STORAGE_KEY = 'comprehensible-input.language-code'

const router = useRouter()
const languages = ref<{ code: string; name: string }[]>([])
const selectedLanguageCode = ref<string>('')

function startPlaying() {
  if (selectedLanguageCode.value) {
    localStorage.setItem(STORAGE_KEY, selectedLanguageCode.value)
  }
  router.push({ name: 'comprehensible-input-play' })
}

onMounted(async () => {
  const response = await fetch('/data/comprehensible-input/videos.json')
  const videos = (await response.json()) as Video[]

  const seen = new Map<string, string>()
  for (const video of videos) seen.set(video.languageCode, video.languageName)
  languages.value = [...seen.entries()].map(([code, name]) => ({ code, name }))

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && languages.value.some((l) => l.code === stored)) {
    selectedLanguageCode.value = stored
  }
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
    <div>
      <h1 class="text-3xl font-bold">
        Comprehensible Input
      </h1>
      <p class="mt-3 opacity-70">
        An endless stream of easy, comprehensible foreign-language videos. Pick a
        language, hit play, and keep watching - after each video you'll rate how
        much you understood, which helps you notice your own progress over time.
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <label
        for="language-select"
        class="text-sm font-medium opacity-80"
      >
        Language to watch
      </label>
      <select
        id="language-select"
        v-model="selectedLanguageCode"
        class="select select-bordered w-full"
      >
        <option
          value=""
          disabled
        >
          Choose a language
        </option>
        <option
          v-for="language in languages"
          :key="language.code"
          :value="language.code"
        >
          {{ language.name }}
        </option>
      </select>
      <p
        v-if="languages.length === 0"
        class="text-sm opacity-70"
      >
        No languages with videos yet.
      </p>
    </div>

    <button
      type="button"
      class="btn btn-primary self-start"
      :disabled="!selectedLanguageCode"
      @click="startPlaying"
    >
      Start watching
    </button>
  </div>
</template>
