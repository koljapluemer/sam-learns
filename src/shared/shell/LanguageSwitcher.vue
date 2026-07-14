<script setup lang="ts">
import { computed } from 'vue'
import { shellState } from './shellState'
import { preferredLocale, setPreferredLocale } from '@/shared/i18n/preferredLocale'

const showSwitcher = computed(() => shellState.locales.length > 1)

const selectedLocale = computed({
  get: () => preferredLocale.value,
  set: (value: string) => setPreferredLocale(value)
})
</script>

<template>
  <select
    v-if="showSwitcher"
    v-model="selectedLocale"
    class="select select-bordered select-sm"
    aria-label="Language"
  >
    <option
      v-for="locale in shellState.locales"
      :key="locale"
      :value="locale"
    >
      {{ locale.toUpperCase() }}
    </option>
  </select>
</template>
