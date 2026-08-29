- register in app-registry
- use @agents.md, do not write a bespoke one

## Nav tab pattern

Every app has exactly three routes: `''`, `stats`, and `settings`. `''` is the
practice/play screen the user lands on straight from the overview - the top nav
labels it "Practice" with a play icon. There are no info/landing/tutorial
pages. Don't hand-roll nav ordering/labels; `App.vue`'s tabs computed derives
them from the registry entry.

If practice genuinely can't start until the user sets something (usually the
target language), don't add a route for it - gate the `''` page behind
`@/shared/shell/PracticeSetupModal.vue`. Render the modal when the required
setting is missing, put every such setting in its default slot, pass
`:ready` = "all required settings are filled in", and start practice on
`@close`. Persist the setting with `useLocalSetting` so returning users skip
the modal. See `top-vocab`/`the-little-prince`/`infinitesentences` for the
pattern (thin gate component that renders the real practice component only
once ready).

## Page shell

Stats pages should wrap their content in `<PageShell title="...">` (from
`@/shared/shell/PageShell.vue`) instead of a bespoke wrapper div - it owns the
width, padding and title heading so pages don't diverge on `max-w`/spacing.

## Stats

Every app must define, in its registry entry, what counts as a "trial" (`stats.trialLabel`) - a short human phrase like "exercises answered" or "cards flipped". This shows up in the global stats legend.

- **Trials**: call `logActivity(appSlug)` (from `@/shared/activity/useLearningEvent`) once per trial.
- **Time**: for the common case ("is the user here and active"), call the `useActiveTime(appSlug)` composable (from `@/shared/activity/useActiveTime`) from the setup of the app's main/practice page - it handles idle/focus/visibility detection and reports to the shared activity log automatically. If the app has a more meaningful notion of time (video/audio watched), track that yourself and report it with `logActiveTimeMs(appSlug, ms)` instead.
- **PageStats.vue**: render the app's own numeric stats/charts first (use `StatsPanel` from `@/shared/stats/StatsPanel.vue` for simple numeric stats), then `<GlobalStatsSection />` (from `@/shared/stats/GlobalStatsSection.vue`) at the bottom - one column, app stats above global stats, always in that order.

## Data

There's one physical Dexie(+Cloud) database for the whole repo,
`src/shared/db/db.ts` - Dexie Cloud syncs at the database level, so every
app's data has to live in that one instance for one login to cover
everything. Your app's own `db/appDb.ts` stays as a thin shim onto it:

1. Add your tables to the `version(1).stores({...})` schema in
   `src/shared/db/db.ts`, prefixed with your app's slug
   (`<appSlug>_<tableName>`, e.g. `quotes_quotes`) - other apps have already
   picked plain names like `learningEvents` or `topicProgress` for unrelated
   data, so the prefix avoids collisions.
2. In `db/appDb.ts`, export an `appDb` object mapping your local table names
   onto those shared, prefixed tables via `db.table<Row, 'pk'>(name)`:
   ```ts
   import { db } from '@/shared/db/db'

   export type QuoteRow = { id: string; content: string }

   export const appDb = {
     quotes: db.table<QuoteRow, 'id'>('quotes_quotes')
   }
   ```
   Every other file in your app keeps calling `appDb.<table>.add/get/where(...)`
   exactly as if it owned its own database.
3. Primary keys must be app-generated strings - `crypto.randomUUID()` is the
   repo-wide convention. Never use Dexie's `++id` auto-increment; Dexie Cloud
   requires globally unique string keys.
4. If you need a raw multi-table transaction, import `db` from
   `@/shared/db/db` and call `db.transaction(...)` (not `appDb.transaction`,
   which doesn't exist - `appDb` is a plain object, not a Dexie instance).
5. Data is private to the signed-in user by default - no realm/access-control
   config needed for the normal "each user only sees their own data" case.
