<script setup lang="ts">
import { Check, Eye, X } from 'lucide-vue-next'
import { useMemorizeBoard, type MemorizeRow } from './useMemorizeBoard'
import { isTouchDevice } from '../../dumb/isTouchDevice'
import type { MainView } from './MainDock.vue'

const emit = defineEmits<{ 'switch-view': [view: MainView] }>()

const { loading, board, revealed, reveal, score, remaining, clearedCount, totalNonMemorizedAtStart, todayGoalMet } =
  useMemorizeBoard()

const DISPLAY_ROWS: MemorizeRow[] = [4, 3, 2, 1]
const touch = isTouchDevice()

function placeholderStyle(index: number): { transform: string } {
  const dy = index % 2 === 0 ? 3 + index * 3 : -(3 + index * 3)
  return { transform: `translate(${6 + index * 6}px, ${dy}px)` }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
    <div v-if="loading">
      <span class="loading loading-spinner loading-lg" />
    </div>

    <template v-else>
      <div v-if="totalNonMemorizedAtStart > 0">
        <div class="mb-1 flex justify-between text-sm opacity-70">
          <span>Cleared</span>
          <span>{{ clearedCount }} / {{ totalNonMemorizedAtStart }}</span>
        </div>
        <progress
          class="progress progress-primary w-full"
          :value="clearedCount"
          :max="totalNonMemorizedAtStart"
        />
      </div>

      <div
        v-if="remaining === 0"
        class="alert alert-success flex-col items-start gap-2"
      >
        <template v-if="todayGoalMet">
          <span>All Done! Move to Practice.</span>
          <button
            type="button"
            class="btn btn-sm"
            @click="emit('switch-view', 'practice')"
          >
            Go to practice
          </button>
        </template>
        <template v-else>
          <span>No words left to memorize.</span>
          <button
            type="button"
            class="btn btn-sm"
            @click="emit('switch-view', 'add')"
          >
            Add more words
          </button>
        </template>
      </div>

      <div
        v-else
        class="flex flex-col gap-8"
      >
        <div
          v-for="row in DISPLAY_ROWS"
          :key="row"
        >
          <div
            v-if="board[row].length > 0"
            class="relative"
            :style="{ paddingBottom: `${Math.min(board[row].length - 1, 4) * 10}px` }"
          >
            <div
              v-for="(word, index) in board[row].slice(1, 5)"
              :key="word.id"
              class="card bg-base-200 border border-base-300 absolute inset-0 h-32"
              :style="placeholderStyle(index)"
            />

            <div class="card bg-base-100 border border-base-300 shadow-md relative">
              <div class="card-body items-center gap-3 text-center p-5">
                <p class="text-3xl font-semibold">
                  {{ board[row][0].word }}
                </p>

                <button
                  v-if="!revealed[row] && !touch"
                  type="button"
                  class="btn btn-circle btn-outline btn-sm"
                  aria-label="Reveal"
                  @click="reveal(row)"
                >
                  <Eye class="w-4 h-4" />
                </button>
                <div
                  v-else-if="!revealed[row] && touch"
                  class="absolute inset-0 cursor-pointer"
                  role="button"
                  aria-label="Reveal"
                  @click="reveal(row)"
                />

                <template v-if="revealed[row]">
                  <div class="divider my-0" />
                  <p class="text-xl">
                    {{ board[row][0].meaning }}
                  </p>

                  <ul
                    v-if="board[row][0].examples.length > 0"
                    class="text-sm opacity-80 flex flex-col gap-1"
                  >
                    <li
                      v-for="(example, i) in board[row][0].examples"
                      :key="i"
                    >
                      {{ example.sentence }} — {{ example.translation }}
                    </li>
                  </ul>
                  <ul
                    v-if="board[row][0].notes.length > 0"
                    class="text-sm opacity-60 flex flex-col gap-1"
                  >
                    <li
                      v-for="(note, i) in board[row][0].notes"
                      :key="i"
                    >
                      {{ note.text }}
                    </li>
                  </ul>

                  <div class="flex gap-3 mt-2">
                    <button
                      type="button"
                      class="btn btn-circle btn-error btn-outline"
                      aria-label="Wrong"
                      @click="score(row, false)"
                    >
                      <X class="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      class="btn btn-circle btn-success btn-outline"
                      aria-label="Correct"
                      @click="score(row, true)"
                    >
                      <Check class="w-5 h-5" />
                    </button>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
