<script setup lang="ts">
import ThemeToggle from '@/shared/theme/ThemeToggle.vue'
</script>

<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <h2 class="text-sm font-semibold uppercase tracking-[0.18em] opacity-60">
      General
    </h2>
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">Theme</span>
      <ThemeToggle />
    </div>
  </section>
</template>
