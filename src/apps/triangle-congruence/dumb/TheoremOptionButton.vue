<script setup lang="ts">
defineProps<{
  title: string
  explanation?: string
  selected: boolean
  isCorrect: boolean | null
  disabled: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="card border p-4 text-left transition"
    :class="[
      isCorrect === true ? 'border-success bg-success/10' : '',
      isCorrect === false && selected ? 'border-error bg-error/10' : '',
      isCorrect === null ? 'border-base-300 bg-base-100 hover:-translate-y-0.5 hover:shadow-md' : ''
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <span class="font-semibold">{{ title }}</span>
    <span
      v-if="explanation"
      class="mt-1 block text-sm text-base-content/70"
    >{{ explanation }}</span>
  </button>
</template>
