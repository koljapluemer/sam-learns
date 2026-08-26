<script setup lang="ts">
import { onMounted, ref } from 'vue'
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import { getLanguages, type VocabLanguage } from '../../entities/vocab/vocab'

const languageCode = useLocalSetting('top-vocab.language', '')
const languages = ref<VocabLanguage[]>([])

onMounted(async () => {
  languages.value = await getLanguages()
})
</script>

<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <h2 class="text-sm font-semibold uppercase tracking-[0.18em] opacity-60">
      This app
    </h2>
    <p class="text-sm opacity-70">
      Language
    </p>
    <div class="flex flex-col gap-2">
      <button
        v-for="language in languages"
        :key="language.code"
        type="button"
        class="btn justify-start"
        :class="languageCode === language.code ? 'btn-primary' : 'btn-outline'"
        @click="languageCode = language.code"
      >
        {{ language.name }}
      </button>
    </div>
  </section>
  <GeneralSettingsSection />
</template>
