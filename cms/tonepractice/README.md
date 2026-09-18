# tonepractice CMS

Exploring [AISHELL-1](https://huggingface.co/datasets/AISHELL/AISHELL-1) as a
content source for a Mandarin tone-practice app, following the same "listen
to a clip, identify the tone" format as `minimal-pairs-practice`
(`src/apps/minimal-pairs-practice/`).

AISHELL-1 has no HF `datasets` loading script and dataset-viewer/parquet
conversion is disabled upstream, so `load_dataset(...)` doesn't work for it.
`explore_aishell.py` instead pulls files directly from the HF Hub repo: the
corpus-wide transcript + speaker registry (both small text files), plus one
speaker's wav archive as an audio sample.

```
uv run python tonepractice/explore_aishell.py [--speaker 0002]
```

Prints corpus-wide stats (utterance/speaker counts, gender split, sample
transcripts) and stats for one sample speaker's clips (clip count, durations,
a few sample clips with their transcripts).

Mandarin transcripts aren't marked for tone directly - tone practice needs
each syllable's pinyin (with tone number) derived from the hanzi transcript,
likely via a pinyin conversion library. Not yet tackled here.
