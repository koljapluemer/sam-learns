"""Adds YouTube videos to the comprehensible-input app.

Run via: uv run streamlit run comprehensible_input/app.py

Paste YouTube ids (one per line), pick a language, and they get appended to
public/data/comprehensible-input/videos.json. Ids already in the file are
skipped. Thumbnails, ids and language fields are derived automatically.
"""

import json
from pathlib import Path

import pycountry
import streamlit as st

VIDEOS_PATH = Path(__file__).resolve().parents[2] / "public/data/comprehensible-input/videos.json"

# alpha_3 code -> name, for languages with an ISO 639-1 code - roughly the set
# a browser language picker offers. Plain strings, since Streamlit deep-copies
# widget options and pycountry objects recurse infinitely when copied.
LANGUAGE_NAMES = dict(
    sorted(
        ((lang.alpha_3, lang.name) for lang in pycountry.languages if hasattr(lang, "alpha_2")),
        key=lambda item: item[1],
    )
)


def load_videos() -> list[dict]:
    return json.loads(VIDEOS_PATH.read_text())


def save_videos(videos: list[dict]) -> None:
    VIDEOS_PATH.write_text(json.dumps(videos, indent=2, ensure_ascii=False) + "\n")


def language_id_for(videos: list[dict], language_code: str) -> int:
    existing = next((v["languageId"] for v in videos if v["languageCode"] == language_code), None)
    if existing is not None:
        return existing
    return max((v["languageId"] for v in videos), default=0) + 1


def build_video(video_id: int, youtube_id: str, language_id: int, language_code: str) -> dict:
    return {
        "videoId": video_id,
        "youtubeId": youtube_id,
        "languageId": language_id,
        "languageName": LANGUAGE_NAMES[language_code],
        "languageCode": language_code,
        "thumbnailUrl": f"https://img.youtube.com/vi/{youtube_id}/mqdefault.jpg",
        "thumbnailUrlLarge": f"https://img.youtube.com/vi/{youtube_id}/hqdefault.jpg",
    }


def add_videos(youtube_ids: list[str], language_code: str) -> tuple[int, int]:
    videos = load_videos()
    known = {v["youtubeId"] for v in videos}
    new_ids = list(dict.fromkeys(i for i in youtube_ids if i not in known))
    language_id = language_id_for(videos, language_code)
    next_video_id = max((v["videoId"] for v in videos), default=0) + 1
    for offset, youtube_id in enumerate(new_ids):
        videos.append(build_video(next_video_id + offset, youtube_id, language_id, language_code))
    save_videos(videos)
    return len(new_ids), len(youtube_ids) - len(new_ids)


st.set_page_config(page_title="Comprehensible Input CMS")
st.title("Add videos")

ids_text = st.text_area("YouTube ids (one per line)", height=200)
language_code = st.selectbox("Language", LANGUAGE_NAMES, format_func=LANGUAGE_NAMES.get, index=None)

if st.button("Add", type="primary", disabled=language_code is None):
    youtube_ids = [line.strip() for line in ids_text.splitlines() if line.strip()]
    added, skipped = add_videos(youtube_ids, language_code)
    st.success(f"Added {added}, skipped {skipped} duplicate(s).")
