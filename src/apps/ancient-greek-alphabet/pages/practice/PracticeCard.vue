<script setup lang="ts">
import { ref } from 'vue'
import { Rating, type Grade } from 'ts-fsrs'
import { isStruggling } from '../../entities/card/card'
import type { PracticePick } from './nextCard'

const props = defineProps<{ pick: PracticePick }>()
const emit = defineEmits<{ rate: [rating: Grade] }>()

const imageOnFront = isStruggling(props.pick.card)
const revealed = ref(false)

const ratings: { label: string; value: Grade }[] = [
  { label: 'Again', value: Rating.Again },
  { label: 'Hard', value: Rating.Hard },
  { label: 'Good', value: Rating.Good },
  { label: 'Easy', value: Rating.Easy }
]
</script>

<template>
  <p class="text-center text-sm opacity-70">
    Try to pronounce this
  </p>

  <div class="card w-full shadow-xl">
    <div class="card-body items-center gap-4 text-center">
      <p
        lang="grc"
        class="text-4xl font-semibold"
      >
        {{ pick.word.term }}
      </p>
      <img
        v-if="imageOnFront || revealed"
        :src="pick.word.image"
        alt=""
        class="max-h-48 rounded-box object-contain"
      >
      <audio
        v-if="revealed"
        :src="pick.word.audio"
        class="w-full"
        controls
        autoplay
      />
    </div>
  </div>

  <button
    v-if="!revealed"
    type="button"
    class="btn self-center"
    @click="revealed = true"
  >
    Show Pronunciation
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
