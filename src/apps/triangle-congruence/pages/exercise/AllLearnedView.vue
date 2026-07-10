<script setup lang="ts">
import { Trophy } from 'lucide-vue-next'
import { useAppI18n } from '@/apps/triangle-congruence/app/i18n'

const { t } = useAppI18n()
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-16 text-center">
    <Trophy
      :size="48"
      class="text-warning"
      aria-hidden="true"
    />
    <h1 class="text-xl font-semibold">
      {{ t('allLearned.title') }}
    </h1>
    <p class="text-base-content/70">
      {{ t('allLearned.subtitle') }}
    </p>
  </div>
</template>
