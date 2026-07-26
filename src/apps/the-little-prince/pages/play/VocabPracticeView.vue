<script setup lang="ts">
// Flashcard UI, mirrors boringwords/pages/practice/PagePractice.vue's card
// (minus the background cross-fade and markdown tokenizing - not applicable
// to this plain-text term/translation data).
import type { Segment } from '../../entities/segment/segment'
import { useVocabPracticeQueue } from './useVocabPracticeQueue'

const props = defineProps<{
  youtubeId: string
  segment: Segment
}>()

const emit = defineEmits<{
  finished: []
}>()

const session = useVocabPracticeQueue(props.youtubeId, props.segment, () => emit('finished'))
</script>

<template>
  <div class="flex h-full w-full items-center justify-center bg-base-300/80 backdrop-blur-sm p-4">
    <div
      v-if="session.loading.value"
      class="glass rounded-box p-8"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div
      v-else-if="session.currentEntry.value"
      class="card glass w-full max-w-md shadow-xl"
    >
      <div class="card-body items-center gap-4 text-center">
        <p class="text-xs uppercase tracking-wide opacity-60">
          {{ session.remaining.value }} left
        </p>

        <p
          class="text-3xl font-semibold"
          dir="auto"
        >
          {{ session.currentEntry.value.term }}
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
          <p class="text-2xl">
            {{ session.currentEntry.value.translation }}
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
  </div>
</template>
