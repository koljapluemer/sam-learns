<script setup lang="ts">
// Ported from linguanodon's hebrewscript app/player.js + app/choices.js,
// combined into one SFC (the source split them across two global Vue
// components registered on a bare `createApp` root).
import { usePracticeSession } from '../../app/usePracticeSession'

const {
  answerOptions,
  audioRef,
  autoplayHint,
  changedCharacterIndex,
  disabledButtonIndex,
  handleAnswer,
  handleAudioEnded,
  handleAudioPause,
  handleAudioPlay,
  handleAudioSeek,
  handleAudioTimeUpdate,
  hideCurrentClip,
  loadError,
  phase,
  replayAudio,
  round,
  splitLabel
} = usePracticeSession({
  audioBaseUrl: '/data/hebrewscript/audio/',
  apiClipsUrl: '/data/hebrewscript/clips.json'
})
</script>

<template>
  <section class="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center p-4">
    <div class="card w-full max-w-3xl border border-base-300 bg-base-100">
      <div class="card-body gap-6 p-6 sm:p-8">
        <div
          v-if="loadError"
          class="alert alert-error"
        >
          <span>{{ loadError }}</span>
        </div>

        <div
          v-else-if="phase === 'loading'"
          class="flex min-h-64 items-center justify-center rounded-box border border-base-300 bg-base-200"
        >
          <span class="loading loading-spinner loading-lg" />
        </div>

        <div
          v-else-if="round"
          class="space-y-4"
        >
          <div class="card border border-base-300 bg-base-200">
            <div class="card-body gap-4 p-4">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="space-y-1">
                  <p class="font-medium">
                    Audio
                  </p>
                  <p class="text-sm text-base-content/70">
                    Listen first, then pick one of the two spellings.
                  </p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    class="btn btn-sm btn-outline"
                    @click="replayAudio"
                  >
                    Replay
                  </button>
                  <button
                    class="btn btn-sm btn-outline btn-error"
                    @click="hideCurrentClip"
                  >
                    Hide clip
                  </button>
                </div>
              </div>

              <audio
                ref="audioRef"
                :key="round.clip.filename"
                class="w-full"
                :src="round.clip.audioSrc"
                preload="auto"
                controls
                autoplay
                @ended="handleAudioEnded"
                @pause="handleAudioPause"
                @play="handleAudioPlay"
                @seeking="handleAudioSeek"
                @timeupdate="handleAudioTimeUpdate"
              />

              <div
                v-if="autoplayHint"
                class="alert alert-warning"
              >
                <span>{{ autoplayHint }}</span>
              </div>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <button
              v-for="(option, index) in answerOptions"
              :key="round.clip.filename + '-' + index + '-' + option.label"
              class="btn btn-2xl btn-outline h-auto flex-row items-center justify-between gap-3"
              :disabled="disabledButtonIndex === index"
              @click="handleAnswer(option, index)"
            >
              <kbd
                v-if="index === 0"
                class="kbd kbd-sm"
              >←</kbd>
              <span
                dir="rtl"
                class="text-2xl whitespace-pre-wrap"
              >
                <span
                  v-for="(character, characterIndex) in splitLabel(option.label)"
                  :key="option.label + '-' + characterIndex"
                  :class="{ 'text-marker': characterIndex === changedCharacterIndex }"
                >{{ character }}</span>
              </span>
              <kbd
                v-if="index !== 0"
                class="kbd kbd-sm"
              >→</kbd>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Ported from linguanodon's hebrewscript/static/hebrewscript/css/style.css */
.text-marker {
  border-radius: 0.18em;
  box-shadow: inset 0 -0.5em 0 rgba(251, 191, 36, 0.55);
}
</style>
