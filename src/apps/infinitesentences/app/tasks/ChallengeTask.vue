<script setup lang="ts">
// Port of linguanodon's infinitesentences app/tasks/ChallengeTask.js.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import IndexCard from '../elements/IndexCard.vue'
import InteractionButtonRow from '../elements/InteractionButtonRow.vue'
import ShowInstruction from '../elements/ShowInstruction.vue'
import type { ChallengeTaskData, IndexCardRow } from '../types'

const DELAY_MS = 2000
const CIRCUMFERENCE = 2 * Math.PI * 15

const props = defineProps<{ task: ChallengeTaskData }>()
const emit = defineEmits<{ 'task-done': [rememberedCorrectly?: boolean] }>()

const flipped = ref(false)
const phase = ref<'prompt' | 'reveal'>('prompt')
const animationKey = ref(0)
const canFlip = ref(false)

let delayTimer: ReturnType<typeof setTimeout> | null = null

const cardRows = computed<IndexCardRow[]>(() => {
  const glossRow: IndexCardRow = {
    type: 'text',
    text: props.task.gloss.content,
    size: 'auto',
    subtext: props.task.gloss.transcription
  }
  if (phase.value === 'prompt') return [glossRow]

  const translationRows: IndexCardRow[] = props.task.translations.map((translation) => ({
    type: 'text',
    text: translation.content,
    size: 'auto'
  }))
  return [glossRow, { type: 'divider' }, ...translationRows]
})

function flip(): void {
  flipped.value = true
  phase.value = 'reveal'
}

function finish(): void {
  emit('task-done', true)
}

function startTimer(): void {
  canFlip.value = false
  if (delayTimer) clearTimeout(delayTimer)
  delayTimer = setTimeout(() => {
    canFlip.value = true
  }, DELAY_MS)
}

function resetState(): void {
  flipped.value = false
  phase.value = 'prompt'
  animationKey.value++
  startTimer()
}

onMounted(startTimer)
onUnmounted(() => {
  if (delayTimer) clearTimeout(delayTimer)
})
watch(() => props.task.gloss.content, resetState)

const ringStyle = {
  '--countdown-duration': `${DELAY_MS}ms`,
  '--countdown-circumference': String(CIRCUMFERENCE)
}
</script>

<template>
  <div class="w-full max-w-xl flex flex-col min-h-[70vh] gap-4">
    <div>
      <ShowInstruction
        v-if="phase === 'prompt'"
        content="Can you understand this?"
      />
    </div>

    <div class="flex-1 flex flex-col gap-4 items-center overflow-auto">
      <IndexCard
        :rows="cardRows"
        :flipped="flipped"
        gold
        fill
      />

      <div
        v-if="phase === 'reveal' && task.credits && task.credits.length > 0"
        class="text-xs opacity-60 text-center px-4"
      >
        <div
          v-for="(credit, idx) in task.credits"
          :key="idx"
        >
          {{ credit }}
        </div>
      </div>
    </div>

    <div class="mt-auto flex justify-center">
      <template v-if="phase === 'prompt'">
        <svg
          v-if="!canFlip"
          :key="animationKey"
          class="w-10 h-10 -rotate-90 opacity-30"
          viewBox="0 0 36 36"
          :style="ringStyle"
        >
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            :stroke-dasharray="CIRCUMFERENCE"
            class="countdown-ring"
          />
        </svg>
        <InteractionButtonRow
          v-else
          :icons="['RefreshCw']"
          @select="flip"
        />
      </template>
      <InteractionButtonRow
        v-else
        :icons="['CheckCheck']"
        @select="finish"
      />
    </div>
  </div>
</template>

<style scoped>
/* Port of linguanodon's infinitesentences css/style.css countdown-ring rule. */
.countdown-ring {
  stroke-dashoffset: 0;
  animation: infinitesentences-countdown var(--countdown-duration, 2000ms) linear forwards;
}

@keyframes infinitesentences-countdown {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: var(--countdown-circumference, 94.2477796077);
  }
}
</style>

