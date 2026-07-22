<script setup lang="ts">
defineProps<{ content: string }>()
</script>

<template>
  <p class="text-center text-xl mb-4">
    {{ content }}
  </p>
</template>
