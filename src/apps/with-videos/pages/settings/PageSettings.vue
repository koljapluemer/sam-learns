<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getLanguages, type Language } from '../../entities/video/video'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'
import LanguagePicker from '../../dumb/LanguagePicker.vue'

const languages = ref<Language[]>([])
const languageCode = useLocalSetting('with-videos.language-code', '')

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
      Video language
    </p>
    <LanguagePicker
      v-model="languageCode"
      :languages="languages"
    />
  </section>
  <GeneralSettingsSection />
</template>
