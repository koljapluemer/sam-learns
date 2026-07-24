<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { usePracticeQueue } from './usePracticeQueue'
import { countWordsAddedToday, countUnmemorizedWords } from '../../entities/word/word'
import { DAILY_GOAL } from './useAddForm'
import type { MainView } from './MainDock.vue'

const emit = defineEmits<{ 'switch-view': [view: MainView] }>()

const { loading, currentEntry, dueAtStart, remaining, revealed, reveal, rate, Rating } = usePracticeQueue()

const addOpen = ref(false)
const memorizeOpen = ref(false)

onMounted(async () => {
  addOpen.value = (await countWordsAddedToday()) < DAILY_GOAL
  memorizeOpen.value = (await countUnmemorizedWords()) > 0
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
    <div v-if="loading">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <template v-else-if="currentEntry">
      <div>
        <div class="mb-1 flex justify-between text-sm opacity-70">
          <span>Due</span>
          <span>{{ remaining }} / {{ dueAtStart }}</span>
        </div>
        <progress
          class="progress progress-primary w-full"
          :value="dueAtStart - remaining"
          :max="dueAtStart"
        />
      </div>

      <div class="card glass w-full shadow-xl">
        <div class="card-body items-center text-center gap-4">
          <p class="text-3xl font-semibold">
            {{ currentEntry.word.word }}
          </p>

          <button
            v-if="!revealed"
            type="button"
            class="btn"
            @click="reveal"
          >
            Show answer
          </button>

          <template v-else>
            <div class="divider" />
            <p class="text-2xl">
              {{ currentEntry.word.meaning }}
            </p>

            <ul
              v-if="currentEntry.word.examples.length > 0"
              class="text-sm opacity-80 flex flex-col gap-1"
            >
              <li
                v-for="(example, i) in currentEntry.word.examples"
                :key="i"
              >
                {{ example.sentence }} — {{ example.translation }}
              </li>
            </ul>
            <ul
              v-if="currentEntry.word.notes.length > 0"
              class="text-sm opacity-60 flex flex-col gap-1"
            >
              <li
                v-for="(note, i) in currentEntry.word.notes"
                :key="i"
              >
                {{ note.text }}
              </li>
            </ul>

            <div class="grid grid-cols-4 gap-2 w-full mt-2">
              <button
                type="button"
                class="btn btn-sm sm:btn-md"
                @click="rate(Rating.Again)"
              >
                Again
              </button>
              <button
                type="button"
                class="btn btn-sm sm:btn-md"
                @click="rate(Rating.Hard)"
              >
                Hard
              </button>
              <button
                type="button"
                class="btn btn-sm sm:btn-md"
                @click="rate(Rating.Good)"
              >
                Good
              </button>
              <button
                type="button"
                class="btn btn-sm sm:btn-md"
                @click="rate(Rating.Easy)"
              >
                Easy
              </button>
            </div>
          </template>
        </div>
      </div>
    </template>

    <div
      v-else
      class="alert flex-col items-start gap-2"
    >
      <span v-if="!addOpen && !memorizeOpen">All done, good job!</span>
      <template v-else>
        <span>All done here for now.</span>
        <button
          v-if="addOpen"
          type="button"
          class="btn btn-sm"
          @click="emit('switch-view', 'add')"
        >
          Add more words
        </button>
        <button
          v-if="memorizeOpen"
          type="button"
          class="btn btn-sm"
          @click="emit('switch-view', 'memorize')"
        >
          Continue memorizing
        </button>
      </template>
    </div>
  </div>
</template>
