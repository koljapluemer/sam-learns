<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useActiveTime } from '@/shared/activity/useActiveTime'
import { useLocalSetting } from '@/shared/settings/useLocalSetting'
import PracticeCardView from './PracticeCardView.vue'

const router = useRouter()
const languageCode = useLocalSetting('top-vocab.language', '')

useActiveTime('top-vocab')
</script>

<template>
  <PracticeCardView
    v-if="languageCode"
    :key="languageCode"
    :language-code="languageCode"
  />
  <div
    v-else
    class="flex flex-col items-center gap-4 px-4 py-16 text-center"
  >
    <p class="opacity-70">
      Pick a language in settings to start.
    </p>
    <button
      type="button"
      class="btn btn-primary"
      @click="router.push({ name: 'top-vocab-settings' })"
    >
      Go to settings
    </button>
  </div>
</template>
