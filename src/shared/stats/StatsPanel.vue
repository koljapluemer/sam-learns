<script setup lang="ts">
defineProps<{
  stats: { label: string; value: string | number }[]
}>()
</script>

<template>
  <div class="stats stats-vertical sm:stats-horizontal shadow">
    <div
      v-for="stat in stats"
      :key="stat.label"
      class="stat"
    >
      <div class="stat-title">
        {{ stat.label }}
      </div>
      <div class="stat-value text-2xl">
        {{ stat.value }}
      </div>
    </div>
  </div>
</template>
