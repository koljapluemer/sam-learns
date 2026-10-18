# greek_alphabet CMS

Generates pronunciation audio for `ancient-greek-alphabet`
(`src/apps/ancient-greek-alphabet/`). Each `public/data/greek-alphabet/<term>.webp`
image names an Ancient Greek term; the script speaks it with espeak-ng's `grc`
voice and writes `audio/<term>.mp3` plus `words.json` (the term list).

Requires `espeak-ng` and `ffmpeg` on the PATH.

```
uv run python greek_alphabet/build_audio.py           # only missing clips
uv run python greek_alphabet/build_audio.py --force   # regenerate all
```

To add a word, drop `<term>.webp` into `public/data/greek-alphabet/` and rerun.
