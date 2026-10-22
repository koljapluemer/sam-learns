<script setup lang="ts">
import { Check, Eye, Lock, X } from 'lucide-vue-next'
import { useExerciseBoard } from './useExerciseBoard'
import { isTouchDevice } from '../../dumb/isTouchDevice'
import type { VocabEntry } from './selectExercises'

const props = defineProps<{
  entries: VocabEntry[]
}>()

const emit = defineEmits<{
  done: []
}>()

const { solved, activeIndex, revealed, reveal, answer } = useExerciseBoard(props.entries, () => emit('done'))
const touch = isTouchDevice()
</script>

<template>
  <div class="flex w-full max-w-md flex-col gap-4">
    <div
      v-for="(entry, index) in entries"
      :key="entry.key"
      class="card bg-base-100 border border-base-300 shadow-md relative"
      :class="{ 'opacity-50': index !== activeIndex }"
    >
      <div class="card-body items-center gap-3 text-center p-5">
        <p
          class="text-3xl font-semibold"
          dir="auto"
        >
          {{ entry.term }}
        </p>

        <template v-if="solved[index]">
          <p class="text-xl">
            {{ entry.translation }}
          </p>
          <Check
            class="w-4 h-4"
            aria-label="Solved"
          />
        </template>
        <Lock
          v-else-if="index !== activeIndex"
          class="w-4 h-4 opacity-50"
          aria-label="Locked"
        />
        <button
          v-else-if="!revealed && !touch"
          type="button"
          class="btn btn-circle btn-outline btn-sm"
          aria-label="Reveal"
          @click="reveal"
        >
          <Eye class="w-4 h-4" />
        </button>
        <div
          v-else-if="!revealed && touch"
          class="absolute inset-0 cursor-pointer"
          role="button"
          aria-label="Reveal"
          @click="reveal"
        />

        <template v-else>
          <div class="divider my-0" />
          <p class="text-xl">
            {{ entry.translation }}
          </p>

          <div class="flex gap-3 mt-2">
            <button
              type="button"
              class="btn btn-circle btn-error btn-outline"
              aria-label="Wrong"
              @click="answer(false)"
            >
              <X class="w-5 h-5" />
            </button>
            <button
              type="button"
              class="btn btn-circle btn-success btn-outline"
              aria-label="Correct"
              @click="answer(true)"
            >
              <Check class="w-5 h-5" />
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
