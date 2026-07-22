# Boring Words

FSRS flashcards for the small, unglamorous function words that hold the
language together.

Imported from [linguanodon](https://github.com/koljapluemer/linguanodon)'s
`boringwords` Django app - see `docs/linguanodon-import.md` at the repo root
for how that import works and how to replicate it for other apps.

Content (`public/data/boringwords/words.json`, `backgrounds.json`, and the
per-language photo folders) is a one-time export from linguanodon's sqlite3
database and static files via `cms/boringwords/import_from_linguanodon.py`.
Rerun that script by hand if the upstream content changes - there's no
ongoing sync.

Two languages today (`vie`, `arz`), each with its own practice deck at
`/boringwords/practice/<language>`. FSRS scheduling uses the `ts-fsrs`
package directly (same as `world-map`), not a vendored copy like
linguanodon's `fsrs.js`.
