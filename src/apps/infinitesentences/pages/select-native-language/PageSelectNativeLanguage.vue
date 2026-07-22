<script setup lang="ts">
// Port of linguanodon's infinitesentences app/selectNativeLanguageApp.js.
// A transient onboarding step, like comprehensible-input's videos page - no
// subnav tab for it (see appRegistry's route label/skip conventions).
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import LanguageSymbols from '../../app/elements/LanguageSymbols.vue'
import { loadLanguages } from '../../app/api'
import { createLanguagePreferencesStore } from '../../app/store'
import type { Language } from '../../app/types'

const router = useRouter()

const nativeLanguages = ref<Language[]>([])
const loading = ref(false)
const loadError = ref(false)

function selectNativeLanguage(iso: string): void {
  createLanguagePreferencesStore().clearLanguages()
  void router.push({ name: 'infinitesentences-select-target-language', params: { nativeIso: iso } })
}

onMounted(async () => {
  try {
    loading.value = true
    const languages = await loadLanguages()
    nativeLanguages.value = languages
      .filter((language) => language.isNative)
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  } catch (error) {
    console.error('Failed to load native languages:', error)
    loadError.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto w-full p-4">
    <h1 class="text-3xl font-bold mb-6">
      Select Your Native Language
    </h1>

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
      Failed to load languages.
    </div>

    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <button
        v-for="lang in nativeLanguages"
        :key="lang.code"
        class="card shadow bg-white text-gray-700 hover:shadow-md cursor-pointer transition-shadow"
        type="button"
        @click="selectNativeLanguage(lang.code)"
      >
        <div class="card-body gap-4 grid place-items-center text-center">
          <LanguageSymbols :symbols="lang.symbols" />
          <h2 class="text-2xl font-semibold">
            {{ lang.displayName }}
          </h2>
        </div>
      </button>
    </div>
  </div>
</template>
