<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useActiveTime } from '@/shared/activity/useActiveTime'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import PracticeSetupModal from '@/shared/shell/PracticeSetupModal.vue'
import { getLanguages, type VocabLanguage } from '../../entities/vocab/vocab'
import PracticeCardView from './PracticeCardView.vue'

const languageCode = useLocalSetting('top-vocab.language', '')
const languages = ref<VocabLanguage[]>([])
const setupOpen = ref(false)

useActiveTime('top-vocab')

onMounted(async () => {
  languages.value = await getLanguages()
  if (!languageCode.value) setupOpen.value = true
})
</script>

<template>
  <PracticeCardView
    v-if="languageCode && !setupOpen"
    :key="languageCode"
    :language-code="languageCode"
  />

  <PracticeSetupModal
    :open="setupOpen"
    :ready="!!languageCode"
    title="Choose a language"
    @close="setupOpen = false"
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
        {{ language.name }}
      </button>
    </div>
  </PracticeSetupModal>
</template>
