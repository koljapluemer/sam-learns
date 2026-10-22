<script setup lang="ts">
import { computed, ref } from 'vue'
import { pickRandom } from '../../dumb/random'
import type { Reflection } from '../../entities/snippet-view/snippetView'

const QUESTIONS = [
  'What new vocabulary did you learn?',
  'What happened in the clip you just saw?',
  'What do you remember from the clip?'
]
const RATING_QUESTIONS = ['How interesting was this clip?', 'How much did you understand?']
const RATINGS = [1, 2, 3, 4, 5]

const emit = defineEmits<{
  done: [reflection: Reflection]
}>()

const question = pickRandom(QUESTIONS)!
const ratingQuestion = pickRandom(RATING_QUESTIONS)!
const answer = ref('')
const hasAnswer = computed(() => answer.value.trim() !== '')

function rate(rating: number): void {
  emit('done', { question, answer: answer.value.trim(), ratingQuestion, rating })
}
</script>

<template>
  <div class="card bg-base-100 border border-base-300 shadow-md w-full max-w-md">
    <div class="card-body gap-4">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">{{ question }}</span>
        <textarea
          v-model="answer"
          class="textarea w-full"
          rows="4"
        />
      </label>

      <div class="flex flex-col gap-1">
        <span class="text-sm font-medium">{{ ratingQuestion }}</span>
        <div class="join">
          <button
            v-for="rating in RATINGS"
            :key="rating"
            type="button"
            class="btn btn-sm join-item"
            :disabled="!hasAnswer"
            @click="rate(rating)"
          >
            {{ rating }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
