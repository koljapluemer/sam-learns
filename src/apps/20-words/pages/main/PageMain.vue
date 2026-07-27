<script setup lang="ts">
import { ref } from 'vue'
import MainDock, { type MainView } from './MainDock.vue'
import MainAddView from './MainAddView.vue'
import MainMemorizeView from './MainMemorizeView.vue'
import MainPracticeView from './MainPracticeView.vue'
import MainManageView from './MainManageView.vue'
import { useActiveTime } from '@/shared/activity/useActiveTime'

useActiveTime('20-words')
const view = ref<MainView>('add')
</script>

<template>
  <div class="pb-24">
    <MainAddView
      v-if="view === 'add'"
      @switch-view="view = $event"
    />
    <MainMemorizeView
      v-else-if="view === 'memorize'"
      @switch-view="view = $event"
    />
    <MainPracticeView
      v-else-if="view === 'practice'"
      @switch-view="view = $event"
    />
    <MainManageView v-else />

    <MainDock v-model="view" />
  </div>
</template>
