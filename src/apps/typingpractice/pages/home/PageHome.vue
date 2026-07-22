<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10 text-center">
    <h1 class="text-3xl font-bold">
      Vietnamese Typing Practice
    </h1>
    <p class="mt-4 opacity-70">
      Practice Vietnamese TELEX/VNI keyboard input.
    </p>
    <p class="mt-2 text-sm opacity-80">
      Type Vietnamese words shown on screen against a fixed word list,
      optionally using TELEX or VNI keystroke input (configurable in
      Settings) to practice composing diacritics.
    </p>
    <div class="mt-6">
      <RouterLink
        :to="{ name: 'typingpractice-practice' }"
        class="btn btn-primary"
      >
        Start practicing
      </RouterLink>
    </div>
  </div>
</template>
