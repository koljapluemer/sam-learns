<script setup lang="ts">
// Port of linguanodon's infinitesentences app/settingsApp.js.
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createLanguagePreferencesStore, createUserSettingsStore } from '../../app/store'
import { loadLanguages } from '../../app/api'
import GeneralSettingsSection from '@/shared/settings/GeneralSettingsSection.vue'

const router = useRouter()
const userSettingsStore = createUserSettingsStore()
const languageStore = createLanguagePreferencesStore()

const dailyGoal = ref(userSettingsStore.dailySentenceGoal)
const nativeLabel = ref('')
const targetLabel = ref('')
const hasLanguagesSet = ref(languageStore.hasLanguagesSet)

watch(dailyGoal, (value) => {
  userSettingsStore.setDailySentenceGoal(value)
})

onMounted(async () => {
  if (!languageStore.hasLanguagesSet) return
  try {
    const languages = await loadLanguages()
    const native = languages.find((language) => language.code === languageStore.nativeIso)
    const target = languages.find((language) => language.code === languageStore.targetIso)
    nativeLabel.value = native?.symbols[0] || native?.displayName || languageStore.nativeIso || ''
    targetLabel.value = target?.symbols[0] || target?.displayName || languageStore.targetIso || ''
  } catch (error) {
    console.warn('Failed to load language display info:', error)
  }
})

function changeNativeLanguage(): void {
  languageStore.clearLanguages()
  void router.push({ name: 'infinitesentences-select-native-language' })
}

function changeTargetLanguage(): void {
  if (!languageStore.nativeIso) return
  void router.push({
    name: 'infinitesentences-select-target-language',
    params: { nativeIso: languageStore.nativeIso }
  })
}
</script>

<template>
  <div class="max-w-md mx-auto w-full p-4">
    <fieldset class="fieldset">
      <label
        for="daily-goal"
        class="label"
      >Daily sentence goal</label>
      <input
        id="daily-goal"
        v-model.number="dailyGoal"
        type="number"
        name="daily-goal"
        class="input"
        min="1"
        placeholder="10"
      >
    </fieldset>

    <div
      v-if="hasLanguagesSet"
      class="mt-6"
    >
      <h2 class="text-xl font-semibold mb-3">
        Languages
      </h2>
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="opacity-70">Native language</span>
          <button
            class="link"
            type="button"
            @click="changeNativeLanguage"
          >
            {{ nativeLabel }}
          </button>
        </div>
        <div class="flex items-center justify-between">
          <span class="opacity-70">Target language</span>
          <button
            class="link"
            type="button"
            @click="changeTargetLanguage"
          >
            {{ targetLabel }}
          </button>
        </div>
      </div>
    </div>
  </div>
  <GeneralSettingsSection />
</template>
