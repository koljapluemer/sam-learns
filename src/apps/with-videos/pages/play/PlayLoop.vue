<script setup lang="ts">
import { usePlayState } from './usePlayState'
import ExerciseBoard from './ExerciseBoard.vue'
import ReflectionForm from './ReflectionForm.vue'
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
      v-if="play.mode.value === 'exercises' || play.mode.value === 'reflection'"
      class="absolute inset-0 flex justify-center overflow-y-auto bg-base-300/80 backdrop-blur-sm p-4"
    >
      <div class="my-auto flex w-full justify-center">
        <ExerciseBoard
          v-if="play.mode.value === 'exercises'"
          :entries="play.exercises.value"
          @done="play.playSnippet"
        />
        <ReflectionForm
          v-else
          @done="play.submitReflection"
        />
      </div>
    </div>
  </div>
</template>
