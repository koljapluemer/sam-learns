# Infinite Sentences

Learn a language word-by-word then sentence-by-sentence: memorize/recall/
understand individual vocab parts, then a final "challenge" pass on the
whole sentence once all its parts are known.

Imported from [linguanodon](https://github.com/koljapluemer/linguanodon)'s
`infinitesentences` Django app - see `docs/linguanodon-import.md` at the repo
root for how that import works and how to replicate it for other apps. This
was the largest/most complex remaining app (35 languages, 44 language pairs,
7609 sentences, 55848 sentence-parts, from a 22MB sqlite3 database).

Content is a one-time export from linguanodon's sqlite3 database via
`cms/infinitesentences/import_from_linguanodon.py`, producing
`public/data/infinitesentences/languages.json`, `pairs.json`, and one
`sentences/<native>-<target>.json` file per language pair (rather than one
huge blob, since the original served sentences one at a time from a JSON
API keyed by pair+index - a practice session here only ever fetches its own
pair's file).

No Dexie db: like the original (localStorage-backed Pinia-alike stores),
all progress (FSRS gloss cards, learned sentences, daily counts, language/
goal preferences) lives in a few `useLocalSetting` keys
(`infinitesentences.*`) instead of IndexedDB - see `app/store.ts`. FSRS
scheduling uses the real `ts-fsrs` package (same as `world-map`/
`boringwords`), not linguanodon's vendored `fsrs.js` copy.

Routes: home (landing) → `select-native-language` → `select-target-language/
:nativeIso` → `practice/:nativeIso/:targetIso`, plus standalone `stats` and
`settings`. The two language-selection steps are transient onboarding (like
`comprehensible-input`'s videos page) and don't show up as subnav tabs, same
as the dynamic-param practice route (mirrors linguanodon's own precedent).

The four practice task types (`app/tasks/{Memorize,Recall,Understand,
Challenge}Task.vue`) and their shared `app/elements/` (IndexCard,
InteractionButtonRow, ShowInstruction, LanguageSymbols) are ported from
linguanodon's JS near-verbatim. `InteractionButtonRow` uses this repo's
`lucide-vue-next` icon components directly instead of the original's
raw-SVG-via-`v-html` lucide CDN workaround. The stats page's goal-line
annotation (originally `chartjs-plugin-annotation`, not a dependency here)
is simplified to a plain text caption next to the chart.
