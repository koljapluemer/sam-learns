<script setup lang="ts">
// Port of linguanodon's infinitesentences app/selectTargetLanguageApp.js.
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import LanguageSymbols from '../../app/elements/LanguageSymbols.vue'
import { loadLanguages, loadPairs } from '../../app/api'
import { createLanguagePreferencesStore } from '../../app/store'
import type { Language } from '../../app/types'

const route = useRoute()
const nativeIso = computed(() => (typeof route.params.nativeIso === 'string' ? route.params.nativeIso : ''))

const nativeLanguage = ref<Language | null>(null)
const targetLanguages = ref<Language[]>([])
const loading = ref(false)
const loadError = ref(false)

function targetLink(targetIso: string): void {
  createLanguagePreferencesStore().setLanguages(nativeIso.value, targetIso)
}

onMounted(async () => {
  try {
    loading.value = true
    loadError.value = false
    const [languages, pairs] = await Promise.all([loadLanguages(), loadPairs()])
    const languagesByCode = new Map(languages.map((language) => [language.code, language]))
    nativeLanguage.value = languagesByCode.get(nativeIso.value) ?? null

    const targetIsos = pairs.filter((pair) => pair.native === nativeIso.value).map((pair) => pair.target)
    targetLanguages.value = targetIsos
      .map((iso) => languagesByCode.get(iso))
      .filter((language): language is Language => Boolean(language))
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  } catch (error) {
    console.error('Failed to load languages:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto w-full p-4">
    <h1 class="text-3xl font-bold mb-6">
      Select Target Language
    </h1>

    <div
      v-if="nativeLanguage"
      class="mb-6"
    >
      <RouterLink
        :to="{ name: 'infinitesentences-select-native-language' }"
        class="opacity-70 hover:underline"
      >
        &larr; Change native language
      </RouterLink>
      <div class="mt-2">
        <span class="opacity-70">You speak: </span>
        <span class="font-semibold">{{ nativeLanguage.symbols[0] ?? '' }} {{ nativeLanguage.displayName }}</span>
      </div>
    </div>

    <div
      v-if="loading"
      class="alert"
    >
      Loading languages...
    </div>
    <div
      v-else-if="loadError"
      class="alert alert-warning"
    >
      Failed to load languages for this native language.
    </div>
    <div
      v-else-if="targetLanguages.length === 0"
      class="alert"
    >
      No target languages available for {{ nativeLanguage?.displayName ?? nativeIso }}.
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <RouterLink
        v-for="lang in targetLanguages"
        :key="lang.code"
        :to="{ name: 'infinitesentences-practice', params: { nativeIso, targetIso: lang.code } }"
        class="card shadow bg-white text-gray-700 hover:shadow-md cursor-pointer transition-shadow"
        @click="targetLink(lang.code)"
      >
        <div class="card-body gap-4 grid place-items-center text-center">
          <LanguageSymbols :symbols="lang.symbols" />
          <h2 class="text-2xl font-semibold">
            {{ lang.displayName }}
          </h2>
        </div>
      </RouterLink>
    </div>
  </div>
</template>
