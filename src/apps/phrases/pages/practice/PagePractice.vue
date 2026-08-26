<script setup lang="ts">
import { useActiveTime } from '@/shared/activity/useActiveTime'
import PracticeQueueView from './PracticeQueueView.vue'

useActiveTime('phrases')
</script>

<template>
  <PracticeQueueView />
</template>
