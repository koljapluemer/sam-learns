<script setup lang="ts">
import type { Direction } from '../../entities/card/card'

defineProps<{
  image: string
  expressions: string[]
  direction: Direction
  revealed: boolean
}>()
</script>

<template>
  <div class="card w-full shadow-xl">
    <div
      class="card-body items-center gap-4 text-center"
      :class="{ 'flex-col-reverse': direction === 'w2i' }"
    >
      <img
        v-if="direction === 'i2w' || revealed"
        :src="image"
        alt=""
        class="max-h-48 object-contain"
      >
      <div
        v-if="revealed"
        class="divider my-0"
      />
      <div
        v-if="direction === 'w2i' || revealed"
        class="flex flex-col gap-2"
      >
        <p
          v-for="expression in expressions"
          :key="expression"
          class="text-2xl font-semibold"
        >
          {{ expression }}
        </p>
      </div>
    </div>
  </div>
</template>
