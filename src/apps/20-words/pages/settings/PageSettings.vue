<script setup lang="ts">
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'

const language = useLocalSetting<string>('20-words-language', '')
</script>

<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <h1 class="text-2xl font-semibold">
      Settings
    </h1>
    <label class="flex flex-col gap-1">
      <span class="text-sm font-medium">Language</span>
      <input
        v-model="language"
        type="text"
        placeholder="e.g. Spanish"
        class="input w-full"
      >
    </label>
  </section>
  <GeneralSettingsSection />
</template>
