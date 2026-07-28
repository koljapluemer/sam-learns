<script setup lang="ts">
import { Brain, Layers, List, PlusCircle } from 'lucide-vue-next'

export type PlayView = 'queue' | 'sentences' | 'words'

defineProps<{ modelValue: PlayView }>()
const emit = defineEmits<{ 'update:modelValue': [view: PlayView]; 'add-sentence': [] }>()

const items: { key: PlayView | 'add-sentence'; icon: typeof Brain; label: string }[] = [
  { key: 'queue', icon: Brain, label: 'Queue' },
  { key: 'add-sentence', icon: PlusCircle, label: 'Add sentence' },
  { key: 'sentences', icon: List, label: 'Sentences' },
  { key: 'words', icon: Layers, label: 'Vocab' }
]

function select(key: PlayView | 'add-sentence'): void {
  if (key === 'add-sentence') {
    emit('add-sentence')
  } else {
    emit('update:modelValue', key)
  }
}
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 z-40 flex justify-center gap-2 p-4 sm:gap-4">
    <button
      v-for="item in items"
      :key="item.key"
      type="button"
      class="btn btn-circle shadow-lg sm:btn-lg"
      :class="item.key === modelValue ? 'btn-primary' : 'btn-outline bg-base-100'"
      :aria-label="item.label"
      :aria-pressed="item.key === modelValue"
      @click="select(item.key)"
    >
      <component :is="item.icon" />
    </button>
  </div>
</template>
