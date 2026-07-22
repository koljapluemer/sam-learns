# Script Practice (Hebrew)

Listen to a short audio clip and pick the Hebrew script that matches what
you heard, building letter recognition by ear.

Imported from [linguanodon](https://github.com/koljapluemer/linguanodon)'s
`hebrewscript` Django app - see `docs/linguanodon-import.md` at the repo root
for how that import works and how to replicate it for other apps.

Content (`public/data/hebrewscript/clips.json` + `public/data/hebrewscript/audio/*.opus`,
2252 clips/audio files) is a one-time export from linguanodon's sqlite3
database plus its static audio files via
`cms/hebrewscript/import_from_linguanodon.py`. Rerun that script by hand if
the upstream content changes - there's no ongoing sync.

Practice-round selection (strategy A/B pair-undertraining heuristics) and the
decayed-Bayesian confusion-matrix stats are ported unchanged from
linguanodon's `app/session.js`/`app/stats.js`. Progress lives in this app's
own Dexie db (`practiceEvents`) instead of raw IndexedDB - no accounts/sync.
