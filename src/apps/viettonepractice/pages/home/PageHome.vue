<script setup lang="ts">
// Ported from linguanodon's viet-tone-practice/home.html.
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen p-4">
    <div class="flex flex-col items-center gap-6 text-center">
      <h1 class="text-2xl font-bold">
        Vietnamese Tone Practice
      </h1>
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
  </div>
</template>
