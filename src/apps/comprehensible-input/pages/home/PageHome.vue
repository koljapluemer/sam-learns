<script setup lang="ts">
// Ported from linguanodon's comprehensible_input home.html/home.js - the
// "infinite watch" loop: pick a language once (persisted), then an endless
// stream of random videos with a quick survey after each one. htmx/Alpine
// are replaced by plain Vue reactivity; there's no server round-trip for
// "next video" since the whole video list is a static local JSON export.
import { onMounted, onUnmounted, ref } from 'vue'
import { addSurveyResponse, createWatchTracker } from '../../app/useWatchTracker'
import { createPlayer } from '../../app/youtube'
import type { Video } from '../../app/types'

const STORAGE_KEY = 'comprehensible-input.language-code'

const videos = ref<Video[]>([])
const languages = ref<{ code: string; name: string }[]>([])
const showLanguagePicker = ref(false)
const chosenLanguageCode = ref<string | null>(null)
const currentVideo = ref<Video | null>(null)

const comprehension = ref<number | null>(null)
const listening = ref<number | null>(null)
const rewatch = ref<'no' | 'yes' | 'certainly' | null>(null)

let tracker: ReturnType<typeof createWatchTracker> | null = null

function pickRandomVideo(languageCode: string): Video | null {
  const pool = videos.value.filter((video) => video.languageCode === languageCode)
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
}

async function loadVideo(video: Video) {
  tracker?.destroy()
  tracker = null

  currentVideo.value = video
  comprehension.value = null
  listening.value = null
  rewatch.value = null

  tracker = createWatchTracker({
    videoId: video.videoId,
    languageId: video.languageId,
    languageName: video.languageName,
    videoTitle: video.title
  })

  // Wait a tick for the (freshly re-keyed) #player element to exist.
  await new Promise((resolve) => requestAnimationFrame(resolve))
  const player = await createPlayer('player', video.youtubeId, (state) => {
    tracker?.setPlaying(state === window.YT.PlayerState.PLAYING)
  })
  tracker.setPlayer(player)
}

function chooseLanguage(code: string) {
  localStorage.setItem(STORAGE_KEY, code)
  chosenLanguageCode.value = code
  showLanguagePicker.value = false
  const video = pickRandomVideo(code)
  if (video) void loadVideo(video)
}

async function submitSurvey() {
  if (!currentVideo.value || comprehension.value === null || listening.value === null || !rewatch.value) return

  await addSurveyResponse({
    videoId: currentVideo.value.videoId,
    languageId: currentVideo.value.languageId,
    languageName: currentVideo.value.languageName,
    videoTitle: currentVideo.value.title,
    timestamp: Date.now(),
    comprehension: comprehension.value,
    listening: listening.value,
    rewatch: rewatch.value,
    segments: tracker?.getSessionSegments() ?? []
  })

  if (chosenLanguageCode.value) {
    const next = pickRandomVideo(chosenLanguageCode.value)
    if (next) void loadVideo(next)
  }
}

onMounted(async () => {
  const response = await fetch('/data/comprehensible-input/videos.json')
  videos.value = (await response.json()) as Video[]

  const seen = new Map<string, string>()
  for (const video of videos.value) seen.set(video.languageCode, video.languageName)
  languages.value = [...seen.entries()].map(([code, name]) => ({ code, name }))

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && languages.value.some((l) => l.code === stored)) {
    chooseLanguage(stored)
  } else {
    showLanguagePicker.value = true
  }
})

onUnmounted(() => {
  tracker?.destroy()
})
</script>

