<script setup lang="ts">
import { imageUrl } from '../../entities/item/item'
import type { Field } from '../../entities/item/interaction'
import type { CardStatus } from './useExerciseRound'

defineProps<{ field: Field; status?: CardStatus | 'target' }>()

const STATUS_CLASS: Record<CardStatus | 'target', string> = {
  target: 'scale-105 ring-4 ring-primary',
  correct: 'pop ring-4 ring-success',
  wrong: 'shake ring-4 ring-error',
  solution: 'pop ring-4 ring-success'
}
</script>

<template>
  <div
    class="card relative size-full border border-base-300 bg-base-100 transition-[scale,box-shadow] duration-150"
    :class="status && STATUS_CLASS[status]"
  >
    <!-- Keyed, so an image change (ChangeTo) cross-fades -->
    <Transition
      enter-active-class="transition duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-300"
      leave-to-class="opacity-0"
    >
      <img
        :key="field.img"
        :src="imageUrl(field.img)"
        alt=""
        draggable="false"
        class="absolute inset-0 m-auto max-h-[80%] max-w-[80%] object-contain"
      >
    </Transition>
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="scale-150 opacity-0"
      leave-active-class="transition duration-200"
      leave-to-class="opacity-0"
    >
      <img
        v-if="field.overlayImg"
        :src="imageUrl(field.overlayImg)"
        alt=""
        draggable="false"
        class="absolute inset-0 m-auto max-h-1/2 max-w-1/2 object-contain"
      >
    </Transition>
  </div>
</template>

<style scoped>
.pop {
  animation: pop 0.4s ease-out;
}

.shake {
  animation: shake 0.4s ease-in-out;
}

@keyframes pop {
  50% {
    transform: scale(1.1);
  }
}

@keyframes shake {
  20%,
  60% {
    transform: translateX(-6px);
  }

  40%,
  80% {
    transform: translateX(6px);
  }
}
</style>
