# TPR Board

A 3D interactive board for Total Physical Response (TPR) language learning:
listen to a spoken instruction, then drag objects on the board to act it out.

Imported from [linguanodon](https://github.com/koljapluemer/linguanodon)'s
`tprboard` Django app - see `docs/linguanodon-import.md` at the repo root for
how that import works and how to replicate it for other apps.

Content (`public/data/tprboard/languages.json`, `objects.json`,
`tasks/<locale>.json`, plus the `models/`, `audio/<locale>/`, and `img/`
asset folders) is a one-time export from linguanodon's sqlite3 database and
static files via `cms/tprboard/import_from_linguanodon.py`. Rerun that
script by hand if the upstream content changes - there's no ongoing sync.

## Libraries kept as-is

- **Three.js + GLTFLoader** for the 3D scene (`app/boardScene.ts`, a near-1:1
  port of linguanodon's `board-scene.js`), mounted imperatively in
  `PagePractice.vue`'s `onMounted`/disposed in `onUnmounted` - Three.js owns
  its own render loop independent of Vue's reactivity. Unlike the original
  (which had no local `three` package and so kept its THREE JSDoc typing
  loose), this port uses real `three` npm types throughout.
- **Ebisu** (Bayesian memory model, `app/ebisu.ts`) for per-object and
  per-sentence recall prediction - a different scheduling algorithm from the
  `ts-fsrs` used elsewhere in this repo (e.g. `world-map`, `boringwords`).
  linguanodon vendors a minified build rather than an npm package
  (`vendor/ebisu.min.mjs` + a hand-written `.d.ts`), so this port does too.
- **lucide-vue-next** replaces the original's CDN-loaded `window.lucide`
  global + hand-rolled `createLucideIcon` DOM builder - same icon set, real
  Vue components instead.

## What changed

- No accounts/sync: `mergeRemoteState`/`queueEvent`/`queueState`/
  `trackActiveTime`/`pullState` are all dropped. Per-object and per-sentence
  learning state lives in a Dexie db (`db/appDb.ts`, ported 1:1 from the
  original's raw-IndexedDB `learning.js` store) instead of IndexedDB +
  server sync; completed rounds are logged via `logActivity('tprboard')`.
- The round-planning/difficulty algorithm (`app/tasks.ts`) is untouched pure
  logic - a mechanical JSDoc->TS port, no behavior changes.
- Streak/played-time stats (`app/stats.ts`) are still plain localStorage,
  ported verbatim.
- `BoardScene` gained a `dispose()` method (not in the original, which only
  ever ran inside a full-page Django template and never unmounted) so
  navigating away in this SPA releases the WebGL context and stops the
  render loop cleanly.

## Verification notes

This is a 3D/WebGL app that can't be meaningfully verified without a
browser. `npm run lint`/`npm run typecheck`/`npm run build` all pass, and
the port was done by close side-by-side reading of the original JS, but
actual in-browser drag/drop/audio/scene behavior has not been manually
click-tested - do that before considering this app fully done.
