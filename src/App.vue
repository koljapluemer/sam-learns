<script setup lang="ts">
import { computed, ref } from 'vue'
import { BarChart3, Home, Info, Settings } from 'lucide-vue-next'
import { DEFAULT_SHELL_STATE, shellState } from '@/shared/shell/shellState'
import SettingsPanel from '@/shared/settings/SettingsPanel.vue'
import InfoPanel from '@/shared/info/InfoPanel.vue'
import AppStatsPanel from '@/shared/stats/AppStatsPanel.vue'

const isSettingsOpen = ref(false)
const isInfoOpen = ref(false)
const isStatsOpen = ref(false)

const appName = computed(() => (shellState.title !== DEFAULT_SHELL_STATE.title ? shellState.title : ''))

const mainClass = computed(() =>
  shellState.layout === 'full-bleed'
    ? 'w-full min-h-screen'
    : 'flex w-full min-h-screen justify-center bg-base-200/40 px-4 pb-8 pt-20'
)
</script>

<template>
  <div class="min-h-screen w-full bg-base-100 text-base-content">
    <div class="fixed inset-x-0 top-0 z-50 flex items-start justify-between gap-2 p-3">
      <router-link
        :to="{ name: 'home' }"
        class="btn btn-ghost btn-sm gap-2 border border-base-300 bg-base-100/90 shadow-sm backdrop-blur"
        aria-label="Sam Learns Things home"
      >
        <Home
          :size="18"
          aria-hidden="true"
        />
        <span class="hidden sm:inline">Sam Learns<template v-if="appName"> | {{ appName }}</template></span>
      </router-link>

      <div class="flex items-center gap-1 rounded-box border border-base-300 bg-base-100/90 p-1 shadow-sm backdrop-blur">
        <router-link
          v-if="!shellState.stats"
          :to="{ name: 'stats' }"
          class="btn btn-ghost btn-sm gap-2"
          aria-label="Stats"
        >
          <BarChart3
            :size="18"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">Stats</span>
        </router-link>
        <button
          v-else
          type="button"
          class="btn btn-ghost btn-sm gap-2"
          aria-label="Stats"
          @click="isStatsOpen = true"
        >
          <BarChart3
            :size="18"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">Stats</span>
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm gap-2"
          aria-label="Settings"
          @click="isSettingsOpen = true"
        >
          <Settings
            :size="18"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">Settings</span>
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm gap-2"
          aria-label="Info"
          @click="isInfoOpen = true"
        >
          <Info
            :size="18"
            aria-hidden="true"
          />
          <span class="hidden sm:inline">Info</span>
        </button>
      </div>
    </div>

    <main :class="mainClass">
      <RouterView />
    </main>

    <SettingsPanel
      :is-open="isSettingsOpen"
      @close="isSettingsOpen = false"
    />
    <InfoPanel
      :is-open="isInfoOpen"
      @close="isInfoOpen = false"
    />
    <AppStatsPanel
      :is-open="isStatsOpen"
      @close="isStatsOpen = false"
    />
  </div>
</template>
