<script setup lang="ts">
import { ref } from 'vue'
import { Brain, Layers, List, PlusCircle } from 'lucide-vue-next'
import BottomDock, { type DockItem } from '@/shared/shell/BottomDock.vue'
import MainAddView from './MainAddView.vue'
import MainMemorizeView from './MainMemorizeView.vue'
import MainPracticeView from './MainPracticeView.vue'
import MainManageView from './MainManageView.vue'
import { useActiveTime } from '@/shared/activity/useActiveTime'

export type MainView = 'add' | 'memorize' | 'practice' | 'manage'

useActiveTime('20-words')
const view = ref<MainView>('add')

const items: DockItem[] = [
  { key: 'add', icon: PlusCircle, label: 'Add' },
  { key: 'memorize', icon: Layers, label: 'Memorize' },
  { key: 'practice', icon: Brain, label: 'Practice' },
  { key: 'manage', icon: List, label: 'Manage words' }
]
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

    <BottomDock
      :model-value="view"
      :items="items"
      @update:model-value="view = $event as MainView"
    />
  </div>
</template>
