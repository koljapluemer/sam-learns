# tonepractice CMS

Curates the Mandarin content for `minimal-pairs-practice`
(`src/apps/minimal-pairs-practice/`), sourced from
[AISHELL-1](https://huggingface.co/datasets/AISHELL/AISHELL-1). AISHELL-1
has no HF `datasets` loading script and dataset-viewer/parquet conversion is
disabled upstream, so `load_dataset(...)` doesn't work for it -
`aishell_data.py` instead pulls files directly from the HF Hub repo.

```
uv run python tonepractice/build_mandarin_clips.py
```

Filters AISHELL-1's 141,600 utterances down to 4-10 hanzi-character,
pure-hanzi (no digits/Latin/punctuation) transcripts, restricted to the 100
speakers the HF mirror actually ships audio for (of the 400 referenced in
the transcript/speaker.info files - the other 300 just 404). Selects 3,000
clips, capped per speaker for voice diversity, converts each transcript to
pinyin via `pypinyin` (diacritic style - no heteronym filtering: tested and
found far too strict, drops to 474 survivors since pypinyin's heteronym
dictionary flags nearly every common function word; the default phrase-aware
best-guess is the accepted-risk choice instead), extracts and transcodes the
selected clips to mp3 via `ffmpeg`, and writes
`public/data/minimal-pairs-practice/cmn/clips.json` (`{filename, transcript:
<pinyin>, nativeScript: <hanzi>}[]`) + `cmn/audio/*.mp3`.

Downloads ~3.5GB into the local HF cache (`~/.cache/huggingface`) - run
`huggingface-cli delete-cache` afterward to reclaim that disk space, it's not
part of the repo or the deploy.

Real full-sentence audio minimal pairs (two different recordings whose
transcripts are identical except for one syllable's tone) are essentially
nonexistent in AISHELL-1 - only 11 such groups across the whole corpus, an
earlier exploration found. That's why content generation here follows
`minimal-pairs-practice`'s existing Vietnamese approach instead: one real
recording per clip, wrong answer generated as text (swap one syllable's tone
in the pinyin) rather than sourced as a second recording.

Licenses checked directly (not assumed) when this was built: AISHELL-1 is
tagged Apache License 2.0 on its HF repo, though its own dataset card
additionally describes the data as "free for academic use" - both are shown
in the app's credits. FOSD (Vietnamese) is CC BY 4.0, per its Mendeley page.
