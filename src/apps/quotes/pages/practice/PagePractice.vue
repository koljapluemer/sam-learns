<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { List, Quote } from 'lucide-vue-next'
import { useActiveTime } from '@/shared/activity/useActiveTime'
import BottomDock, { type DockItem } from '@/shared/shell/BottomDock.vue'
import PracticeQueueView from './PracticeQueueView.vue'
import QuoteListView from './QuoteListView.vue'

useActiveTime('quotes')

type View = 'practice' | 'manage'

const view = ref<View>('practice')
const quoteListViewRef = ref<InstanceType<typeof QuoteListView> | null>(null)

const items: DockItem[] = [
  { key: 'practice', icon: Quote, label: 'Practice' },
  { key: 'manage', icon: List, label: 'Quotes' }
]

async function goToManage(): Promise<void> {
  view.value = 'manage'
  await nextTick()
  quoteListViewRef.value?.openAdd()
}
</script>

<template>
  <div class="pb-24">
    <PracticeQueueView
      v-if="view === 'practice'"
      @go-to-manage="goToManage"
    />
    <QuoteListView
      v-else
      ref="quoteListViewRef"
    />

    <BottomDock
      :model-value="view"
      :items="items"
      @update:model-value="(next) => (view = next as View)"
    />
  </div>
</template>
