"""Reusable processing and cache invalidation for CLI and CMS."""

from pathlib import Path

from common import video_dir
from download import download
from extract_vocab import extract_vocab
from publish import publish
from split_snippets import split_snippets


def process_video(youtube_id: str, language, on_progress=lambda _message: None) -> None:
    on_progress("Downloading audio and subtitles")
    title = download(youtube_id, language.alpha_2)
    on_progress("Splitting into snippets")
    snippets = split_snippets(youtube_id, language.alpha_2)
    on_progress("Extracting vocabulary")
    snippets = extract_vocab(youtube_id, snippets, language.name)
    on_progress("Publishing")
    publish(youtube_id, title, language.alpha_3, language.name, snippets)


STAGE_FILES = {
    "subtitles": ("info.json", "audio.*.json3", "snippets.json", "vocab.json", "vocab-cache.json"),
    "audio": ("audio.m4a", "silences.json", "snippets.json", "vocab.json", "vocab-cache.json"),
    "snippets": ("silences.json", "snippets.json", "vocab.json", "vocab-cache.json"),
    "vocabulary": ("vocab.json", "vocab-cache.json"),
}


def invalidate(youtube_id: str, stage: str) -> list[Path]:
    if stage not in STAGE_FILES:
        raise ValueError(f"Unknown processing stage: {stage}")
    removed = []
    directory = video_dir(youtube_id)
    for pattern in STAGE_FILES[stage]:
        for path in directory.glob(pattern):
            if path.is_file():
                path.unlink()
                removed.append(path)
    return removed
