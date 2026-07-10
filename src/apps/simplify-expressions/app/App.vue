<script setup lang="ts">
import { computed, defineAsyncComponent, ref } from 'vue'
import { Calculator } from 'lucide-vue-next'
import { setAppLocale, useAppI18n, type AppLocale } from './i18n'

const TutorPage = defineAsyncComponent(() => import('../pages/tutor/PageTutor.vue'))
const AppFeedbackModal = defineAsyncComponent(() => import('./feedback/AppFeedbackModal.vue'))

const { locale, t } = useAppI18n()
const isFeedbackModalOpen = ref(false)

const selectedLocale = computed({
  get: () => locale.value,
  set: (value: AppLocale) => setAppLocale(value)
})

function openFeedbackModal() {
  isFeedbackModalOpen.value = true
}

function closeFeedbackModal() {
  isFeedbackModalOpen.value = false
}
</script>

<template>
  <div
    data-theme="light"
    class="flex min-h-screen w-full flex-col bg-base-100 text-base-content"
  >
    <nav class="navbar border-b border-base-300 bg-base-100/95 shadow-sm">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <Calculator
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
          <option value="de">
            {{ t('locale.de') }}
          </option>
          <option value="en">
            {{ t('locale.en') }}
          </option>
        </select>
      </label>
    </nav>
    <main class="flex w-full flex-1 justify-center bg-base-200/40 px-4 py-8">
      <Suspense>
        <TutorPage />
        <template #fallback>
          <div class="flex w-full max-w-xl items-center justify-center rounded-box border border-base-300 bg-base-100 p-10 text-sm text-base-content/70">
            {{ t('tutor.loadingLabel') }}
          </div>
        </template>
      </Suspense>
    </main>
    <footer class="border-t border-base-300 bg-base-100 px-4 py-4">
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-sm text-base-content/70">
          {{ t('app.footerNote') }}
        </p>
        <button
          class="btn btn-ghost btn-sm self-start sm:self-auto"
          type="button"
          @click="openFeedbackModal"
        >
          {{ t('app.feedback') }}
        </button>
      </div>
    </footer>
    <AppFeedbackModal
      v-if="isFeedbackModalOpen"
      :is-open="isFeedbackModalOpen"
      @close="closeFeedbackModal"
    />
  </div>
</template>