<template>
  <div class="relative isolate h-screen w-full overflow-hidden bg-base-300 pt-20">
    <div
      v-if="currentVideo"
      class="absolute inset-0 -z-10 bg-cover bg-center scale-110 blur-2xl opacity-50"
      :style="{ backgroundImage: `url(${currentVideo.thumbnailUrlLarge})` }"
    />

    <div class="flex h-full flex-col md:flex-row">
      <div class="flex min-h-0 items-center justify-center overflow-hidden md:min-w-0 md:flex-1">
        <div
          v-if="currentVideo"
          :key="currentVideo.videoId"
          class="aspect-video w-full max-h-full"
        >
          <div
            id="player"
            class="h-full w-full"
          />
        </div>
        <p
          v-else
          class="text-base-content/60 text-sm"
        >
          Loading video…
        </p>
      </div>

      <div class="shrink-0 w-full flex-1 border-t border-base-300 bg-base-100 md:w-80 md:flex-none md:overflow-y-auto md:border-t-0 md:border-l lg:w-96">
        <form
          class="flex h-full flex-col justify-center gap-2 p-3 md:justify-start md:gap-6 md:p-6"
          @submit.prevent="submitSurvey"
        >
          <fieldset class="fieldset py-0.5 md:py-1">
            <legend class="fieldset-legend text-xs md:text-sm">
              I understood what was going on
            </legend>
            <div class="join w-full">
              <input
                v-for="n in 5"
                :key="n"
                type="radio"
                name="comprehension"
                class="btn join-item btn-xs flex-1 md:btn-sm"
                :aria-label="String(n)"
                :checked="comprehension === n"
                @change="comprehension = n"
              >
            </div>
            <div class="mt-0.5 flex justify-between text-[10px] opacity-60 md:text-xs">
              <span>Strongly disagree</span>
              <span>Strongly agree</span>
            </div>
          </fieldset>

          <fieldset class="fieldset py-0.5 md:py-1">
            <legend class="fieldset-legend text-xs md:text-sm">
              I understood the spoken language intuitively
            </legend>
            <div class="join w-full">
              <input
                v-for="n in 5"
                :key="n"
                type="radio"
                name="listening"
                class="btn join-item btn-xs flex-1 md:btn-sm"
                :aria-label="String(n)"
                :checked="listening === n"
                @change="listening = n"
              >
            </div>
            <div class="mt-0.5 flex justify-between text-[10px] opacity-60 md:text-xs">
              <span>Strongly disagree</span>
              <span>Strongly agree</span>
            </div>
          </fieldset>

          <fieldset class="fieldset py-0.5 md:py-1">
            <legend class="fieldset-legend text-xs md:text-sm">
              I want to watch this video further/again
            </legend>
            <div class="join w-full">
              <input
                type="radio"
                name="rewatch"
                class="btn join-item btn-xs flex-1 md:btn-sm"
                aria-label="No"
                :checked="rewatch === 'no'"
                @change="rewatch = 'no'"
              >
              <input
                type="radio"
                name="rewatch"
                class="btn join-item btn-xs flex-1 md:btn-sm"
                aria-label="Yes"
                :checked="rewatch === 'yes'"
                @change="rewatch = 'yes'"
              >
              <input
                type="radio"
                name="rewatch"
                class="btn join-item btn-xs flex-1 md:btn-sm"
                aria-label="Certainly!"
                :checked="rewatch === 'certainly'"
                @change="rewatch = 'certainly'"
              >
            </div>
          </fieldset>

          <button
            type="submit"
            class="btn btn-primary btn-sm md:btn-md"
            :disabled="!comprehension || !listening || !rewatch"
          >
            Submit &amp; next video
          </button>
        </form>
      </div>
    </div>

    <dialog
      class="modal"
      :class="{ 'modal-open': showLanguagePicker }"
    >
      <div class="modal-box">
        <h3 class="text-lg font-semibold">
          Which language do you want to learn?
        </h3>
        <p class="mt-1 text-sm opacity-70">
          Pick once — this is remembered on this device.
        </p>
        <div class="mt-4 flex flex-col gap-2">
          <button
            v-for="language in languages"
            :key="language.code"
            type="button"
            class="btn btn-primary"
            @click="chooseLanguage(language.code)"
          >
            {{ language.name }}
          </button>
          <p
            v-if="languages.length === 0"
            class="text-center text-sm opacity-70"
          >
            No languages with videos yet.
          </p>
        </div>
      </div>
    </dialog>
  </div>
</template>
