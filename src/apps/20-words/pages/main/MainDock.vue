<script setup lang="ts">
import { Brain, Layers, PlusCircle } from 'lucide-vue-next'

export type MainView = 'add' | 'memorize' | 'practice'

defineProps<{ modelValue: MainView }>()
const emit = defineEmits<{ 'update:modelValue': [view: MainView] }>()

const items: { view: MainView; icon: typeof PlusCircle; label: string }[] = [
  { view: 'add', icon: PlusCircle, label: 'Add' },
  { view: 'memorize', icon: Layers, label: 'Memorize' },
  { view: 'practice', icon: Brain, label: 'Practice' }
]
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-4 p-4">
    <button
      v-for="item in items"
      :key="item.view"
      type="button"
      class="btn btn-circle btn-lg shadow-lg"
      :class="modelValue === item.view ? 'btn-primary' : 'btn-outline bg-base-100'"
      :aria-label="item.label"
      :aria-pressed="modelValue === item.view"
      @click="emit('update:modelValue', item.view)"
    >
      <component :is="item.icon" />
    </button>
  </div>
</template>
