<script setup lang="ts">
// Ported from linguanodon's egyptiansentences app/gameApp.js. Icons use this
// repo's usual lucide-vue-next components instead of the manual SVG-node
// builder linguanodon needed for its build-free CDN setup.
import { ArrowLeft, ArrowRight, CornerDownLeft, ExternalLink, Play, Timer, Trophy } from 'lucide-vue-next'
import IndexCard from '../../dumb/IndexCard.vue'
import { useGameSession } from '../../app/useGameSession'

const session = useGameSession()

function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 py-8 px-4">
    <div
      v-if="session.loading.value"
      class="mt-16 text-center"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="session.loadError.value"
      class="alert alert-error mt-10"
    >
      <span>{{ session.loadError.value }}</span>
    </div>

    <template v-else-if="session.gameMode.value === 'undetermined'">
      <div class="glass border border-base-200/60 rounded-2xl shadow flex flex-col gap-4 p-4 items-center w-full">
        <p class="text-center text-base-content/90">
          Practice your survival Arabic and get ready for Egypt.
        </p>
        <div class="flex flex-col gap-2 items-center">
          <button
            type="button"
            class="btn btn-lg w-full gap-2"
            @click="session.setGameMode('go')"
          >
            <Play class="w-5 h-5" />
            Start Game
          </button>
          <kbd class="kbd kbd-sm inline-flex items-center gap-1 glass">
            <CornerDownLeft class="w-3 h-3" />Enter
          </kbd>
        </div>
      </div>

      <div
        v-if="session.lastScore.value !== null"
        class="glass border border-base-200/60 rounded-2xl shadow p-4 w-full"
      >
        <p class="text-center text-lg">
          You scored <span class="font-bold">{{ session.lastScore.value }}</span> points
        </p>
      </div>

      <div
        v-if="session.sortedHighscores.value.length"
        class="glass border border-base-200/60 rounded-2xl shadow p-6 w-full grid gap-3"
      >
        <h2 class="font-semibold flex items-center gap-2">
          <Trophy class="w-5 h-5" />
          Highscore
        </h2>
        <ol class="grid gap-1">
          <li
            v-for="(highscore, index) in session.sortedHighscores.value.slice(0, 10)"
            :key="index"
            class="flex justify-between"
          >
            <span class="font-medium">{{ highscore.score }}</span>
            <span class="text-base-content/90">{{ formatDate(highscore.date) }}</span>
          </li>
        </ol>
      </div>
    </template>

    <template v-else-if="session.gameMode.value === 'go'">
      <div class="glass border border-base-200/60 rounded-2xl shadow grid gap-2 p-4 w-full">
        <div class="flex justify-between items-center">
          <span class="font-bold text-lg">{{ session.score.value }}</span>
          <span class="flex items-center gap-1 text-base-content/90">
            <Timer class="w-4 h-4" />
            {{ Math.round(session.remainingTime.value) }}s
          </span>
        </div>
        <div class="w-full glass rounded-full h-2 overflow-hidden">
          <div
            class="h-full bg-base-content/60 transition-all duration-1000 ease-linear rounded-full"
            :style="{ width: session.progressPercent.value + '%' }"
          />
        </div>
      </div>

      <div
        v-if="session.currentSentence.value && session.currentClozeWord.value"
        class="glass border border-base-200/60 rounded-2xl shadow grid gap-6 p-6 w-full"
      >
        <IndexCard :rows="session.cardRows.value" />

        <div
          v-if="!session.isRevealed.value"
          class="flex gap-4"
          :class="session.isReverseOrder.value ? 'flex-row-reverse' : 'flex-row'"
        >
          <div class="flex-1 grid gap-2">
            <button
              type="button"
              class="btn btn-lg w-full text-xl"
              dir="rtl"
              @click="session.handleAnswer(true)"
            >
              {{ session.currentClozeWord.value.word }}
            </button>
            <div class="flex justify-center">
              <kbd class="kbd kbd-sm glass bg-base-100/70 border border-base-200/60 inline-flex items-center gap-1">
                <component
                  :is="session.isReverseOrder.value ? ArrowRight : ArrowLeft"
                  class="w-3 h-3"
                />
              </kbd>
            </div>
          </div>
          <div class="flex-1 grid gap-2">
            <button
              type="button"
              class="btn btn-lg w-full text-xl"
              dir="rtl"
              @click="session.handleAnswer(false)"
            >
              {{ session.wrongAnswer.value }}
            </button>
            <div class="flex justify-center">
              <kbd class="kbd kbd-sm glass bg-base-100/70 border border-base-200/60 inline-flex items-center gap-1">
                <component
                  :is="session.isReverseOrder.value ? ArrowLeft : ArrowRight"
                  class="w-3 h-3"
                />
              </kbd>
            </div>
          </div>
        </div>

        <div
          v-else
          class="grid gap-2"
        >
          <button
            type="button"
            class="btn btn-lg w-full bg-base-100 text-base-content border border-base-200"
            @click="session.getNextExercise"
          >
            Continue
          </button>
          <div class="flex justify-center">
            <kbd class="kbd kbd-sm glass bg-base-100/70 border border-base-200/60 inline-flex items-center gap-1">
              <CornerDownLeft class="w-3 h-3" />
              Enter
            </kbd>
          </div>
        </div>

        <p class="text-center text-base-content/90">
          Sentences from
          <a
            target="_blank"
            rel="noreferrer noopener"
            class="link inline-flex items-center gap-1"
            href="https://eu.lisaanmasry.org/online/example.php"
          >
            lisaanmasry.org
            <ExternalLink class="w-3 h-3" />
          </a>. This material is Copyright © 2007-2020 Mike Green; this is non-commercial use as by the license.
        </p>
      </div>
    </template>
  </main>
</template>
