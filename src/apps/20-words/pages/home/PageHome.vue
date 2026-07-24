<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 py-10 text-center">
    <h1 class="text-3xl font-bold">
      20 Words
    </h1>
    <p class="mt-4 opacity-70">
      Add 20 vocab words a day, run them through a memorize board, then keep
      them fresh with FSRS flashcard practice.
    </p>

    <RouterLink
      to="/20-words/main"
      class="btn btn-primary mt-6"
    >
      Get started
    </RouterLink>
  </div>
</template>
