<script setup lang="ts">
// Gate: the main route needs a language before the player can run.
// Missing/invalid -> the standard setup modal; otherwise the play loop.
import { onMounted, ref } from 'vue'
import { getLanguages, type Language } from '../../entities/video/video'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import PracticeSetupModal from '@/shared/shell/PracticeSetupModal.vue'
import LanguagePicker from '../../dumb/LanguagePicker.vue'
import PlayLoop from './PlayLoop.vue'

const languageCode = useLocalSetting('with-videos.language-code', '')
const languages = ref<Language[]>([])
const setupOpen = ref(false)
const started = ref(false)

onMounted(async () => {
  languages.value = await getLanguages()
  if (languages.value.some((language) => language.code === languageCode.value)) {
    started.value = true
  } else {
    languageCode.value = ''
    setupOpen.value = true
  }
})

function start(): void {
  setupOpen.value = false
  started.value = true
}
</script>

<template>
  <PlayLoop v-if="started" />

  <PracticeSetupModal
    :open="setupOpen"
    :ready="!!languageCode"
    title="Choose a language"
    start-label="Start watching"
    @close="start"
  >
    <LanguagePicker
      v-model="languageCode"
      :languages="languages"
    />
  </PracticeSetupModal>
</template>
