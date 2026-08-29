<script setup lang="ts">
// Gate: the main route needs a listening language before the player can run.
// Missing/invalid -> the standard setup modal; otherwise the play loop.
import { onMounted, ref } from 'vue'
import { getLanguageCatalog, type LanguageCatalogEntry } from '../../entities/language-catalog/languageCatalog'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import PracticeSetupModal from '@/shared/shell/PracticeSetupModal.vue'
import PlayLoop from './PlayLoop.vue'

const languageCode = useLocalSetting('the-little-prince.language-code', '')
const languages = ref<LanguageCatalogEntry[]>([])
const setupOpen = ref(false)
const started = ref(false)

onMounted(async () => {
  languages.value = await getLanguageCatalog()
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
    start-label="Start listening"
    @close="start"
  >
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
  </PracticeSetupModal>
</template>
