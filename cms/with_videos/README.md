# with_videos CMS

Discovers, reviews, and publishes short YouTube videos for the `with-videos`
app. The Streamlit CMS uses the YouTube Data API for discovery, local Ollama
models for screening and diversity, and OpenAI only for vocabulary extraction
and English translation after approval.

## Setup

Set these in `cms/.env`:

```dotenv
YOUTUBE_API_KEY=...
OPENAI_API_KEY=...
# Optional; these are the defaults:
OLLAMA_BASE_URL=http://127.0.0.1:11434
WITH_VIDEOS_EMBEDDING_MODEL=qwen3-embedding:0.6b
WITH_VIDEOS_SCREENING_MODEL=qwen3.5:4b
WITH_VIDEOS_ESCALATION_MODEL=qwen3.5:9b
```

The CMS reports missing Ollama models and the commands needed to install them.
It also requires `ffmpeg` and Node on the PATH.

## CMS

From `cms/`:

```bash
uv run streamlit run with_videos/app.py
```

Language discovery profiles and trusted/blocked channel policy are tracked in
`profiles.json` and `channel-policy.json`. Candidate history, embeddings,
downloads, and processing caches stay under ignored `with_videos/data/`.

## CLI

The original resumable ingestion command remains available:

```
uv run with_videos/add_videos.py --lang vie <youtube_id> [<youtube_id> ...]
```

Per video: downloads audio + subtitles (yt-dlp), splits into 5-30s snippets on
speaking pauses (ffmpeg), extracts per-snippet vocab via OpenAI, then writes
`snippets/<id>.json` and upserts `videos.json`. Intermediate files are cached
in `with_videos/data/<id>/`, so re-runs resume.

Compare local screening models against accumulated human decisions with:

```bash
uv run with_videos/evaluate_models.py qwen3.5:4b qwen3.5:9b
```
