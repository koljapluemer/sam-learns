"""Validate and publish processed videos without exposing partial processing."""

from common import OUTPUT_DIR, VIDEOS_PATH, read_json, write_json


def publish(youtube_id: str, title: str, language_code: str, language_name: str, snippets: list[dict]) -> None:
    if not snippets or not any(item.get("text", "").strip() and item.get("vocab") for item in snippets):
        raise ValueError("Video has no usable snippets")
    for snippet in snippets:
        if snippet["end"] <= snippet["start"] or len(snippet.get("vocab", [])) > 5:
            raise ValueError(f"Invalid snippet {snippet.get('id', '?')}")
    snippet_path = OUTPUT_DIR / "snippets" / f"{youtube_id}.json"
    previous_snippets = read_json(snippet_path) if snippet_path.exists() else None
    videos = read_json(VIDEOS_PATH) if VIDEOS_PATH.exists() else []
    entry = {"youtubeId": youtube_id, "title": title, "languageCode": language_code, "languageName": language_name}
    updated_videos = [v for v in videos if v["youtubeId"] != youtube_id] + [entry]
    try:
        write_json(snippet_path, snippets)
        write_json(VIDEOS_PATH, updated_videos)
    except Exception:
        if previous_snippets is None:
            snippet_path.unlink(missing_ok=True)
        else:
            write_json(snippet_path, previous_snippets)
        write_json(VIDEOS_PATH, videos)
        raise


def unpublish(youtube_id: str) -> None:
    videos = read_json(VIDEOS_PATH) if VIDEOS_PATH.exists() else []
    write_json(VIDEOS_PATH, [video for video in videos if video["youtubeId"] != youtube_id])
