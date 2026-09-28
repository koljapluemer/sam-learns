<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getItems, type Item } from '../../entities/item/item'
import { audioUrl, getSentences } from '../../entities/sentence/sentence'
import ExerciseRound from './ExerciseRound.vue'
import { generateExercise, type Exercise } from './generateExercise'

const props = defineProps<{ languageCode: string }>()

const loading = ref(true)
const items = ref<Item[]>([])
const itemsByImg = ref(new Map<string, Item>())
const sentences = ref<Record<string, string>>({})
const exercise = ref<Exercise>()

function next() {
  exercise.value = generateExercise(items.value, Object.keys(sentences.value))
}

onMounted(async () => {
  const [loadedItems, loadedSentences] = await Promise.all([getItems(), getSentences(props.languageCode)])
  items.value = loadedItems
  itemsByImg.value = new Map(loadedItems.map((item) => [item.img, item]))
  sentences.value = loadedSentences
  loading.value = false
  next()
})
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-4 py-4">
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <p
      v-else-if="!exercise"
      class="py-8 text-center opacity-70"
    >
      No exercises available.
    </p>

    <Transition
      v-else
      mode="out-in"
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-200 ease-in"
      leave-to-class="opacity-0"
    >
      <ExerciseRound
        :key="exercise.id"
        :exercise="exercise"
        :items-by-img="itemsByImg"
        :text="sentences[exercise.questKey] ?? ''"
        :audio-url="audioUrl(languageCode, exercise.questKey)"
        @done="next"
      />
    </Transition>
  </div>
</template>
