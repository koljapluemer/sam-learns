# Basic Egyptian Sentences

Timed cloze-word quiz for Egyptian Arabic sentences.

Imported from [linguanodon](https://github.com/koljapluemer/linguanodon)'s
`egyptiansentences` Django app - see `docs/linguanodon-import.md` at the repo
root for how that import works and how to replicate it for other apps.

Content (`public/data/egyptiansentences/sentences.json`) is a one-time export
from linguanodon's sqlite3 database via
`cms/egyptiansentences/import_from_linguanodon.py`. Rerun that script by hand
if the upstream content changes - there's no ongoing sync.

Sentence data from lisaanmasry.org, used under Mike Green's non-commercial
license.
