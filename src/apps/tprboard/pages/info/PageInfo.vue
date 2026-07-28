<script setup lang="ts">
// Ported from linguanodon's tpr-board/home.html.
import { RouterLink } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
</script>

<template>
  <PageShell title="TPR Board">
    <div class="text-center">
      <p class="opacity-70">
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
  </PageShell>
</template>
