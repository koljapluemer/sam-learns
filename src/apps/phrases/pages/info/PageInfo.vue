<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppInfoText from '@/shared/shell/AppInfoText.vue'
import PageShell from '@/shared/shell/PageShell.vue'

const router = useRouter()
</script>

<template>
  <PageShell title="Phrases">
    <p class="opacity-70">
      Memorize core phrases for everyday situations, by target language. Pick a language and situation, then
      practice with FSRS spaced repetition - reveal the text or listen to the audio, then rate yourself.
    </p>
    <button
      type="button"
      class="btn btn-primary self-start"
      @click="router.push({ name: 'phrases-practice' })"
    >
      Start
    </button>
    <hr class="border-base-300">
    <AppInfoText />
  </PageShell>
</template>
