<script setup lang="ts">
import MemorizeFlow from './MemorizeFlow.vue'
import RevealFlow from './RevealFlow.vue'
import { usePracticeSession } from './usePracticeSession'

const props = defineProps<{ languageCode: string }>()

const { loading, current, completeMemorize, rate } = usePracticeSession(props.languageCode)
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

    <MemorizeFlow
      v-else-if="!current.card"
      :key="current.id"
      :pick="current"
      @done="completeMemorize"
    />

    <RevealFlow
      v-else
      :key="current.id"
      :pick="current"
      @rate="rate"
    />
  </div>
</template>
