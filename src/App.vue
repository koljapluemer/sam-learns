<script setup lang="ts">
import { computed, ref } from 'vue'
import { Info, Settings } from 'lucide-vue-next'
import { shellState } from '@/shared/shell/shellState'
import ThemeToggle from '@/shared/theme/ThemeToggle.vue'
import LanguageSwitcher from '@/shared/shell/LanguageSwitcher.vue'
import SettingsPanel from '@/shared/settings/SettingsPanel.vue'
import InfoPanel from '@/shared/info/InfoPanel.vue'

const isSettingsOpen = ref(false)
const isInfoOpen = ref(false)

const mainClass = computed(() =>
  shellState.layout === 'full-bleed'
    ? 'flex w-full flex-1'
    : 'flex w-full flex-1 justify-center bg-base-200/40 px-4 py-8'
)
</script>

<template>
  <div class="flex min-h-screen w-full flex-col bg-base-100 text-base-content">
    <nav class="navbar border-b border-base-300 bg-base-100/95 shadow-sm">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <component
            :is="shellState.icon"
            v-if="shellState.icon"
            :size="22"
            aria-hidden="true"
          />
          <span class="text-lg font-semibold">{{ shellState.title }}</span>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <router-link
          class="btn btn-ghost btn-sm"
          :to="{ name: 'home' }"
        >
          Home
        </router-link>
        <router-link
          class="btn btn-ghost btn-sm"
          :to="{ name: 'stats' }"
        >
          Stats
        </router-link>
        <LanguageSwitcher />
        <ThemeToggle />
        <button
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          aria-label="Settings"
          @click="isSettingsOpen = true"
        >
          <Settings
            :size="18"
            aria-hidden="true"
          />
        </button>
        <button
          v-if="shellState.about"
          type="button"
          class="btn btn-ghost btn-circle btn-sm"
          aria-label="About this app"
          @click="isInfoOpen = true"
        >
          <Info
            :size="18"
            aria-hidden="true"
          />
        </button>
      </div>
    </nav>

    <main :class="mainClass">
      <RouterView />
    </main>

    <footer class="p-4 flex flex-col items-center gap-4 text-center text-xs text-base-content/70">
      <p class="flex flex-row gap-4 items-center">
        <span>
          Made with ♥ by <a
            href="https://koljapluemer.com"
            target="_blank"
            rel="noopener noreferrer"
            class="link"
          >Kolja
            Sam</a>
        </span>
        <a
          href="https://ko-fi.com/S6S81CWUVD"
          target="_blank"
        ><img
          height="36"
          style="border:0px;height:36px;"
          src="https://storage.ko-fi.com/cdn/kofi4.png?v=6"
          border="0"
          alt="Buy Me a Coffee at ko-fi.com"
        ></a>
      </p>

      <p class="max-w-md">
        I'm using the privacy-friendly <a
          href="https://www.goatcounter.com"
          target="_blank"
          rel="noopener noreferrer"
          class="link"
        >Goatcounter</a> to track page views and an I store some pseudonymous learning data. No personal
        data is collected, and cookies are used solely for tracking your learning progress on your device. This app is
        <a
          href="https://github.com/koljapluemer/sam-learns-things"
          target="_blank"
          rel="noopener noreferrer"
          class="link"
        >open source</a>.
      </p>
    </footer>

    <SettingsPanel
      :is-open="isSettingsOpen"
      @close="isSettingsOpen = false"
    />
    <InfoPanel
      :is-open="isInfoOpen"
      @close="isInfoOpen = false"
    />
  </div>
</template>
