<script setup lang="ts">
// Gate for the main route: the practice loop needs a native + target language
// pair. Missing -> the standard setup modal (both picks in one go); set ->
// the practice loop.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { createLanguagePreferencesStore } from '../../app/store'
import { loadLanguages, loadPairs } from '../../app/api'
import PracticeSetupModal from '@/shared/shell/PracticeSetupModal.vue'
import PracticeLoop from './PracticeLoop.vue'
import type { Language, LanguagePair } from '../../app/types'

const store = createLanguagePreferencesStore()
// Settings' "Change languages" link lands here with ?setup=1 to force the
// modal open even when a pair is already set.
const forceSetup = useRoute().query.setup === '1'

const nativeIso = ref(store.nativeIso ?? '')
const targetIso = ref(store.targetIso ?? '')
const started = ref(store.hasLanguagesSet && !forceSetup)
const setupOpen = ref(!store.hasLanguagesSet || forceSetup)

const languages = ref<Language[]>([])
const pairs = ref<LanguagePair[]>([])

const nativeOptions = computed(() =>
  languages.value.filter((language) => language.isNative).sort((a, b) => a.displayName.localeCompare(b.displayName))
)
const targetOptions = computed(() => {
  const codes = new Set(pairs.value.filter((pair) => pair.native === nativeIso.value).map((pair) => pair.target))
  return languages.value
    .filter((language) => codes.has(language.code))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
})

const ready = computed(() => Boolean(nativeIso.value && targetIso.value))

onMounted(async () => {
  try {
    const [langs, prs] = await Promise.all([loadLanguages(), loadPairs()])
    languages.value = langs
    pairs.value = prs
  } catch (error) {
    console.warn('Failed to load languages:', error)
  }
})

function onNativeChange(): void {
  if (!targetOptions.value.some((language) => language.code === targetIso.value)) targetIso.value = ''
}

function start(): void {
  if (!ready.value) return
  store.setLanguages(nativeIso.value, targetIso.value)
  setupOpen.value = false
  started.value = true
}
</script>

<template>
  <PracticeLoop
    v-if="started"
    :key="`${nativeIso}-${targetIso}`"
    :native-iso="nativeIso"
    :target-iso="targetIso"
  />

  <PracticeSetupModal
    :open="setupOpen"
    :ready="ready"
    title="Choose your languages"
    start-label="Start learning"
    @close="start"
  >
    <div class="flex flex-col gap-1">
      <label
        for="native-lang"
        class="text-sm font-medium opacity-80"
      >I speak</label>
      <select
        id="native-lang"
        v-model="nativeIso"
        class="select select-bordered w-full"
        @change="onNativeChange"
      >
        <option
          value=""
          disabled
        >
          Choose a language
        </option>
        <option
          v-for="lang in nativeOptions"
          :key="lang.code"
          :value="lang.code"
        >
          {{ lang.displayName }}
        </option>
      </select>
    </div>

    <div class="flex flex-col gap-1">
      <label
        for="target-lang"
        class="text-sm font-medium opacity-80"
      >I want to learn</label>
      <select
        id="target-lang"
        v-model="targetIso"
        class="select select-bordered w-full"
        :disabled="!nativeIso"
      >
        <option
          value=""
          disabled
        >
          Choose a language
        </option>
        <option
          v-for="lang in targetOptions"
          :key="lang.code"
          :value="lang.code"
        >
          {{ lang.displayName }}
        </option>
      </select>
      <p
        v-if="nativeIso && targetOptions.length === 0"
        class="text-sm opacity-70"
      >
        No languages available for this pair yet.
      </p>
    </div>
  </PracticeSetupModal>
</template>
