<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getLanguageCatalog, type LanguageCatalogEntry } from '../../entities/language-catalog/languageCatalog'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'

const languages = ref<LanguageCatalogEntry[]>([])
const languageCode = useLocalSetting('the-little-prince.language-code', '')

onMounted(async () => {
  languages.value = await getLanguageCatalog()
})
</script>

<template>
  <section class="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-8">
    <h2 class="text-sm font-semibold uppercase tracking-[0.18em] opacity-60">
      This app
    </h2>
    <p class="text-sm opacity-70">
      Listening language
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
        {{ language.languageLongform }}
      </button>
      <p
        v-if="languages.length === 0"
        class="text-sm opacity-70"
      >
        No languages available yet.
      </p>
    </div>
  </section>
  <GeneralSettingsSection />
</template>
