<script setup lang="ts">
import { ref } from 'vue'
import type { Grade } from 'ts-fsrs'
import { usePracticeQueue } from './usePracticeQueue'

const props = defineProps<{ languageCode: string }>()

const revealed = ref(false)
const queue = usePracticeQueue(props.languageCode)

function reveal(): void {
  revealed.value = true
}

async function rate(rating: Grade): Promise<void> {
  revealed.value = false
  await queue.rate(rating)
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-8">
    <div
      v-if="queue.loading.value"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <p
      v-else-if="!queue.candidate.value"
      class="py-8 text-center opacity-70"
    >
      All caught up. Nothing due right now.
    </p>

    <div
      v-else
      class="card w-full shadow-xl"
    >
      <div class="card-body items-center gap-4 text-center">
        <span class="badge badge-primary badge-outline">What does this mean?</span>

        <template v-if="queue.candidate.value.kind === 'vocab'">
          <p class="text-3xl font-semibold">
            {{ queue.candidate.value.word }}
          </p>
          <div
            v-for="example in queue.candidate.value.frontExamples"
            :key="example.target"
            class="flex flex-col gap-0.5"
          >
            <p>{{ example.target }}</p>
            <p
              v-if="queue.candidate.value.frontShowTranslations"
              class="text-sm opacity-70"
            >
              {{ example.translation }}
            </p>
          </div>
        </template>

        <template v-else>
          <p class="text-2xl font-semibold">
            {{ queue.candidate.value.text }}
          </p>
          <div
            v-if="queue.candidate.value.showVocabOnFront"
            class="flex w-full flex-col gap-1"
          >
            <div
              v-for="entry in queue.candidate.value.vocab"
              :key="entry.word"
              class="flex justify-between gap-2 text-sm"
            >
              <span>{{ entry.word }}</span>
              <span class="opacity-70">{{ entry.translations.join(', ') }}</span>
            </div>
          </div>
        </template>

        <button
          v-if="!revealed"
          type="button"
          class="btn self-center"
          @click="reveal"
        >
          Show answer
        </button>

        <template v-else>
          <div class="divider my-0" />

          <template v-if="queue.candidate.value.kind === 'vocab'">
            <p class="text-xl opacity-70">
              {{ queue.candidate.value.translations.join(', ') }}
            </p>
            <div
              v-for="example in queue.candidate.value.backExamples"
              :key="example.target"
              class="flex flex-col gap-0.5"
            >
              <p>{{ example.target }}</p>
              <p class="text-sm opacity-70">
                {{ example.translation }}
              </p>
            </div>
          </template>

          <template v-else>
            <p class="text-xl opacity-70">
              {{ queue.candidate.value.translation }}
            </p>
            <div
              v-if="!queue.candidate.value.showVocabOnFront"
              class="flex w-full flex-col gap-1"
            >
              <div
                v-for="entry in queue.candidate.value.vocab"
                :key="entry.word"
                class="flex justify-between gap-2 text-sm"
              >
                <span>{{ entry.word }}</span>
                <span class="opacity-70">{{ entry.translations.join(', ') }}</span>
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              @click="rate(queue.Rating.Again)"
            >
              Again
            </button>
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              @click="rate(queue.Rating.Hard)"
            >
              Hard
            </button>
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              @click="rate(queue.Rating.Good)"
            >
              Good
            </button>
            <button
              type="button"
              class="btn btn-sm sm:btn-md"
              @click="rate(queue.Rating.Easy)"
            >
              Easy
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
