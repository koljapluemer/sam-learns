# phrases CMS

Curates the phrase content served directly from `public/data/phrases/` -
unlike `world_map`, there's no separate curation source-of-truth + export
step; the CMS reads and writes those frontend-facing files in place. Per
language:

- `<iso3>.json` - every communication goal (e.g. `"Excuse me"`) ->
  `{"expressions": {target-language phrase: {"note": optional str}}}`.
- `<iso3>/audio/` - mp3s for target-language phrases, named by a plain
  slug of the phrase text (`audio.audio_filename`). Shared across every
  goal in the language, since the same phrase can appear under multiple
  goals.

See `data_io.py` for the load/save/CRUD helpers and `audio.py` for the
ElevenLabs TTS generation, both used by `app.py`.

## Curating

```
uv run streamlit run phrases/app.py
```

- **Sidebar**: pick a language, or add a new one by its ISO 639-3 code
  (e.g. `deu`, `jpn`).
- **Communication goals**: each goal is an expander holding its
  expressions (target-language phrases + optional note). Add/rename/delete
  goals and expressions; every edit needs an explicit Save/Add/Delete
  click (no save-on-blur).
- **Audio**: each expression shows its audio player if the file exists,
  or a "Generate audio" button if it's missing (picks a random
  ElevenLabs voice labeled for the language). Requires
  `ELEVENLABS_API_KEY` in a `.env` file at the repo root.

## Batch audio generation

```
uv run python phrases/scripts/generate_audio.py
```

Fills in audio for every phrase across every language that doesn't have
it yet (the CMS's "Generate audio" button does the same thing for a
single phrase). Safe to re-run - already-present audio is skipped.
