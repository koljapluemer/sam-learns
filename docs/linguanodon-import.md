# Importing apps from linguanodon

This repo is absorbing practice apps from the `linguanodon` Django project
(sibling checkout, `../linguanodon`). linguanodon has real users/accounts and
per-app SQLite databases with ongoing Django-admin curation; this repo has
none of that - every app here is a static Vue SPA with per-browser Dexie/
localStorage state and no server. Importing an app means re-platforming it,
not just moving files. This doc is the recipe, plus a running checklist so
each import is a mechanical repeat of the last.

## Decisions already made (don't re-litigate these per app)

- **No accounts, no sync.** Drop every call to linguanodon's
  `/static/tracking/js/client.js` (`queueEvent`/`queueState`/`trackActiveTime`).
  Progress lives entirely in this app's own Dexie db or `localStorage`, same
  as every other app in this repo.
- **One-time export, not ongoing curation.** linguanodon curates content via
  Django admin; we just snapshot it. Re-run the export script by hand later
  if upstream content changes - there's no sync and no local curation UI.
- **Keep the app's own logic and libraries.** If linguanodon's version uses a
  bespoke SM-2-ish scheduler, or Ebisu, or whatever - port that logic
  unchanged. Only the JS shell (JSDoc vanilla JS, raw IndexedDB, Django
  templating) gets rewritten, not the algorithms.
- **Assets go straight into `public/`** or the app's `meta/` folder. No CDN/
  LFS concerns for now.

## The recipe

1. **Classify the app.** Read linguanodon's `<slug>/models.py`,
   `views.py`, `urls.py`, and `static/<slug>/js/`:
   - Does it have a real Django model/SQLite table (DB-backed), or is its
     content just a JSON/data file already (no-DB)?
   - How many real pages does it have (home/practice/stats/settings/custom)?
     Check `core/apps_registry.py`'s `AppInfo` entry for which of
     `practice_url_name`/`stats_url_name`/`settings_url_name` are set, plus
     `urls.py` for anything extra.
   - What JS libraries/algorithms does it depend on (ts-fsrs, Ebisu, a
     bespoke scheduler, a 3D engine, etc.)?

