<script setup lang="ts">
import { useActiveTime } from '@/shared/activity/useActiveTime'
import PracticeSession from './PracticeSession.vue'

useActiveTime('ancient-greek-alphabet')
</script>

<template>
  <PracticeSession />
</template>
