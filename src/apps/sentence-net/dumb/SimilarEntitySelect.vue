<script setup lang="ts">
defineProps<{
  modelValue: string
  candidates: { id: string; label: string }[]
  fieldLabel: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select-existing': [id: string, label: string]
}>()

function pick(candidate: { id: string; label: string }): void {
  emit('update:modelValue', candidate.label)
  emit('select-existing', candidate.id, candidate.label)
}
</script>

<template>
  <div class="relative w-full">
    <label class="input input-sm w-full">
      <span class="label w-20 text-xs">{{ fieldLabel }}</span>
      <input
        :value="modelValue"
        type="text"
        :placeholder="placeholder"
        class="grow font-bold"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      >
    </label>
    <ul
      v-if="candidates.length > 0"
      class="menu bg-base-100 rounded-box absolute z-10 mt-1 w-full shadow"
    >
      <li
        v-for="candidate in candidates"
        :key="candidate.id"
      >
        <button
          type="button"
          @mousedown.prevent="pick(candidate)"
        >
          {{ candidate.label }}
        </button>
      </li>
    </ul>
  </div>
</template>
