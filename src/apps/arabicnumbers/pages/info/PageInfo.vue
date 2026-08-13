<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
import AppInfoText from '@/shared/shell/AppInfoText.vue'
</script>

<template>
  <PageShell title="Arabic Numbers Practice">
    <div class="text-center">
      <p class="opacity-70">
        Learn to read the Arabic numbers from 0 to 100.
      </p>
      <p class="mt-2 text-sm opacity-80">
        You'll see an Arabic numeral or spoken number and pick its value from a
        set of choices, working through 0-100 with spaced repetition tracking
        your progress in the browser.
      </p>
      <div class="mt-6">
        <RouterLink
          :to="{ name: 'arabicnumbers-practice' }"
          class="btn btn-primary"
        >
          Start practicing
        </RouterLink>
      </div>
    </div>

    <hr class="border-base-300">
    <AppInfoText />
  </PageShell>
</template>
