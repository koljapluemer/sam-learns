<script setup lang="ts">
import { usePlayState } from './usePlayState'
import ExerciseView from './ExerciseView.vue'
import { useActiveTime } from '@/shared/activity/useActiveTime'

const play = usePlayState()
useActiveTime('with-videos')
</script>

<template>
  <div class="relative flex h-screen w-full items-center justify-center bg-base-300">
    <div
      v-if="play.loadError.value"
      class="alert alert-error glass max-w-xl"
    >
      <span>{{ play.loadError.value }}</span>
    </div>

    <div
      v-if="play.mode.value === 'loading' && !play.loadError.value"
      class="absolute inset-0 flex items-center justify-center"
    >
      <span class="loading loading-spinner loading-lg" />
    </div>

    <div class="aspect-video w-full max-h-full">
      <div
        :id="play.playerElementId"
        class="h-full w-full"
      />
    </div>

    <div
      v-if="play.mode.value === 'exercises' && play.currentExercise.value"
      class="absolute inset-0"
    >
      <ExerciseView
        :key="play.currentExercise.value.key"
        :entry="play.currentExercise.value"
        :number="play.exerciseNumber.value"
        :total="play.exerciseTotal.value"
        @rate="play.rate"
        @replay="play.replay"
      />
    </div>
  </div>
</template>
