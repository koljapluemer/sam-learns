<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { Volume2 } from 'lucide-vue-next'
import { playSound } from '../../dumb/playSound'

const props = defineProps<{ text: string; audioUrl: string; solved: boolean }>()

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
  <div class="flex items-start justify-center gap-2">
    <p
      dir="auto"
      class="text-center text-3xl leading-tight font-extrabold text-balance transition-colors duration-300 sm:text-5xl"
      :class="{ 'text-success': solved }"
    >
      {{ text }}
    </p>
    <button
      type="button"
      class="btn btn-square btn-ghost shrink-0"
      :class="{ 'text-primary': playing }"
      aria-label="Play instruction"
      @click="play"
    >
      <Volume2 class="size-5" />
    </button>
  </div>
</template>
