import { apps } from '@/appRegistry'

// Stable per-app color, keyed by registry position rather than insertion
// order into a chart - so a given app always gets the same color across the
// trials and time-spent charts (and across renders as the app list grows).
export function colorForAppSlug(slug: string): string {
  const index = Math.max(
    apps.findIndex((app) => app.slug === slug),
    0
  )
  const hue = (index * 360) / apps.length
  return `hsl(${hue % 360}, 70%, 50%)`
}
