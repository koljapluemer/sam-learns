<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { Mic, RotateCcw, Square, Volume2 } from 'lucide-vue-next'

const emit = defineEmits<{ 'update:recorded': [boolean] }>()

const state = ref<'idle' | 'recording' | 'recorded'>('idle')
const error = ref('')
const audioUrl = ref<string | null>(null)
const audioRef = ref<HTMLAudioElement | null>(null)

let mediaRecorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let chunks: Blob[] = []

async function startRecording(): Promise<void> {
  error.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch {
    error.value = 'Microphone access denied.'
    return
  }
  chunks = []
  mediaRecorder = new MediaRecorder(stream)
  mediaRecorder.ondataavailable = (event) => chunks.push(event.data)
  mediaRecorder.onstop = () => {
    if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
    audioUrl.value = URL.createObjectURL(new Blob(chunks, { type: 'audio/webm' }))
    state.value = 'recorded'
    emit('update:recorded', true)
    stream?.getTracks().forEach((track) => track.stop())
    stream = null
  }
  mediaRecorder.start()
  state.value = 'recording'
}

function stopRecording(): void {
  mediaRecorder?.stop()
}

function redo(): void {
  state.value = 'idle'
  emit('update:recorded', false)
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
  audioUrl.value = null
}

function replay(): void {
  const audio = audioRef.value
  if (!audio) return
  audio.currentTime = 0
  void audio.play()
}

onBeforeUnmount(() => {
  mediaRecorder?.stop()
  stream?.getTracks().forEach((track) => track.stop())
  if (audioUrl.value) URL.revokeObjectURL(audioUrl.value)
})
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <button
      v-if="state === 'idle'"
      type="button"
      class="btn btn-circle btn-primary btn-lg"
      aria-label="Start recording"
      @click="startRecording"
    >
      <Mic :size="24" />
    </button>
    <button
      v-else-if="state === 'recording'"
      type="button"
      class="btn btn-circle btn-error btn-lg"
      aria-label="Stop recording"
      @click="stopRecording"
    >
      <Square :size="20" />
    </button>
    <div
      v-else
      class="flex items-center gap-3"
    >
      <button
        type="button"
        class="btn btn-circle btn-outline"
        aria-label="Replay recording"
        @click="replay"
      >
        <Volume2 :size="18" />
      </button>
      <button
        type="button"
        class="btn btn-circle btn-outline"
        aria-label="Redo recording"
        @click="redo"
      >
        <RotateCcw :size="18" />
      </button>
    </div>
    <p
      v-if="error"
      class="text-error text-sm"
    >
      {{ error }}
    </p>
    <audio
      ref="audioRef"
      :src="audioUrl ?? undefined"
      class="hidden"
    />
  </div>
</template>
