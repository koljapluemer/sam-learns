<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'
import { Calculator } from 'lucide-vue-next'
import { locales, useAppI18n } from './i18n'
import { useAppShell } from '@/shared/shell/shellState'

const TutorPage = defineAsyncComponent(() => import('../pages/tutor/PageTutor.vue'))
const AppFeedbackModal = defineAsyncComponent(() => import('./feedback/AppFeedbackModal.vue'))

const { t } = useAppI18n()
const isFeedbackModalOpen = ref(false)

useAppShell(() => ({ title: t('app.title'), icon: Calculator, layout: 'full-bleed', locales }))

function openFeedbackModal() {
  isFeedbackModalOpen.value = true
}

function closeFeedbackModal() {
  isFeedbackModalOpen.value = false
}
</script>

<template>
  <div class="flex w-full flex-1 flex-col">
    <div class="flex w-full flex-1 justify-center bg-base-200/40 px-4 py-8">
      <Suspense>
        <TutorPage />
        <template #fallback>
          <div class="flex w-full max-w-xl items-center justify-center rounded-box border border-base-300 bg-base-100 p-10 text-sm text-base-content/70">
            {{ t('tutor.loadingLabel') }}
          </div>
        </template>
      </Suspense>
    </div>
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
