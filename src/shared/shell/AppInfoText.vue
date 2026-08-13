<script setup lang="ts">
import { useCurrentApp } from '@/shared/shell/useCurrentApp'

const app = useCurrentApp()
</script>

<template>
  <div class="flex flex-col gap-2 text-sm">
    <p>
      Made with ♥ by
      <a
        href="https://koljasam.com"
        target="_blank"
        rel="noopener noreferrer"
        class="link"
      >Kolja Sam</a>.
    </p>
    <p>
      I'm using the privacy-friendly
      <a
        href="https://www.goatcounter.com"
        target="_blank"
        rel="noopener noreferrer"
        class="link"
      >Goatcounter</a> to track page views and I store some pseudonymous learning data. No
      personal data is collected, and cookies are used solely for tracking your learning progress on your
      device. This app is
      <a
        href="https://github.com/koljapluemer/sam-learns-things"
        target="_blank"
        rel="noopener noreferrer"
        class="link"
      >open source</a>.
    </p>
    <p
      v-if="app?.credits"
      v-html="app.credits"
    />
  </div>
</template>
