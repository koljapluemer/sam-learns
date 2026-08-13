<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
import AppInfoText from '@/shared/shell/AppInfoText.vue'

const router = useRouter()

function start(): void {
  router.push({ name: 'sentence-net-play' })
}
</script>

<template>
  <PageShell title="Sentence Net">
    <p class="opacity-70">
      Acquire target-language vocab in context. Add example sentences, tag their
      words, then practice both with FSRS flashcards.
    </p>

    <button
      type="button"
      class="btn btn-primary self-start"
      @click="start"
    >
      Start
    </button>

    <hr class="border-base-300">
    <AppInfoText />
  </PageShell>
</template>
