- register in app-registry
- use @agents.md, do not write a bespoke one

## Stats

Every app must define, in its registry entry, what counts as a "trial" (`stats.trialLabel`) - a short human phrase like "exercises answered" or "cards flipped". This shows up in the global stats legend.

- **Trials**: call `logActivity(appSlug)` (from `@/shared/activity/useLearningEvent`) once per trial.
- **Time**: for the common case ("is the user here and active"), call the `useActiveTime(appSlug)` composable (from `@/shared/activity/useActiveTime`) from the setup of the app's main/practice page - it handles idle/focus/visibility detection and reports to the shared activity log automatically. If the app has a more meaningful notion of time (video/audio watched), track that yourself and report it with `logActiveTimeMs(appSlug, ms)` instead.
- **PageStats.vue**: render the app's own numeric stats/charts first (use `StatsPanel` from `@/shared/stats/StatsPanel.vue` for simple numeric stats), then `<GlobalStatsSection />` (from `@/shared/stats/GlobalStatsSection.vue`) at the bottom - one column, app stats above global stats, always in that order.