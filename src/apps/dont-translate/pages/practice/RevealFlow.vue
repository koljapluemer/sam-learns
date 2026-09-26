<script setup lang="ts">
import { ref } from 'vue'
import { Rating, type Grade } from 'ts-fsrs'
import { takeRandom } from '../../dumb/random'
import type { PracticePick } from './nextCard'
import FlashcardView from './FlashcardView.vue'

const props = defineProps<{ pick: PracticePick }>()
const emit = defineEmits<{ rate: [rating: Grade] }>()

const MAX_EXPRESSIONS = 3

const expressions = takeRandom(props.pick.flashcard.expressions, MAX_EXPRESSIONS)
const revealed = ref(false)

const ratings: { label: string; value: Grade }[] = [
  { label: 'Again', value: Rating.Again },
  { label: 'Hard', value: Rating.Hard },
  { label: 'Good', value: Rating.Good },
  { label: 'Easy', value: Rating.Easy }
]
</script>

<template>
  <FlashcardView
    :image="pick.flashcard.image"
    :expressions="expressions"
    :direction="pick.direction"
    :revealed="revealed"
  />

  <button
    v-if="!revealed"
    type="button"
    class="btn self-center"
    @click="revealed = true"
  >
    Reveal
  </button>

  <div
    v-else
    class="grid grid-cols-2 gap-2 sm:grid-cols-4"
  >
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
