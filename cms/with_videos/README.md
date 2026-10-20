# with_videos CMS

Adds YouTube videos to the `with-videos` app (`public/data/with-videos/`):

```
uv run with_videos/add_videos.py --lang vie <youtube_id> [<youtube_id> ...]
```

Per video: downloads audio + subtitles (yt-dlp), splits into 5-30s snippets on
speaking pauses (ffmpeg), extracts per-snippet vocab via OpenAI, then writes
`snippets/<id>.json` and upserts `videos.json`. Needs `OPENAI_API_KEY` in
`cms/.env`, plus `ffmpeg` and `node` on the PATH. Intermediate files are cached
in `with_videos/data/<id>/`, so re-runs resume.
