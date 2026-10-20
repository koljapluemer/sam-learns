"""Write a processed video into the frontend's data folder and upsert its videos.json entry."""

from common import OUTPUT_DIR, VIDEOS_PATH, read_json, write_json


def publish(youtube_id: str, title: str, language_code: str, language_name: str, snippets: list[dict]) -> None:
    write_json(OUTPUT_DIR / "snippets" / f"{youtube_id}.json", snippets)

    videos = read_json(VIDEOS_PATH) if VIDEOS_PATH.exists() else []
    entry = {"youtubeId": youtube_id, "title": title, "languageCode": language_code, "languageName": language_name}
    videos = [v for v in videos if v["youtubeId"] != youtube_id] + [entry]
    write_json(VIDEOS_PATH, videos)
