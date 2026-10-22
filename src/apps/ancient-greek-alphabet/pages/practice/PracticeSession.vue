<script setup lang="ts">
import { isOnline } from '@/shared/offline/useOnline'
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
      {{ isOnline ? 'All caught up. Nothing due right now.' : 'Nothing due among the cards available offline.' }}
    </p>

    <PracticeCard
      v-else
      :key="current.word.term"
      :pick="current"
      @rate="rate"
    />
  </div>
</template>
