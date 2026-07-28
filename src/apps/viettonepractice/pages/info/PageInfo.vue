<script setup lang="ts">
// Ported from linguanodon's viet-tone-practice/home.html.
import { RouterLink } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
</script>

<template>
  <PageShell title="Vietnamese Tone Practice">
    <div class="flex flex-col items-center gap-6 text-center">
      <p class="text-sm opacity-80 max-w-xs">
        Listen to a short audio clip and identify which of Vietnamese's six
        tones you heard, training your ear for tone distinctions.
      </p>
      <RouterLink
        :to="{ name: 'viettonepractice-practice' }"
        class="btn btn-primary"
      >
        Start practicing
      </RouterLink>
    </div>
  </PageShell>
</template>
