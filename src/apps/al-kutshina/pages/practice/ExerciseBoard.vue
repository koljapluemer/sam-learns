<script setup lang="ts">
import type { Field } from '../../entities/item/interaction'
import { usePointerDrag } from '../../dumb/usePointerDrag'
import ItemCard from './ItemCard.vue'

defineProps<{ fields: Field[] }>()

const emit = defineEmits<{ drop: [senderId: string, receiverId: string] }>()

const { draggingId, offset, bind } = usePointerDrag((senderId, receiverId) => emit('drop', senderId, receiverId))
</script>

<template>
  <div class="flex flex-wrap justify-center gap-2">
    <div
      v-for="field in fields"
      :key="field.id"
      class="size-24 sm:size-36"
    >
      <div
        v-if="field.img"
        :data-drop-id="field.id"
        class="size-full cursor-grab touch-none select-none"
        :class="{ 'relative z-10 cursor-grabbing': draggingId === field.id }"
        :style="draggingId === field.id ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined"
        v-bind="bind(field.id)"
      >
        <ItemCard :field="field" />
      </div>
    </div>
  </div>
</template>
