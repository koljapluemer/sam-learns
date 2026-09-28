<script setup lang="ts">
import { imageUrl } from '../../entities/item/item'
import type { Field } from '../../entities/item/interaction'

defineProps<{ field: Field }>()
</script>

<template>
  <div class="card relative size-full bg-base-100 shadow-md">
    <img
      :src="imageUrl(field.img)"
      alt=""
      draggable="false"
      class="absolute inset-0 m-auto max-h-[97%] max-w-[97%] object-contain"
    >
    <img
      v-if="field.overlayImg"
      :src="imageUrl(field.overlayImg)"
      alt=""
      draggable="false"
      class="absolute inset-0 m-auto max-h-[57%] max-w-[57%] object-contain"
    >
  </div>
</template>
