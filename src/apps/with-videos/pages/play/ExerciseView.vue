<script setup lang="ts">
import { ref } from 'vue'
import { Rating, type Grade } from 'ts-fsrs'
import { RotateCcw } from 'lucide-vue-next'
import type { VocabEntry } from './selectExercises'

defineProps<{
  entry: VocabEntry
  number: number
  total: number
}>()

const emit = defineEmits<{
  rate: [rating: Grade]
  replay: []
}>()

const revealed = ref(false)

const ratings: { label: string; value: Grade }[] = [
  { label: 'Again', value: Rating.Again },
  { label: 'Hard', value: Rating.Hard },
  { label: 'Good', value: Rating.Good },
  { label: 'Easy', value: Rating.Easy }
]
</script>

<template>
  <div class="flex h-full w-full items-center justify-center bg-base-300/80 backdrop-blur-sm p-4">
    <div class="card glass w-full max-w-md shadow-xl">
      <div class="card-body items-center gap-4 text-center">
        <div class="flex w-full items-center justify-between">
          <span class="text-xs uppercase tracking-wide opacity-60">{{ number }} / {{ total }}</span>
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="emit('replay')"
          >
            <RotateCcw class="size-4" />
            Replay
          </button>
        </div>

        <p
          class="text-3xl font-semibold"
          dir="auto"
        >
          {{ entry.term }}
        </p>

        <button
          v-if="!revealed"
          type="button"
          class="btn"
          @click="revealed = true"
        >
          Show answer
        </button>

        <template v-else>
          <div class="divider" />
          <p class="text-2xl">
            {{ entry.translation }}
          </p>

          <div class="grid grid-cols-4 gap-2 w-full mt-2">
            <button
              v-for="rating in ratings"
              :key="rating.value"
              type="button"
              class="btn btn-sm sm:btn-md"
              @click="emit('rate', rating.value)"
            >
              {{ rating.label }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
