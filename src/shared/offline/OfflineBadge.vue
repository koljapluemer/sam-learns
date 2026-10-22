<script setup lang="ts">
import { WifiOff } from 'lucide-vue-next'
import { isOnline } from './useOnline'
</script>

<template>
  <span
    v-if="!isOnline"
    class="badge badge-warning gap-1"
  >
    <WifiOff
      :size="14"
      aria-hidden="true"
    />
    Offline
  </span>
</template>
