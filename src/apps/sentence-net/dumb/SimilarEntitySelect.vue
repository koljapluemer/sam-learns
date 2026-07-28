<script setup lang="ts">
defineProps<{
  modelValue: string
  candidates: { id: string; text: string; translation: string }[]
  fieldLabel: string
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'select-existing': [id: string]
  blur: []
}>()

function pick(candidate: { id: string; text: string }): void {
  emit('update:modelValue', candidate.text)
  emit('select-existing', candidate.id)
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
        @blur="emit('blur')"
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
          <span>{{ candidate.text }}</span>
          <span class="opacity-60">{{ candidate.translation }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>
