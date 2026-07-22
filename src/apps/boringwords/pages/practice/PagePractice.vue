<script setup lang="ts">
// Ported from linguanodon's boringwords app/practiceApp.js.
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePracticeSession } from '../../app/usePracticeSession'
import { tokenizeMarkdown } from '../../app/markdown'
import type { Background, BoringWordsLanguage } from '../../app/types'

const route = useRoute()
const language = route.params.language as BoringWordsLanguage

const session = usePracticeSession(language)

// Two stacked backdrop layers, cross-faded via opacity whenever the
// background changes - background-image itself can't be CSS-transitioned,
// so a plain instant swap on one layer would just snap.
const backdropLayers = ref([
  { url: '', opacity: 0 },
  { url: '', opacity: 0 }
])
let activeLayer = 0

function buildBackgroundUrl(bg: Background): string {
  return `/data/boringwords/${language}/${bg.filename}.webp`
}

watch(
  session.currentBackground,
  (bg) => {
    if (!bg) return
    const nextLayer = activeLayer === 0 ? 1 : 0
    backdropLayers.value[nextLayer] = { url: buildBackgroundUrl(bg), opacity: 1 }
    backdropLayers.value[activeLayer] = { ...backdropLayers.value[activeLayer], opacity: 0 }
    activeLayer = nextLayer
  },
  { immediate: true }
)

function combinedCredit(): string {
  const bg = session.currentBackground.value
  const word = session.currentWord.value
  const parts = [bg?.credit, word?.credit].filter(Boolean)
  return parts.join(' — ')
}
</script>

<template>
  <div class="relative">
    <div
      v-for="(layer, i) in backdropLayers"
      :key="i"
      class="fixed inset-0 -z-10 bg-cover bg-center transition-opacity duration-700 ease-in-out"
      :style="{ backgroundImage: layer.url ? `url(${layer.url})` : 'none', opacity: layer.opacity }"
    />

    <div class="relative flex min-h-[70vh] flex-col items-center justify-center gap-6 p-4">
      <div
        v-if="session.loading.value"
        class="glass rounded-box p-8"
      >
        <span class="loading loading-spinner loading-lg" />
      </div>

      <div
        v-else-if="session.loadError.value"
        class="alert alert-error glass max-w-xl"
      >
        <span>{{ session.loadError.value }}</span>
      </div>

      <template v-else-if="session.currentWord.value">
        <Transition
          name="bw-card"
          mode="out-in"
        >
          <div
            :key="session.currentWord.value.id"
            class="card glass w-full max-w-md shadow-xl"
          >
            <div
              class="card-body items-center text-center gap-4"
              :class="{ 'bw-reveal-flip': session.revealed.value }"
            >
              <p
                class="text-3xl font-semibold"
                dir="auto"
              >
                <template
                  v-for="(token, i) in tokenizeMarkdown(session.currentWord.value.front)"
                  :key="'f' + i"
                >
                  <b v-if="token.type === 'bold'">{{ token.text }}</b>
                  <i v-else-if="token.type === 'italic'">{{ token.text }}</i>
                  <a
                    v-else-if="token.type === 'link'"
                    :href="token.href"
                    class="link"
                    target="_blank"
                    rel="noreferrer noopener"
                  >{{ token.text }}</a>
                  <span v-else>{{ token.text }}</span>
                </template>
              </p>

              <button
                v-if="!session.revealed.value"
                type="button"
                class="btn"
                @click="session.reveal"
              >
                Show answer
              </button>

              <template v-else>
                <div class="divider" />
                <p
                  class="text-2xl"
                  dir="auto"
                >
                  <template
                    v-for="(token, i) in tokenizeMarkdown(session.currentWord.value.back)"
                    :key="'b' + i"
                  >
                    <b v-if="token.type === 'bold'">{{ token.text }}</b>
                    <i v-else-if="token.type === 'italic'">{{ token.text }}</i>
                    <a
                      v-else-if="token.type === 'link'"
                      :href="token.href"
                      class="link"
                      target="_blank"
                      rel="noreferrer noopener"
                    >{{ token.text }}</a>
                    <span v-else>{{ token.text }}</span>
                  </template>
                </p>

                <div class="grid grid-cols-4 gap-2 w-full mt-2">
                  <button
                    type="button"
                    class="btn btn-sm sm:btn-md"
                    @click="session.rate(session.Rating.Again)"
                  >
                    Again
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm sm:btn-md"
                    @click="session.rate(session.Rating.Hard)"
                  >
                    Hard
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm sm:btn-md"
                    @click="session.rate(session.Rating.Good)"
                  >
                    Good
                  </button>
                  <button
                    type="button"
                    class="btn btn-sm sm:btn-md"
                    @click="session.rate(session.Rating.Easy)"
                  >
                    Easy
                  </button>
                </div>
              </template>
            </div>
          </div>
        </Transition>

        <div
          v-if="combinedCredit()"
          class="glass rounded-box px-4 py-2 text-xs opacity-80 max-w-md text-center"
        >
          <template
            v-for="(token, i) in tokenizeMarkdown(combinedCredit())"
            :key="'c' + i"
          >
            <a
              v-if="token.type === 'link'"
              :href="token.href"
              class="link"
              target="_blank"
              rel="noreferrer noopener"
            >{{ token.text }}</a>
            <span v-else>{{ token.text }}</span>
          </template>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Reveal "flip" pulse - applied once when a card goes from front-only to
   front+back, ported from linguanodon's boringwords/static/.../css/style.css. */
@keyframes bw-reveal-flip {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}

.bw-reveal-flip {
  animation: bw-reveal-flip 0.4s ease;
  backface-visibility: hidden;
}

.bw-card-enter-active,
.bw-card-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.bw-card-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.97);
}

.bw-card-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.97);
}
</style>
