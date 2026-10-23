"""Add YouTube videos to the with-videos app: download audio + subtitles, split into
snippets on speaking pauses, extract per-snippet vocab, publish to public/data/with-videos.

Run via: uv run with_videos/add_videos.py --lang vie <youtube_id> [<youtube_id> ...]

Every step caches its output in with_videos/data/<id>/, so re-running is cheap and
resumes where it stopped. A failing video is reported and skipped.
"""

import argparse
import sys
import traceback

import pycountry
from dotenv import load_dotenv

from asr import ASR_LANGUAGES
from pipeline import process_video


def add_video(youtube_id: str, language) -> None:
    process_video(youtube_id, language)


def main() -> None:
    parser = argparse.ArgumentParser(description="Add YouTube videos to the with-videos app")
    parser.add_argument("--lang", required=True, help="ISO 639-3 language code, e.g. vie")
    parser.add_argument("youtube_ids", nargs="+")
    args = parser.parse_args()

    load_dotenv()
    language = pycountry.languages.get(alpha_3=args.lang)
    if language is None or not (hasattr(language, "alpha_2") or args.lang in ASR_LANGUAGES):
        raise SystemExit(f"Unknown language (or no ISO 639-1 code and no local ASR): {args.lang}")

    failed = []
    for idx, youtube_id in enumerate(args.youtube_ids, start=1):
        print(f"[{idx}/{len(args.youtube_ids)}] {youtube_id}", file=sys.stderr)
        try:
            add_video(youtube_id, language)
        except Exception:
            traceback.print_exc()
            failed.append(youtube_id)

    print(f"Done: {len(args.youtube_ids) - len(failed)} added, {len(failed)} failed {failed or ''}")


if __name__ == "__main__":
    main()
