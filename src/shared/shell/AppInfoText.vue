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
      <a href="https://koljasam.com" target="_blank" rel="noopener noreferrer" class="link">Kolja Sam</a>.
    </p>
    <p>
      If you want to see more like this in the future, you can kindly <a href="https://ko-fi.com/S6S81CWUVD" class="link">support my work on ko-fi</a>.
    </p>
    <p>
      I'm using the privacy-friendly
      <a href="https://www.goatcounter.com" target="_blank" rel="noopener noreferrer" class="link">Goatcounter</a> to
      track page views and I store some pseudonymous learning data. No
      personal data is collected, and cookies are used solely for tracking your learning progress/settings on your
      device.
    </p>
    <p>
      This whole thing is <a href="https://github.com/koljapluemer/sam-learns-things" target="_blank" rel="noopener noreferrer"
        class="link">open source</a>.
    </p>
    <p>
      If you have any feedback, suggestions or ideas, please email me: contact(at)koljasam.com
    </p>
    <p v-if="app?.credits" v-html="app.credits" />
  </div>
</template>
