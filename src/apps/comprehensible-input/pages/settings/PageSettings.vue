<script setup lang="ts">
import { onMounted, ref } from 'vue'
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'
import type { Video } from '../../app/types'

const STORAGE_KEY = 'comprehensible-input.language-code'

const languages = ref<{ code: string; name: string }[]>([])
const selectedLanguageCode = ref<string | null>(null)

function chooseLanguage(code: string) {
  localStorage.setItem(STORAGE_KEY, code)
  selectedLanguageCode.value = code
}

onMounted(async () => {
  const response = await fetch('/data/comprehensible-input/videos.json')
  const videos = (await response.json()) as Video[]

  const seen = new Map<string, string>()
  for (const video of videos) seen.set(video.languageCode, video.languageName)
  languages.value = [...seen.entries()].map(([code, name]) => ({ code, name }))

  selectedLanguageCode.value = localStorage.getItem(STORAGE_KEY)
})
</script>

<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <h2 class="text-sm font-semibold uppercase tracking-[0.18em] opacity-60">
      This app
    </h2>
    <p class="text-sm opacity-70">
      Video language
    </p>
    <div class="flex flex-col gap-2">
      <button
        v-for="language in languages"
        :key="language.code"
        type="button"
        class="btn justify-start"
        :class="selectedLanguageCode === language.code ? 'btn-primary' : 'btn-outline'"
        @click="chooseLanguage(language.code)"
      >
        {{ language.name }}
      </button>
      <p
        v-if="languages.length === 0"
        class="text-sm opacity-70"
      >
        No languages with videos yet.
      </p>
    </div>
  </section>
  <GeneralSettingsSection />
</template>
