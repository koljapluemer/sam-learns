<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import PageShell from '@/shared/shell/PageShell.vue'
import AppInfoText from '@/shared/shell/AppInfoText.vue'

// Full-page version of the dismissable info footer: global credits/privacy
// text plus the credits of the app passed via `?app=<slug>`.
const route = useRoute()
const appSlug = computed(() => (typeof route.query.app === 'string' ? route.query.app : undefined))
</script>

<template>
  <PageShell title="Info">
    <AppInfoText :app-slug="appSlug" />
  </PageShell>
</template>
