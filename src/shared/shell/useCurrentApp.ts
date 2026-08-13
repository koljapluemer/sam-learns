import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { apps } from '@/appRegistry'

export function useCurrentApp() {
  const route = useRoute()
  const appSlug = computed(() => (typeof route.meta.appSlug === 'string' ? route.meta.appSlug : ''))
  return computed(() => apps.find((candidate) => candidate.slug === appSlug.value))
}
