<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Rating, type Grade } from 'ts-fsrs'
import { logActivity } from '@/shared/activity/useLearningEvent'
import MarkdownContent from '../../dumb/MarkdownContent.vue'
import { listFlashcards } from '../../entities/flashcard/flashcard'
import { rateFlashcard } from '../../entities/flashcard-schedule/flashcardSchedule'
import { pickNextFlashcard, type PracticeCandidate } from './usePracticeQueue'

const emit = defineEmits<{ 'add-card': [] }>()

const loading = ref(true)
const hasCards = ref(false)
const candidate = ref<PracticeCandidate | null>(null)
const revealed = ref(false)

async function loadNext(): Promise<void> {
  loading.value = true
  revealed.value = false
  candidate.value = await pickNextFlashcard()
  loading.value = false
}

async function rate(rating: Grade): Promise<void> {
  if (!candidate.value) return
  await rateFlashcard(candidate.value.flashcard.id, candidate.value.schedule, rating)
  await logActivity('just-flashcards')
  await loadNext()
}

onMounted(async () => {
  hasCards.value = (await listFlashcards()).length > 0
  await loadNext()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="!hasCards"
      class="flex flex-col items-center gap-4 py-8 text-center"
    >
      <p class="opacity-70">
        No flashcards yet.
      </p>
      <button
        type="button"
        class="btn btn-primary"
        @click="emit('add-card')"
      >
        Add a flashcard
      </button>
    </div>

    <p
      v-else-if="!candidate"
      class="py-8 text-center opacity-70"
    >
      All caught up. Nothing due right now.
    </p>

    <div
      v-else
      class="card w-full shadow-xl"
    >
      <div class="card-body gap-6">
        <MarkdownContent :source="candidate.flashcard.front" />

        <button
          v-if="!revealed"
          type="button"
          class="btn self-center"
          @click="revealed = true"
        >
          Show answer
        </button>

        <template v-else>
          <div class="divider my-0" />
          <MarkdownContent :source="candidate.flashcard.back" />

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
  </div>
</template>
