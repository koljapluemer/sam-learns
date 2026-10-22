<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getItems, imageUrl, type Item } from '../../entities/item/item'
import { audioUrl, getSentences } from '../../entities/sentence/sentence'
import { cachedUrlsReady, isUrlAvailable, NOTHING_CACHED_MESSAGE } from '@/shared/offline/cachedUrls'
import { isOnline } from '@/shared/offline/useOnline'
import ExerciseRound from './ExerciseRound.vue'
import { generateExercise, type Exercise } from './generateExercise'

const props = defineProps<{ languageCode: string }>()

const loading = ref(true)
const items = ref<Item[]>([])
const itemsByImg = ref(new Map<string, Item>())
const sentences = ref<Record<string, string>>({})
const exercise = ref<Exercise>()

// Offline, only items/sentences whose image/recording is cached.
function next() {
  const availableItems = items.value.filter((item) => isUrlAvailable(imageUrl(item.img)))
  const questKeys = Object.keys(sentences.value).filter((key) => isUrlAvailable(audioUrl(props.languageCode, key)))
  exercise.value = generateExercise(availableItems, questKeys)
}

onMounted(async () => {
  const [loadedItems, loadedSentences] = await Promise.all([getItems(), getSentences(props.languageCode)])
  items.value = loadedItems
  itemsByImg.value = new Map(loadedItems.map((item) => [item.img, item]))
  sentences.value = loadedSentences
  await cachedUrlsReady()
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
      {{ isOnline ? 'No exercises available.' : NOTHING_CACHED_MESSAGE }}
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
