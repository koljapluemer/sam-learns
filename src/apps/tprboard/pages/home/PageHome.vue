<script setup lang="ts">
// Ported from linguanodon's tpr-board/home.html.
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10 text-center">
    <h1 class="text-3xl font-bold">
      TPR Board
    </h1>
    <p class="mt-4 opacity-70">
      Listen to a spoken instruction, then drag objects on a 3D board to act it out - a Total Physical Response game
      for learning vocabulary through actions and relationships between objects.
    </p>
    <RouterLink
      :to="{ name: 'tprboard-practice' }"
      class="btn btn-primary mt-6"
    >
      Play
    </RouterLink>
  </div>
</template>
