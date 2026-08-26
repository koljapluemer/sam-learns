<script setup lang="ts">
import { ref } from 'vue'
import { Volume2 } from 'lucide-vue-next'

const props = defineProps<{ audioUrl: string }>()

const audioRef = ref<HTMLAudioElement | null>(null)

function play(): void {
  const audio = audioRef.value
  if (!audio) return
  audio.currentTime = 0
  void audio.play()
}
</script>

<template>
  <button
    type="button"
    class="btn btn-circle btn-outline"
    aria-label="Play audio"
    @click="play"
  >
    <Volume2 :size="18" />
  </button>
  <audio
    ref="audioRef"
    :src="props.audioUrl"
    preload="none"
    class="hidden"
  />
</template>
