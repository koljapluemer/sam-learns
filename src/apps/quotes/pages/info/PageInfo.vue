<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'

const router = useRouter()

function start(): void {
  router.push({ name: 'quotes-practice' })
}
</script>

<template>
  <PageShell title="Quotes">
    <p class="opacity-70">
      Memorize quotes with cloze flashcards that gradually hide more of the text,
      from the last word back, as you master each depth.
    </p>

    <button
      type="button"
      class="btn btn-primary self-start"
      @click="start"
    >
      Start
    </button>
  </PageShell>
</template>
