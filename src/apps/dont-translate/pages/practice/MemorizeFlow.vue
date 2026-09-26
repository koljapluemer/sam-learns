<script setup lang="ts">
// New card: show both sides for a few seconds, hide the back, then let the
// user recall and reveal it before the card enters FSRS.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { pickRandom } from '../../dumb/random'
import type { PracticePick } from './nextCard'
import FlashcardView from './FlashcardView.vue'

const props = defineProps<{ pick: PracticePick }>()
const emit = defineEmits<{ done: [] }>()

const MEMORIZE_MS = 5000

const expression = pickRandom(props.pick.flashcard.expressions)
const expressions = expression ? [expression] : []
const remainingMs = ref(MEMORIZE_MS)
const phase = ref<'memorize' | 'recall' | 'reveal'>('memorize')
let frameId: number | undefined

// Updated every frame from elapsed time, so the bar stays smooth and in sync
// with the actual deadline.
function tick(startedAt: number, now: number): void {
  remainingMs.value = Math.max(0, MEMORIZE_MS - (now - startedAt))
  if (remainingMs.value > 0) {
    frameId = requestAnimationFrame((next) => tick(startedAt, next))
  } else {
    phase.value = 'recall'
  }
}

onMounted(() => {
  frameId = requestAnimationFrame((now) => tick(now, now))
})

onBeforeUnmount(() => {
  if (frameId !== undefined) cancelAnimationFrame(frameId)
})
</script>

<template>
  <FlashcardView
    :image="pick.flashcard.image"
    :expressions="expressions"
    :direction="pick.direction"
    :revealed="phase !== 'recall'"
  />

  <progress
    v-if="phase === 'memorize'"
    class="progress progress-primary w-full [&::-moz-progress-bar]:transition-none [&::-webkit-progress-value]:transition-none"
    :value="remainingMs"
    :max="MEMORIZE_MS"
  />

  <button
    v-else-if="phase === 'recall'"
    type="button"
    class="btn self-center"
    @click="phase = 'reveal'"
  >
    Reveal
  </button>

  <button
    v-else
    type="button"
    class="btn btn-primary self-center"
    @click="emit('done')"
  >
    Done
  </button>
</template>
