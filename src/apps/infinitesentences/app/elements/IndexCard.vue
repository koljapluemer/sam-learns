<script setup lang="ts">
// Port of linguanodon's infinitesentences app/elements/IndexCard.js.
import { computed } from 'vue'
import type { IndexCardRow } from '../types'

const props = withDefaults(
  defineProps<{
    rows: IndexCardRow[]
    flipped?: boolean
    swiped?: boolean
    fill?: boolean
    gold?: boolean
  }>(),
  { flipped: false, swiped: false, fill: false, gold: false }
)

function textClass(row: IndexCardRow): string {
  if (row.type === 'divider') return ''
  if (row.size === 'small') return 'text-sm opacity-60'

  if (row.size === 'auto') {
    const length = (row.text ?? '').length
    if (length < 3) return 'text-7xl font-bold'
    if (length < 20) return 'text-5xl font-bold'
    return 'text-3xl font-semibold'
  }

  return 'text-xl'
}

const cardClasses = computed(() => [
  'card',
  'shadow',
  'index-card',
  props.gold ? 'bg-amber-200' : 'bg-white',
  'text-gray-700',
  'w-full',
  props.fill && 'h-full',
  props.flipped && 'index-card-flipped',
  props.swiped && 'index-card-swiped'
])
</script>

<template>
  <div :class="cardClasses">
    <div class="card-body gap-4 grid place-items-center text-center mb-8">
      <template
        v-for="(row, index) in rows"
        :key="index"
      >
        <div
          v-if="row.type === 'divider'"
          class="w-full border-b-2 border-dotted"
        />
        <div
          v-else
          class="flex flex-col items-center gap-1"
        >
          <p :class="textClass(row)">
            {{ row.text }}
          </p>
          <p
            v-if="row.subtext"
            class="text-sm text-gray-400"
          >
            {{ row.subtext }}
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
/* Port of linguanodon's infinitesentences css/style.css flip/swipe rules -
   real keyframes, not expressible as Tailwind utility classes. */
.index-card {
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.index-card-flipped {
  animation: infinitesentences-flip-card 0.4s ease;
}

@keyframes infinitesentences-flip-card {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(0deg);
  }
}

.index-card-swiped {
  animation: infinitesentences-swipe-card 0.35s ease forwards;
}

@keyframes infinitesentences-swipe-card {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(60%);
    opacity: 0;
  }
}
</style>
