<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10 text-center">
    <h1 class="text-3xl font-bold">
      Arabic Numbers Practice
    </h1>
    <p class="mt-4 opacity-70">
      Learn to read the Arabic numbers from 0 to 100.
    </p>
    <p class="mt-2 text-sm opacity-80">
      You'll see an Arabic numeral or spoken number and pick its value from a
      set of choices, working through 0-100 with spaced repetition tracking
      your progress in the browser.
    </p>
    <div class="mt-6">
      <RouterLink
        :to="{ name: 'arabicnumbers-practice' }"
        class="btn btn-primary"
      >
        Start practicing
      </RouterLink>
    </div>
  </div>
</template>
