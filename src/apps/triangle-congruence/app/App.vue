<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { Triangle } from 'lucide-vue-next'
import { locales, useAppI18n } from './i18n'
import { useAppShell } from '@/shared/shell/shellState'

const ExercisePage = defineAsyncComponent(() => import('../pages/exercise/PageExercise.vue'))

const { t } = useAppI18n()

useAppShell(() => ({ title: t('app.title'), icon: Triangle, layout: 'contained', locales }))
</script>

<template>
  <Suspense>
    <ExercisePage />
    <template #fallback>
      <div class="flex w-full max-w-xl items-center justify-center rounded-box border border-base-300 bg-base-100 p-10 text-sm text-base-content/70">
        {{ t('loading.label') }}
      </div>
    </template>
  </Suspense>
</template>