2. **Export the content** (skip this step entirely if there's no DB):
   - New file `cms/<slug>/import_from_linguanodon.py` - stdlib `sqlite3`,
     no Django needed since it's just reading linguanodon's sqlite3 file
     directly. Opens `../linguanodon/<slug>.sqlite3`, dumps the relevant
     table(s) to `public/data/<slug>/*.json`. Mark it clearly as one-time/
     manual in the docstring (see `cms/arabicnumbers/import_from_linguanodon.py`
     for the template).
   - No-DB apps (e.g. typingpractice): just copy the existing JSON straight
     into `public/data/<slug>/`.
   - Run it, and sanity-check the row count and a couple of values against
     the sqlite source (`sqlite3 ../linguanodon/<slug>.sqlite3 "SELECT ..."`).

3. **Scaffold the app folder** under `src/apps/<slug>/`, following the
   convention used by `world-map`/`simplify-expressions`/`arabicnumbers`:
   - `app/` - composables and pure logic ported from linguanodon's
     `static/<slug>/js/app/*.js`
   - `db/appDb.ts` - Dexie db, if the app has per-item progress state
     (mirrors linguanodon's raw-IndexedDB stores, e.g. compare
     `src/apps/arabicnumbers/db/appDb.ts` to linguanodon's `js/app/idb.js`)
   - `pages/<name>/Page<Name>.vue` - one folder per route (see §4 below)
   - `meta/logo.webp` + `meta/screenshot.webp` - see step 5
   - `README.md` - short pointer back to this doc + what was/wasn't ported

4. **Port the JS to TS/Vue.** linguanodon's JS is already `// @ts-check`
   vanilla JS with JSDoc, often with its own `types.d.ts` - this is most of
   the way to real TS already:
   - Copy `types.d.ts` content into `app/types.ts`, dropping any ambient
     `window.Vue` typings (those only existed because that build had no real
     Vue import).
   - Port pure functions/composables near-verbatim - same algorithm, same
     variable names where reasonable, just typed.
   - Replace raw `indexedDB.open(...)` calls with a Dexie `db/appDb.ts`.
   - Replace `queueEvent(slug, 'trial', ...)` / `trackActiveTime(slug)` with
     `logActivity(slug)` from `src/shared/activity/useLearningEvent.ts`. Drop
     `queueState(...)` and any `mergeRemoteState` reconciliation entirely.
   - Where the original fetched from a Django API endpoint
     (`config.apiXUrl`), fetch straight from the exported
     `/data/<slug>/....json` instead.
   - Vue templates in linguanodon's JS (e.g. `practiceApp.js`'s `template:`
     string) are usually already real Vue syntax - closer to a copy-paste
     into a `<template>` block than a rewrite.

5. **Wire routes into `src/appRegistry.ts`:**
   ```ts
   {
     slug: '<slug>',
     name: '...',
     description: '...',
     routes: [
       { path: '', component: () => import('./apps/<slug>/pages/home/PageHome.vue'), meta: {...} },
       { path: 'practice', component: () => import('./apps/<slug>/pages/practice/PagePractice.vue'), meta: {...} },
       // 'stats' / 'settings' / any custom path, same shape, only if the app has one
     ],
     credits: '...' // optional, trusted HTML - only if linguanodon's registry had a footer_html
   }
   ```
   `routes[].path: ''` is the home page and must resolve at `/<slug>` - see
   `src/router.ts` for how this is turned into real nested routes
   (`AppRouteLayout` + `AppSubnav`). The home route's name is always exactly
   `<slug>` (required by `src/Home.vue`'s card links) and other routes are
   named `<slug>-<path>` - you don't need to set this yourself, the router
   derives it from `routes[].path`.

   Apps with no sub-pages at all don't need this new shape - the legacy
   `component:` flat shape (used by all 6 pre-existing apps) still works
   and nothing forces a migration to `routes`.

6. **Generate branding assets:**
   - `meta/screenshot.webp` - copy directly from linguanodon's
     `static/<slug>/branding/screenshot.webp`.
   - `meta/logo.webp` - linguanodon's badge logos are SVG
     (`static/<slug>/branding/favicon.svg`); convert with
     `rsvg-convert -w 256 -h 256 favicon.svg -o /tmp/logo.png && cwebp -q 90 /tmp/logo.png -o meta/logo.webp`.
   - Run `cd cms && uv run python favicons/generate_favicons.py` to produce
     `public/favicons/<slug>.ico` automatically from `meta/logo.webp`.

7. **Verify:**
   - `npm run lint` - eslint (not type-aware, but catches unused vars/syntax
     issues) - should introduce zero new errors.
   - `npm run typecheck` - real Vue-SFC-aware type-checking (`vue-tsc -b`).
     As of this writing there are pre-existing unrelated errors in a handful
     of files this import didn't touch (simplify-expressions' `.test.ts`
     files missing vitest types, a couple of CSS side-effect imports, two
     `Card | CardInput` strictness gaps in world-map/entity-relation-intuition's
     schedulers) - don't fix those as a side effect of an app import; just
     confirm you introduced zero *new* ones.
   - `npm run build` - should complete cleanly.
   - `npm run dev` - click through every route the app registered
     (`/<slug>`, `/<slug>/practice`, etc.), confirm the tab bar/subnav shows
     the right pages, confirm progress persists across a reload (Dexie/
     localStorage), and spot-check the exported JSON against the sqlite
     source.

## A note on `npm run typecheck`

This project's `typescript` devDependency is aliased to the classic,
JS-based compiler (`@typescript/typescript6`) rather than the new native
TypeScript 7 compiler, because Vue's tooling (`vue-tsc`) doesn't support
native TypeScript yet ([tracking issue](https://github.com/vuejs/language-tools/issues/5381)).
This is the TypeScript team's own recommended transitional setup, not a
one-off hack - see the "Announcing TypeScript 7.0" devblog post. Don't
"fix" this by pointing `typescript` at `@typescript/native` or removing the
alias; that will silently break `npm run typecheck` again.

## Apps imported so far

| Slug | Source app | DB? | Routes | Notes |
|---|---|---|---|---|
| `arabicnumbers` | `arabicnumbers` | Yes (1 table, 101 rows) | home, practice | SM-2-ish custom scheduler, kept as-is |
| `typingpractice` | `typingpractice` | No (`data/vie.json`) | home, practice, settings | TELEX/VNI keystroke decomposition ported as pure functions; settings moved onto `useLocalSetting` instead of a bespoke localStorage key |

## Remaining linguanodon apps (not yet imported)

`boringwords`, `comprehensible_input`, `egyptiansentences`, `hebrewscript`,
`prepositions3d`, `saetze`, `tprboard`, `viettonepractice`, `infinitesentences`.

Rough complexity notes for whoever picks these up next:

- **saetze, egyptiansentences** - similar shape to arabicnumbers (DB-backed,
  no stats/settings pages), likely the next easiest.
- **hebrewscript, viettonepractice** - have a `stats` page (good next
  practice for the stats-route piece of `routes`) but ship a lot of audio
  (opus files) - fine per the "assets in `public/` " decision, just note
  the added repo weight.
- **boringwords** - DB-backed with real photos, `practice_url_name` is
  `None` in linguanodon's registry (worth checking why before assuming a
  standard practice page).
- **comprehensible_input** - video browsing, has an `extra_nav` page
  (beyond home/practice/stats/settings) - a good test of the "custom path"
  support in `routes`.
- **tprboard, prepositions3d** - explicitly deferred (3D rendering, Ebisu
  scheduling, large audio/model assets) - expect more effort than the rest.
- **infinitesentences** - explicitly deferred - has the most pages (native/
  target language selection + practice + stats + settings) and the largest
  sqlite3 (22MB), plus its own `queueEvent`/`queueState` sync usage to strip.
