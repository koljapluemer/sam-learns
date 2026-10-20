<script setup lang="ts">
defineProps<{
  languages: { code: string; name: string }[]
}>()

const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="flex flex-col gap-2">
    <button
      v-for="language in languages"
      :key="language.code"
      type="button"
      class="btn justify-start"
      :class="model === language.code ? 'btn-primary' : 'btn-outline'"
      @click="model = language.code"
    >
      {{ language.name }}
    </button>
    <p
      v-if="languages.length === 0"
      class="text-sm opacity-70"
    >
      No languages available yet.
    </p>
  </div>
</template>
