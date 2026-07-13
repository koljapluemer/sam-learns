<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { Network } from 'lucide-vue-next'
import { setAppLocale, useAppI18n, type AppLocale } from './i18n'

const ExercisePage = defineAsyncComponent(() => import('../pages/exercise/PageExercise.vue'))

const { locale, t } = useAppI18n()

const selectedLocale = computed({
  get: () => locale.value,
  set: (value: AppLocale) => setAppLocale(value)
})
</script>

<template>
  <div
    data-theme="light"
    class="flex min-h-screen w-full flex-col bg-base-100 text-base-content"
  >
    <nav class="navbar border-b border-base-300 bg-base-100/95 shadow-sm">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <Network
            :size="24"
            aria-hidden="true"
          />
          <span class="text-lg font-semibold">{{ t('app.title') }}</span>
        </div>
      </div>
      <label class="form-control">
        <span class="label py-1">
          <span class="label-text">{{ t('app.language') }}</span>
        </span>
        <select
          v-model="selectedLocale"
          class="select select-bordered select-sm"
          :aria-label="t('app.language')"
        >
          <option value="en">
            {{ t('locale.en') }}
          </option>
          <option value="de">
            {{ t('locale.de') }}
          </option>
        </select>
      </label>
    </nav>
    <main class="flex w-full flex-1 justify-center bg-base-200/40 px-4 py-8">
      <Suspense>
        <ExercisePage />
        <template #fallback>
          <div class="flex w-full max-w-xl items-center justify-center rounded-box border border-base-300 bg-base-100 p-10 text-sm text-base-content/70">
            {{ t('loading.label') }}
          </div>
        </template>
      </Suspense>
    </main>
  </div>
</template>
