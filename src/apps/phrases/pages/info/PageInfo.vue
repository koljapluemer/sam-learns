<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppInfoText from '@/shared/shell/AppInfoText.vue'
import PageShell from '@/shared/shell/PageShell.vue'

const router = useRouter()
</script>

<template>
  <PageShell title="Phrases">
    <p class="opacity-70">
      Memorize core phrases across your target languages. Learn a phrase, then practice recalling and speaking it
      with FSRS spaced repetition.
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
