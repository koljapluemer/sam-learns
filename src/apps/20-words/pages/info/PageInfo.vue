<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
import AppInfoText from '@/shared/shell/AppInfoText.vue'
</script>

<template>
  <PageShell title="20 Words">
    <p class="opacity-70">
      Add 20 vocab words a day, memorize them via Leitner's Learning Patience, then keep
      them fresh with FSRS flashcard practice.
    </p>

    <RouterLink
      to="/20-words/main"
      class="btn btn-primary self-start"
    >
      Get started
    </RouterLink>

    <hr class="border-base-300">
    <AppInfoText />
  </PageShell>
</template>
