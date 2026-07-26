<script setup lang="ts">
import { usePlayState } from './usePlayState'
import SelectView from './SelectView.vue'
import VocabPracticeView from './VocabPracticeView.vue'
import { useActiveTime } from '@/shared/activity/useActiveTime'

const play = usePlayState()
useActiveTime('the-little-prince')
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
      v-if="play.mode.value === 'select'"
      class="absolute inset-0"
    >
      <SelectView
        :has-next-segment="play.hasNextSegment.value"
        @replay="play.replay"
        @practice-and-replay="play.practiceCurrentAndReplay"
        @next="play.playNext"
        @practice-and-next="play.practiceNextAndPlay"
      />
    </div>

    <div
      v-if="play.mode.value === 'vocab-practice' && play.currentSegment.value"
      class="absolute inset-0"
    >
      <VocabPracticeView
        :youtube-id="play.youtubeId.value"
        :segment="play.currentSegment.value"
        @finished="play.onVocabFinished"
      />
    </div>
  </div>
</template>
