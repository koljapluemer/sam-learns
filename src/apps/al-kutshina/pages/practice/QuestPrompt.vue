<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Volume2 } from 'lucide-vue-next'
import { playSound } from '../../dumb/playSound'

const props = defineProps<{ text: string; audioUrl: string }>()

const AUTOPLAY_DELAY_MS = 400

const playing = ref(false)
let audio: HTMLAudioElement | undefined
let autoplayTimer: ReturnType<typeof setTimeout> | undefined

function play() {
  audio?.pause()
  audio = playSound(props.audioUrl)
  audio.addEventListener('playing', () => (playing.value = true))
  for (const event of ['ended', 'pause', 'error']) {
    audio.addEventListener(event, () => (playing.value = false))
  }
}

onMounted(() => {
  autoplayTimer = setTimeout(play, AUTOPLAY_DELAY_MS)
})

onUnmounted(() => {
  clearTimeout(autoplayTimer)
  audio?.pause()
})
</script>

<template>
  <div class="flex items-center gap-4 rounded-box bg-base-200 p-4">
    <button
      type="button"
      class="btn btn-circle btn-primary shrink-0"
      aria-label="Play instruction"
      :disabled="playing"
      @click="play"
    >
      <Volume2 :size="20" />
    </button>
    <p
      dir="auto"
      class="grow text-2xl sm:text-3xl"
    >
      {{ text }}
    </p>
  </div>
</template>
