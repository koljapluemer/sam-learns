<script setup lang="ts">
// Port of linguanodon's infinitesentences app/tasks/MemorizeTask.js.
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import IndexCard from '../elements/IndexCard.vue'
import InteractionButtonRow from '../elements/InteractionButtonRow.vue'
import ShowInstruction from '../elements/ShowInstruction.vue'
import type { IndexCardRow, MemorizeTaskData } from '../types'

const DURATION_MS = 5000

const props = defineProps<{ task: MemorizeTaskData }>()
const emit = defineEmits<{ 'task-done': [] }>()

const remainingMs = ref(DURATION_MS)
let timerId: ReturnType<typeof setInterval> | null = null

function stopTimer(): void {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

function startTimer(): void {
  stopTimer()
  remainingMs.value = DURATION_MS
  timerId = setInterval(() => {
    remainingMs.value = Math.max(0, remainingMs.value - 100)
    if (remainingMs.value <= 0) {
      stopTimer()
      emit('task-done')
    }
  }, 100)
}

const progressWidth = computed(() => `${(remainingMs.value / DURATION_MS) * 100}%`)

function handleCardClick(): void {
  stopTimer()
  emit('task-done')
}

const cardRows = computed<IndexCardRow[]>(() => {
  const translationRows: IndexCardRow[] = props.task.translations.map((translation) => ({
    type: 'text',
    text: translation.content,
    size: 'auto'
  }))

  return [
    { type: 'text', text: props.task.gloss.content, size: 'auto', subtext: props.task.gloss.transcription },
    { type: 'divider' },
    ...translationRows
  ]
})

watch(() => props.task.gloss.content, startTimer)
onMounted(startTimer)
onBeforeUnmount(stopTimer)
</script>

<template>
  <div class="w-full max-w-xl flex flex-col min-h-[70vh] gap-4">
    <div>
      <ShowInstruction content="Try to memorize this" />
    </div>

    <div class="flex-1 flex flex-col gap-4 items-center overflow-auto w-full">
      <IndexCard
        :rows="cardRows"
        fill
        class="cursor-pointer"
        @click="handleCardClick"
      />

      <div class="w-full bg-base-200 h-2 rounded">
        <div
          class="h-full bg-primary transition-[width] duration-100"
          :style="{ width: progressWidth }"
        />
      </div>
    </div>

    <InteractionButtonRow
      :icons="['SkipForward']"
      @select="handleCardClick"
    />
  </div>
</template>
