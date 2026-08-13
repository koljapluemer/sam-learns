<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getLanguageCatalog, type LanguageCatalogEntry } from '../../entities/language-catalog/languageCatalog'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import PageShell from '@/shared/shell/PageShell.vue'
import AppInfoText from '@/shared/shell/AppInfoText.vue'

const router = useRouter()
const languages = ref<LanguageCatalogEntry[]>([])
const languageCode = useLocalSetting('the-little-prince.language-code', '')

function startListening(): void {
  if (!languageCode.value) return
  router.push({ name: 'the-little-prince-play' })
}

onMounted(async () => {
  languages.value = await getLanguageCatalog()
  if (!languages.value.some((language) => language.code === languageCode.value)) {
    languageCode.value = ''
  }
})
</script>

<template>
  <PageShell title="The Little Prince">
    <p class="opacity-70">
      Listen to a segment of a translated "The Little Prince" audiobook, practice its vocab, then
      rewatch - repeat segment by segment through the book.
    </p>

    <div class="flex flex-col gap-2">
      <label
        for="language-select"
        class="text-sm font-medium opacity-80"
      >
        Language to listen to
      </label>
      <select
        id="language-select"
        v-model="languageCode"
        class="select select-bordered w-full"
      >
        <option
          value=""
          disabled
        >
          Choose a language
        </option>
        <option
          v-for="language in languages"
          :key="language.code"
          :value="language.code"
        >
          {{ language.languageLongform }}
        </option>
      </select>
      <p
        v-if="languages.length === 0"
        class="text-sm opacity-70"
      >
        No languages available yet.
      </p>
    </div>

    <button
      type="button"
      class="btn btn-primary self-start"
      :disabled="!languageCode"
      @click="startListening"
    >
      Start listening
    </button>

    <hr class="border-base-300">
    <AppInfoText />
  </PageShell>
</template>
