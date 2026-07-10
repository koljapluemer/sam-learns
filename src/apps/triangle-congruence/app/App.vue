<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { Triangle } from 'lucide-vue-next'
import { useAppI18n } from './i18n'

const ExercisePage = defineAsyncComponent(() => import('../pages/exercise/PageExercise.vue'))

const { t } = useAppI18n()
</script>

<template>
  <div
    data-theme="light"
    class="flex min-h-screen w-full flex-col bg-base-100 text-base-content"
  >
    <nav class="navbar border-b border-base-300 bg-base-100/95 shadow-sm">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <Triangle
            :size="24"
            aria-hidden="true"
          />
          <span class="text-lg font-semibold">{{ t('app.title') }}</span>
        </div>
      </div>
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
