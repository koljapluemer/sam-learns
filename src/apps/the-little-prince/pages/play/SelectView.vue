<script setup lang="ts">
defineProps<{
  hasNextSegment: boolean
}>()

const emit = defineEmits<{
  replay: []
  'practice-and-replay': []
  next: []
  'practice-and-next': []
}>()
</script>

<template>
  <div class="flex h-full w-full items-center justify-center bg-base-300/80 backdrop-blur-sm">
    <div class="card glass w-full max-w-sm shadow-xl">
      <div class="card-body items-center gap-3 text-center">
        <h2 class="text-lg font-semibold">
          What next?
        </h2>

        <button
          type="button"
          class="btn btn-block"
          @click="emit('replay')"
        >
          Replay segment
        </button>
        <button
          type="button"
          class="btn btn-primary btn-block"
          @click="emit('practice-and-replay')"
        >
          Practice vocab &amp; rewatch
        </button>
        <div class="divider my-1" />
        <button
          type="button"
          class="btn btn-block"
          :disabled="!hasNextSegment"
          @click="emit('next')"
        >
          Next segment
        </button>
        <button
          type="button"
          class="btn btn-primary btn-block"
          :disabled="!hasNextSegment"
          @click="emit('practice-and-next')"
        >
          Practice next segment &amp; play
        </button>
      </div>
    </div>
  </div>
</template>
