<script setup lang="ts">
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import { listLanguageOptions } from '../../entities/tone-clip/languages/registry'

const languageCode = useLocalSetting('minimal-pairs-practice.language', '')
const hanziVisibility = useLocalSetting<'always' | 'after-answer' | 'never'>('minimal-pairs-practice.hanzi-visibility', 'always')
const languageOptions = listLanguageOptions()

const hanziVisibilityOptions: { value: 'always' | 'after-answer' | 'never'; label: string }[] = [
  { value: 'always', label: 'Always' },
  { value: 'after-answer', label: 'After answering' },
  { value: 'never', label: 'Never' }
]
</script>

<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8">
    <div class="flex flex-col gap-2">
      <h2 class="text-sm font-semibold uppercase tracking-[0.18em] opacity-60">
        Language
      </h2>
      <div class="flex flex-col gap-2">
        <button
          v-for="language in languageOptions"
          :key="language.code"
          type="button"
          class="btn justify-start"
          :class="languageCode === language.code ? 'btn-primary' : 'btn-outline'"
          @click="languageCode = language.code"
        >
          {{ language.name }}
        </button>
      </div>
    </div>

    <div
      v-if="languageCode === 'cmn'"
      class="flex flex-col gap-2"
    >
      <h2 class="text-sm font-semibold uppercase tracking-[0.18em] opacity-60">
        Show hanzi
      </h2>
      <div class="join">
        <button
          v-for="option in hanziVisibilityOptions"
          :key="option.value"
          type="button"
          class="btn join-item btn-sm"
          :class="hanziVisibility === option.value ? 'btn-primary' : 'btn-outline'"
          @click="hanziVisibility = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>
  </section>
  <GeneralSettingsSection />
</template>
