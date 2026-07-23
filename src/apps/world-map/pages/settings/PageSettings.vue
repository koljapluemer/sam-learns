<script setup lang="ts">
import LanguageSwitcher from '@/shared/shell/LanguageSwitcher.vue'
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'
</script>

<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <h2 class="text-sm font-semibold uppercase tracking-[0.18em] opacity-60">
      This app
    </h2>
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium">Language</span>
      <LanguageSwitcher />
    </div>
  </section>
  <GeneralSettingsSection />
</template>
