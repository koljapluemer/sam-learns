<script setup lang="ts">
import type { Field } from '../../entities/item/interaction'
import { usePointerDrag } from '../../dumb/usePointerDrag'
import ItemCard from './ItemCard.vue'
import type { CardStatus } from './useExerciseRound'

const props = defineProps<{ fields: Field[]; statuses: Record<string, CardStatus>; locked: boolean }>()

const emit = defineEmits<{ drop: [senderId: string, receiverId: string] }>()

const DEAL_STAGGER_MS = 60

const { draggingId, lastDraggedId, overId, offset, bind } = usePointerDrag((senderId, receiverId) =>
  emit('drop', senderId, receiverId)
)

// While dragging, the offset follows the pointer directly; afterwards,
// `translate` transitions, so the card glides back into its slot.
function dragClass(id: string) {
  if (draggingId.value === id) {
    return 'z-10 scale-110 rotate-2 cursor-grabbing shadow-2xl transition-[scale,rotate,box-shadow] duration-150'
  }
  return [
    'transition-[translate,scale,rotate,box-shadow] duration-200',
    { 'z-10': lastDraggedId.value === id, 'cursor-grab': !props.locked }
  ]
}
</script>

<template>
  <div
    class="mx-auto grid w-full max-w-[max(16rem,calc((100dvh_-_17rem)*2/3))] grid-cols-2 gap-3 sm:max-w-[min(42rem,max(24rem,calc((100dvh_-_17rem)*3/2)))] sm:grid-cols-3"
  >
    <div
      v-for="(field, index) in fields"
      :key="field.id"
      class="relative aspect-square rounded-box border-2 border-dashed border-base-300"
    >
      <!-- Deals in staggered on mount; also runs when a card vanishes or comes back -->
      <Transition
        appear
        appear-active-class="transition delay-(--deal-delay) duration-300 ease-out"
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="scale-50 opacity-0"
        leave-active-class="transition duration-300 ease-in"
        leave-to-class="scale-50 opacity-0"
      >
        <div
          v-if="field.img"
          class="absolute inset-0"
          :style="{ '--deal-delay': `${index * DEAL_STAGGER_MS}ms` }"
        >
          <div
            :data-drop-id="field.id"
            class="relative size-full touch-none rounded-box ease-out select-none"
            :class="dragClass(field.id)"
            :style="draggingId === field.id ? { translate: `${offset.x}px ${offset.y}px` } : undefined"
            v-bind="locked ? {} : bind(field.id)"
          >
            <ItemCard
              :field="field"
              :status="overId === field.id ? 'target' : statuses[field.id]"
            />
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>
