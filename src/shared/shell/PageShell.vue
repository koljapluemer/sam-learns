<script setup lang="ts">
// Shared wrapper for an app's Info/Stats pages - one consistent width,
// padding and title style, so per-app pages only own their content.
defineProps<{ title: string }>()
</script>

<template>
  <div class="mx-auto flex w-full max-w-4xl flex-col gap-8 p-4">
    <h1 class="text-2xl font-semibold">
      {{ title }}
    </h1>
    <slot />
  </div>
</template>
