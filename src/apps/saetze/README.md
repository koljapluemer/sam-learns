# Sätze

German cloze-sentence drills for confusable word families like
"jeder/alle/ganz".

Imported from [linguanodon](https://github.com/koljapluemer/linguanodon)'s
`saetze` Django app - see `docs/linguanodon-import.md` at the repo root for
how that import works and how to replicate it for other apps.

Content (`public/data/saetze/lessons.json` + `exercises.json`) is a one-time
export from linguanodon's sqlite3 database via
`cms/saetze/import_from_linguanodon.py`. Rerun that script by hand if the
upstream content changes - there's no ongoing sync.

The lesson is selected via a `:lessonKey` dynamic path segment on the
practice route (`/saetze/practice/<key>`), same as linguanodon's own
per-lesson practice URL - see `src/shared/shell/appRoutePath.ts` for how the
shared router piping derives a route name and skips the subnav tab for
routes with a required param.

Unlike arabicnumbers, this app has no persisted per-item progress (no Dexie
db) - practice is plain random-exercise drilling with a `logActivity` call
per correct answer, matching the original's behavior (no spaced repetition
here, just an activity-log entry per trial).
