<script setup lang="ts">
import { Rating } from 'ts-fsrs'

defineProps<{
  labels: { again: string; hard: string; good: string; easy: string }
}>()

const emit = defineEmits<{
  rate: [rating: Rating]
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
    <button
      type="button"
      class="btn btn-outline btn-error"
      @click="emit('rate', Rating.Again)"
    >
      {{ labels.again }}
    </button>
    <button
      type="button"
      class="btn btn-outline btn-warning"
      @click="emit('rate', Rating.Hard)"
    >
      {{ labels.hard }}
    </button>
    <button
      type="button"
      class="btn btn-outline btn-success"
      @click="emit('rate', Rating.Good)"
    >
      {{ labels.good }}
    </button>
    <button
      type="button"
      class="btn btn-outline btn-primary"
      @click="emit('rate', Rating.Easy)"
    >
      {{ labels.easy }}
    </button>
  </div>
</template>
