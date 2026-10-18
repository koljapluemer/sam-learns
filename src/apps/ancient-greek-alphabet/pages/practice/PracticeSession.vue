<script setup lang="ts">
import PracticeCard from './PracticeCard.vue'
import { usePracticeSession } from './usePracticeSession'

const { loading, current, rate } = usePracticeSession()
</script>

<template>
  <div class="mx-auto flex w-full max-w-lg flex-col gap-4 px-4 py-8">
    <div
      v-if="loading"
      class="flex justify-center py-8"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <p
      v-else-if="!current"
      class="py-8 text-center opacity-70"
    >
      All caught up. Nothing due right now.
    </p>

    <PracticeCard
      v-else
      :key="current.word.term"
      :pick="current"
      @rate="rate"
    />
  </div>
</template>
