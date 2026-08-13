<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
import AppInfoText from '@/shared/shell/AppInfoText.vue'
</script>

<template>
  <PageShell title="Prepositions 3D">
    <p class="opacity-70 text-center">
      A 3D scene (WebXR or desktop) where you act out spatial prepositions with objects to learn them in context,
      with audio in your chosen language.
    </p>
    <div class="flex justify-center">
      <RouterLink
        :to="{ name: 'prepositions3d-practice' }"
        class="btn btn-primary"
      >
        Start practicing
      </RouterLink>
    </div>

    <hr class="border-base-300">
    <AppInfoText />
  </PageShell>
</template>
