<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
    <h1 class="text-3xl font-bold">
      20 Words
    </h1>
    <p class="mt-4 opacity-70">
      Add 20 vocab words a day, memorize them via Leitner's Learning Patience, then keep
      them fresh with FSRS flashcard practice.
    </p>

    <RouterLink
      to="/20-words/main"
      class="btn btn-primary mt-6"
    >
      Get started
    </RouterLink>
</template>
