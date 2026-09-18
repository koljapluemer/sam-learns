<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import PracticeSetupModal from '@/shared/shell/PracticeSetupModal.vue'
import { listLanguageOptions } from '../../entities/tone-clip/languages/registry'
import PracticeRoundView from './PracticeRoundView.vue'

const languageCode = useLocalSetting('minimal-pairs-practice.language', '')
const hanziVisibility = useLocalSetting<'always' | 'after-answer' | 'never'>('minimal-pairs-practice.hanzi-visibility', 'always')
const setupOpen = ref(false)
const languageOptions = listLanguageOptions()

onMounted(() => {
  if (!languageCode.value) setupOpen.value = true
})

function selectLanguage(code: string) {
  languageCode.value = code
  setupOpen.value = false
}
</script>

<template>
  <PracticeRoundView
    v-if="languageCode && !setupOpen"
    :key="languageCode"
    :language-code="languageCode"
    :hanzi-visibility="hanziVisibility"
  />

  <PracticeSetupModal
    :open="setupOpen"
    :ready="!!languageCode"
    title="Choose a language"
    @close="setupOpen = false"
  >
    <div class="flex flex-col gap-2">
      <button
        v-for="language in languageOptions"
        :key="language.code"
        type="button"
        class="btn justify-start"
        :class="languageCode === language.code ? 'btn-primary' : 'btn-outline'"
        @click="selectLanguage(language.code)"
      >
        {{ language.name }}
      </button>
    </div>
  </PracticeSetupModal>
</template>
