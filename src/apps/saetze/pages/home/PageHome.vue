<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Lesson } from '../../app/types'

const lessons = ref<Lesson[]>([])
const loading = ref(true)
const loadError = ref('')

onMounted(async () => {
  try {
    const response = await fetch('/data/saetze/lessons.json')
    if (!response.ok) throw new Error(`Failed to load lessons (${response.status})`)
    lessons.value = (await response.json()) as Lesson[]
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load lessons.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen p-4">
    <div class="flex flex-col items-center gap-6">
      <h1 class="text-2xl font-bold">
        Sätze — German Cloze Drills
      </h1>
      <p class="text-sm opacity-70 text-center max-w-xs">
        Fill in the blank in German sentences to learn confusable word families like
        "jeder/alle/ganz". Pick a lesson to start.
      </p>

      <div
        v-if="loading"
        class="mt-4"
      >
        <span class="loading loading-spinner loading-lg" />
      </div>
      <div
        v-else-if="loadError"
        class="alert alert-error max-w-xs"
      >
        <span>{{ loadError }}</span>
      </div>
      <div
        v-else
        class="flex flex-col gap-2 w-full max-w-xs"
      >
        <RouterLink
          v-for="lesson in lessons"
          :key="lesson.key"
          :to="{ name: 'saetze-practice', params: { lessonKey: lesson.key } }"
          class="btn btn-primary"
        >
          {{ lesson.name }}
        </RouterLink>
        <p
          v-if="lessons.length === 0"
          class="text-center opacity-70"
        >
          No lessons imported yet.
        </p>
      </div>
    </div>
  </div>
</template>
