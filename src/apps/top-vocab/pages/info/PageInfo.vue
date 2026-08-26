<script setup lang="ts">
import { useRouter } from 'vue-router'
import AppInfoText from '@/shared/shell/AppInfoText.vue'
import PageShell from '@/shared/shell/PageShell.vue'

const router = useRouter()
</script>

<template>
  <PageShell title="Top Vocab">
    <p class="opacity-70">
      Practice a language's top vocab and sentences with FSRS spaced repetition.
    </p>
    <button
      type="button"
      class="btn btn-primary self-start"
      @click="router.push({ name: 'top-vocab-practice' })"
    >
      Start
    </button>
    <hr class="border-base-300">
    <AppInfoText />
  </PageShell>
</template>
