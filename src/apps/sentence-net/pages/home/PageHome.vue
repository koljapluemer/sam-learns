<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function start(): void {
  router.push({ name: 'sentence-net-play' })
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10">
    <div>
      <h1 class="text-3xl font-bold">
        Sentence Net
      </h1>
      <p class="mt-3 opacity-70">
        Acquire target-language vocab in context. Add example sentences, tag their
        words, then practice both with FSRS flashcards.
      </p>
    </div>

    <button
      type="button"
      class="btn btn-primary self-start"
      @click="start"
    >
      Start
    </button>
  </div>
</template>
