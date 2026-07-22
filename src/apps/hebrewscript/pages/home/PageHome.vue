<script setup lang="ts">
// Ported from linguanodon's hebrew-script/home.html.
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen p-4">
    <div class="flex flex-col items-center gap-6 text-center">
      <h1 class="text-2xl font-bold">
        Script Practice
      </h1>
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
  </div>
</template>
