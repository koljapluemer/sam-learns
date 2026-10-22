<script setup lang="ts">
import { WifiOff } from 'lucide-vue-next'

defineProps<{ message: string }>()
</script>

<template>
  <div
    role="alert"
    class="alert alert-warning h-fit w-fit"
  >
    <WifiOff
      :size="18"
      aria-hidden="true"
    />
    <span>{{ message }}</span>
  </div>
</template>
