<script setup lang="ts">
import { computed } from 'vue'
import { apps } from '@/appRegistry'
import { useCurrentApp } from '@/shared/shell/useCurrentApp'

// Defaults to the current route's app; pass `appSlug` to show a specific app's
// credits from a route that isn't itself scoped to that app (e.g. /info).
const props = defineProps<{ appSlug?: string }>()

const currentApp = useCurrentApp()
const app = computed(() =>
  props.appSlug ? apps.find((candidate) => candidate.slug === props.appSlug) : currentApp.value
)
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
      device. 
      <br>This app is
      <a
        href="https://github.com/koljapluemer/sam-learns-things"
        target="_blank"
        rel="noopener noreferrer"
        class="link"
      >open source</a>. <br>If you have any feedback, you can email me at contact(at)koljasam.com
    </p>
    <p
      v-if="app?.credits"
      v-html="app.credits"
    />
  </div>
</template>
