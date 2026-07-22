<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-10">
    <h1 class="text-3xl font-bold text-center">
      Prepositions 3D
    </h1>
    <p class="mt-4 opacity-70 text-center">
      A 3D scene (WebXR or desktop) where you act out spatial prepositions with objects to learn them in context,
      with audio in your chosen language.
    </p>
    <div class="mt-8 flex justify-center">
      <RouterLink
        :to="{ name: 'prepositions3d-practice' }"
        class="btn btn-primary"
      >
        Start practicing
      </RouterLink>
    </div>
  </div>
</template>
