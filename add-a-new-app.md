- register in app-registry
- use @agents.md, do not write a bespoke one

## Nav tab pattern

Every app gets `stats` and `settings` pages, plus its own primary practice/play route(s). If an app has a dedicated practice/play route, give its `''` route an info/tutorial page named `pages/info/PageInfo.vue` - the top nav automatically pushes it to the back of the tab bar, labeled "Info", so it never collides with the global nav's own "Home" link. If the app has no separate practice route (the whole app lives at `''`), skip the info page - the top nav keeps `''` up front, labeled "Play", instead. Don't hand-roll nav ordering/labels; `App.vue`'s tabs computed derives this from the registry entry.

## Page shell

Info and Stats pages should wrap their content in `<PageShell title="...">` (from `@/shared/shell/PageShell.vue`) instead of a bespoke wrapper div - it owns the width, padding and title heading so pages don't diverge on `max-w`/spacing.

## Stats

Every app must define, in its registry entry, what counts as a "trial" (`stats.trialLabel`) - a short human phrase like "exercises answered" or "cards flipped". This shows up in the global stats legend.

- **Trials**: call `logActivity(appSlug)` (from `@/shared/activity/useLearningEvent`) once per trial.
- **Time**: for the common case ("is the user here and active"), call the `useActiveTime(appSlug)` composable (from `@/shared/activity/useActiveTime`) from the setup of the app's main/practice page - it handles idle/focus/visibility detection and reports to the shared activity log automatically. If the app has a more meaningful notion of time (video/audio watched), track that yourself and report it with `logActiveTimeMs(appSlug, ms)` instead.
- **PageStats.vue**: render the app's own numeric stats/charts first (use `StatsPanel` from `@/shared/stats/StatsPanel.vue` for simple numeric stats), then `<GlobalStatsSection />` (from `@/shared/stats/GlobalStatsSection.vue`) at the bottom - one column, app stats above global stats, always in that order.