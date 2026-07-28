<script setup lang="ts">
// Ported from linguanodon's boring-words/home.html - a language picker with
// a random background photo behind it.
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { pickRandom } from '../../app/random'
import type { Background, BoringWordsLanguage } from '../../app/types'
import PageShell from '@/shared/shell/PageShell.vue'

const LANGUAGES: { code: BoringWordsLanguage; name: string }[] = [
  { code: 'vie', name: 'Vietnamese' },
  { code: 'arz', name: 'Egyptian Arabic' }
]

const backdrop = ref<Background | null>(null)

onMounted(async () => {
  try {
    const response = await fetch('/data/boringwords/backgrounds.json')
    if (!response.ok) return
    const backgrounds = (await response.json()) as Background[]
    backdrop.value = pickRandom(backgrounds) ?? null
  } catch {
    // non-critical - the page works fine with no backdrop
  }
})
</script>

<template>
  <div class="relative">
    <div
      v-if="backdrop"
      class="fixed inset-0 -z-10 bg-cover bg-center"
      :style="{ backgroundImage: `url(/data/boringwords/${backdrop.language}/${backdrop.filename}.webp)` }"
    />

    <PageShell title="Boring Words">
      <p class="text-center opacity-70">
        FSRS flashcards for the small, unglamorous function words that hold
        the language together.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <RouterLink
          v-for="language in LANGUAGES"
          :key="language.code"
          :to="`/boringwords/practice/${language.code}`"
          class="card glass shadow-xl flex-1 hover:shadow-2xl transition-shadow"
        >
          <div class="card-body items-center text-center">
            <h2 class="card-title">
              {{ language.name }}
            </h2>
          </div>
        </RouterLink>
      </div>
    </PageShell>
  </div>
</template>
