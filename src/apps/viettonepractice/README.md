# Vietnamese Tone Practice

Listen to a short audio clip and identify which of Vietnamese's six tones you
heard, training your ear for tone distinctions.

Imported from [linguanodon](https://github.com/koljapluemer/linguanodon)'s
`viettonepractice` Django app - see `docs/linguanodon-import.md` at the repo
root for how that import works and how to replicate it for other apps.

Content (`public/data/viettonepractice/clips.json` + the 1000 audio clips
under `public/data/viettonepractice/audio/`) is a one-time export from
linguanodon's sqlite3 database via
`cms/viettonepractice/import_from_linguanodon.py`. Rerun that script by hand
if the upstream content changes - there's no ongoing sync.

Practice events (round starts, answers, audio-listened durations, hidden
clips) are stored in this app's own Dexie db (`db/appDb.ts`) instead of
raw IndexedDB - all stats on the Stats page are computed client-side from
that local event log, matching the original app's behavior exactly
(recency-weighted Bayesian accuracy per tone pair, Wilson-interval daily
accuracy, rolling-window accuracy trend). The stats page also keeps the
original's JSON export/import buttons for backing up/restoring that local
event log.
