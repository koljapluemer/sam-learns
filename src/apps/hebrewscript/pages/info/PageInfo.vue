<script setup lang="ts">
// Ported from linguanodon's hebrew-script/home.html.
import { RouterLink } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
</script>

<template>
  <PageShell title="Script Practice">
    <div class="flex flex-col items-center gap-6 text-center">
      <p class="text-sm opacity-80 max-w-xs">
        Listen to a short audio clip and pick the Hebrew script that matches
        what you heard, building letter recognition by ear.
      </p>
      <RouterLink
        :to="{ name: 'hebrewscript-practice' }"
        class="btn btn-primary"
      >
        Start practicing
      </RouterLink>
    </div>
  </PageShell>
</template>
