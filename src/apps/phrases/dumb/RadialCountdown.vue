<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ durationMs?: number }>(), { durationMs: 3000 })
const emit = defineEmits<{ complete: [] }>()

const percent = ref(100)
let rafId = 0
let startTime = 0

function tick(timestamp: number): void {
  if (!startTime) startTime = timestamp
  const progress = Math.min((timestamp - startTime) / props.durationMs, 1)
  percent.value = Math.round((1 - progress) * 100)
  if (progress < 1) {
    rafId = requestAnimationFrame(tick)
  } else {
    emit('complete')
  }
}

onMounted(() => {
  rafId = requestAnimationFrame(tick)
})

onBeforeUnmount(() => cancelAnimationFrame(rafId))
</script>

<template>
  <div class="flex min-h-[60vh] items-center justify-center">
    <div
      class="radial-progress text-primary"
      :style="{ '--value': percent, '--size': '5rem', '--thickness': '4px' }"
      role="progressbar"
      :aria-valuenow="percent"
    />
  </div>
</template>
