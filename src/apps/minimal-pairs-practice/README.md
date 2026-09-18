# Minimal Pairs Practice

Listen to a short audio clip and identify which of two near-identical tone
spellings you heard, training your ear for tone distinctions. Supports
Vietnamese and Mandarin, chosen in Settings (or on first visit).

## Architecture

Each language is a self-contained `LanguagePack` under
`entities/tone-clip/languages/` (`viet.ts`, `mandarin.ts`, registered in
`registry.ts`) - content paths, tone-key vocabulary, tone-confusion labels,
dataset credits/license, and the distractor generator that turns a clip's
"spelling" into a plausible wrong answer by swapping one tone. Everything
else (`features/practice-session`, `features/practice-stats`, the pages) is
language-agnostic and driven entirely by whichever `LanguagePack` is active.
Adding a third language means adding one more file here plus its content
folder - no other restructuring.

Vietnamese orthography already visually marks tone (diacritics on the
transcript itself), so its distractor generator mutates the transcript
directly. Hanzi doesn't - Mandarin clips instead ship a *precomputed* pinyin
string as their `transcript` (built by `cms/tonepractice/build_mandarin_clips.py`
via `pypinyin`) and carry the hanzi separately as `nativeScript`, shown per
the Settings page's "Show hanzi" preference. Both languages' distractor
generators otherwise run the same character-substitution shape, just against
different vowel-diacritic tables - see `entities/tone-clip/languages/mandarin.ts`
for the specific deviations (precomputed pinyin, neutral tone excluded from
the swap table).

## Data

`public/data/minimal-pairs-practice/<language-code>/clips.json` +
`<language-code>/audio/*.mp3`, one folder per language (`vie/`, `cmn/`).
Vietnamese content is a one-time export from
[linguanodon](https://github.com/koljapluemer/linguanodon)'s
`viettonepractice` Django app (see `docs/linguanodon-import.md` at the repo
root) - no ongoing sync. Mandarin content is curated from AISHELL-1 by
`cms/tonepractice/build_mandarin_clips.py` - see `cms/tonepractice/README.md`.

Practice events (round starts, answers, audio-listened durations, hidden
clips) are stored in this app's own Dexie table (`db/appDb.ts`, still named
`viettonepractice_practiceEvents` - kept from before this app's rename to
avoid a live Dexie Cloud schema migration) tagged with a `language` field so
both languages' history coexists in one table without mixing tone-key
vocabularies. All stats on the Stats page are computed client-side from that
local event log, filtered to the active language (recency-weighted Bayesian
accuracy per tone pair, Wilson-interval daily accuracy, rolling-window
accuracy trend). The stats page also keeps JSON export/import buttons for
backing up/restoring one language's event log at a time.
