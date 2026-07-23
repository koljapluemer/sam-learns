<script setup lang="ts">
// Port of linguanodon's tprboard settings-page.js. Uses this repo's shared
// useLocalSetting instead of the original's bespoke localStorage key, kept
// in sync with PagePractice.vue's language modal via the same setting key.
import { onMounted, ref } from 'vue'
import { loadLanguageOptions } from '../../app/data'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'
import type { LanguageOption } from '../../app/types'

const selectedLanguageCode = useLocalSetting<string | null>('tprboard-language-code', null)
const languageOptions = ref<LanguageOption[]>([])
const loading = ref(true)
const loadError = ref('')

onMounted(async () => {
  try {
    languageOptions.value = await loadLanguageOptions()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Could not load languages.'
  } finally {
    loading.value = false
  }
})

function selectLanguage(code: string): void {
  selectedLanguageCode.value = code
}
</script>

<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-4 py-8 px-4">
    <h1 class="text-2xl font-semibold">
      Settings
    </h1>
    <div>
      <h2 class="mb-2 text-sm font-semibold uppercase tracking-[0.18em] opacity-60">
        Language
      </h2>
      <p class="mb-3 text-sm opacity-70">
        {{
          languageOptions.find((option) => option.code === selectedLanguageCode)
            ? `Current: ${languageOptions.find((option) => option.code === selectedLanguageCode)?.name}`
            : 'No language selected yet.'
        }}
      </p>

      <div
        v-if="loading"
        class="mt-2"
      >
        <span class="loading loading-spinner" />
      </div>
      <div
        v-else-if="loadError"
        class="alert alert-error"
      >
        <span>{{ loadError }}</span>
      </div>
      <div
        v-else
        class="flex flex-col gap-2"
      >
        <button
          v-for="option in languageOptions"
          :key="option.code"
          type="button"
          class="btn min-h-16 w-full justify-between px-4"
          :class="selectedLanguageCode === option.code ? 'btn-primary' : 'btn-outline'"
          @click="selectLanguage(option.code)"
        >
          <span class="text-left text-base font-medium">{{ option.name }}</span>
          <span class="rounded-full bg-base-200 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-60">{{ option.code }}</span>
        </button>
      </div>
    </div>
  </section>
  <GeneralSettingsSection />
</template>
